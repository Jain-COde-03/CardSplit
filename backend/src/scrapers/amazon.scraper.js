import * as cheerio from 'cheerio';
import BaseScraper from './base.scraper.js';

export class AmazonScraper extends BaseScraper {
  constructor() {
    super('amazon');
  }

  canHandle(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return host.includes('amazon') || host.includes('amzn');
    } catch {
      return false;
    }
  }

  extractProductId(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;

      const dpMatch = pathname.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
      if (dpMatch && dpMatch[1]) {
        return dpMatch[1].toUpperCase();
      }

      const rawMatch = pathname.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
      if (rawMatch && rawMatch[1]) {
        return rawMatch[1].toUpperCase();
      }

      return null;
    } catch {
      return null;
    }
  }

  scrapeProduct(url, html) {
    const $ = cheerio.load(html || '');
    const asin = this.extractProductId(url);

    // 1. Extract Product Title
    const name =
      $('#productTitle').text().trim() ||
      $('#title').text().trim() ||
      $('h1.a-size-large').text().trim() ||
      'Amazon Product';

    // 2. Extract Price (prioritize JSON-LD and priceToPay over list price / basisPrice)
    let jsonLdPrice = 0;
    try {
      $('script[type="application/ld+json"]').each((_, el) => {
        const text = $(el).html();
        if (text) {
          const json = JSON.parse(text);
          const item = Array.isArray(json) ? json.find((i) => i.offers) : json;
          const offers = item?.offers || (item?.['@graph'] && item['@graph'].find((g) => g?.offers)?.offers);
          if (offers) {
            const rawP = Array.isArray(offers) ? offers[0].price : offers.price;
            if (rawP) jsonLdPrice = parseFloat(rawP);
          }
        }
      });
    } catch {}

    let priceText = '';
    const priceCandidates = [
      $('#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen').first().text().trim(),
      $('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen').first().text().trim(),
      $('#corePriceDisplay_desktop_feature_div .a-price-whole').first().text().trim(),
      $('#corePrice_desktop .priceToPay .a-offscreen').first().text().trim(),
      $('#corePrice_desktop .a-price .a-offscreen').first().text().trim(),
      $('#corePrice_desktop .a-price-whole').first().text().trim(),
      $('#apex_desktop .priceToPay .a-offscreen').first().text().trim(),
      $('#apex_desktop .a-price .a-offscreen').first().text().trim(),
      $('#apex_desktop .a-price-whole').first().text().trim(),
      $('.priceToPay .a-offscreen').first().text().trim(),
      $('.priceToPay .a-price-whole').first().text().trim(),
      $('#priceblock_dealprice').text().trim(),
      $('#priceblock_ourprice').text().trim(),
      $('#priceblock_saleprice').text().trim(),
      $('span[data-a-color="price"] span.a-offscreen').first().text().trim(),
      $('.a-price.aok-align-center .a-offscreen').first().text().trim(),
      $('.a-price.aok-align-center .a-price-whole').first().text().trim(),
    ];

    for (const cand of priceCandidates) {
      if (cand && /\d/.test(cand)) {
        priceText = cand;
        break;
      }
    }

    if (!priceText) {
      $('.a-price .a-offscreen, .a-price .a-price-whole').each((_, el) => {
        const parent = $(el).closest('.a-text-price, .basisPrice, .savingPriceOverride');
        if (parent.length === 0 && !priceText) {
          const t = $(el).text().trim();
          if (t && /\d/.test(t)) {
            priceText = t;
          }
        }
      });
    }

    let currentPrice = jsonLdPrice > 0 ? jsonLdPrice : this.parsePrice(priceText);

    // Also extract M.R.P. if present
    const mrpText =
      $('.basisPrice .a-offscreen').first().text().trim() ||
      $('.a-text-price .a-offscreen').first().text().trim() ||
      '';
    const mrpPrice = this.parsePrice(mrpText);

    // 3. Extract Brand
    let brand =
      $('#bylineInfo').text().replace(/^(Brand:|Visit the|Store:)/i, '').trim() ||
      $('.po-brand .a-span9').text().trim() ||
      '';

    // 4. Extract Image URL
    let imageUrl =
      $('#landingImage').attr('data-old-hires') ||
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('src') ||
      null;

    // 5. Extract Availability
    const availText = $('#availability').text().toLowerCase().trim();
    let availability = 'in_stock';
    if (availText.includes('currently unavailable') || availText.includes('out of stock')) {
      availability = 'out_of_stock';
    }

    // 6. Canonical URL - preserve exact submitted URL from retailer
    const canonical = url;

    // 7. Extract Offers from HTML
    const rawOffers = this.scrapeOffers(url, html);

    return {
      name,
      brand: brand || null,
      price: currentPrice,
      currency: 'INR',
      imageUrl,
      availability,
      retailer: 'amazon',
      sourceUrl: url,
      canonicalProductUrl: canonical,
      retailerProductId: asin || 'UNKNOWN_ASIN',
      retrievedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      description: $('#feature-bullets').text().trim().slice(0, 500) || null,
      category: 'Electronics',
      productIdentifiers: {
        asin: asin || undefined,
      },
      rawOffers,
    };
  }

  scrapeOffers(url, html) {
    if (!html) return [];
    const $ = cheerio.load(html);
    const offers = [];
    const offerPattern = /bank offer|credit card|debit card|instant discount|cashback|no cost emi|\b\d+(?:\.\d+)?%\s*(?:off|discount)/i;
    const selectors = [
      '#itembox-InstantBankDiscount',
      '#itembox-Cashback',
      '#itembox-NoCostEMI',
      '.offers-items',
      '.bank-offers',
      '[id*="itembox-"]',
      '[id*="bank-offer"]',
      '[id*="promotion"]',
      '[id*="promo"]',
      '[data-cel-widget*="promotion"]',
      '[data-feature-name*="promotion"]',
      '.vsx-offers-summary',
      'li.a-carousel-card',
    ].join(', ');
    const candidates = $(selectors).toArray();

    // Prefer innermost blocks with offer text
    const leafCandidates = candidates.filter((el) => {
      const descendants = $(el).find(selectors).toArray();
      return !descendants.some((child) => offerPattern.test($(child).text().replace(/\s+/g, ' ').trim()));
    });

    for (const el of leafCandidates) {
      let text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!offerPattern.test(text)) continue;

      // Clean redundant prefixes/suffixes from Amazon carousel text
      text = text
        .replace(/^Bank Offer\s*/i, '')
        .replace(/\s*Bank Offer$/i, '')
        .replace(/\s*\d+\s*offers?$/i, '')
        .replace(/\s*No Cost EMI$/i, '')
        .replace(/\s*Cashback$/i, '')
        .trim();

      if (!text || text.length < 5) continue;
      const title = text.slice(0, 300);
      if (offers.some((offer) => offer.title === title)) continue;
      offers.push({ title, source: 'page_scrape', retailer: 'amazon' });
      if (offers.length === 10) break;
    }

    return offers;
  }
}

export default AmazonScraper;

