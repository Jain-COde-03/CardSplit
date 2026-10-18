import * as cheerio from 'cheerio';
import BaseScraper from './base.scraper.js';

export class CromaScraper extends BaseScraper {
  constructor() {
    super('croma');
  }

  canHandle(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return host.includes('croma');
    } catch {
      return false;
    }
  }

  extractProductId(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/p\/(\d+)/i) || parsed.pathname.match(/\/(\d{5,})/i);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  scrapeProduct(url, html) {
    const $ = cheerio.load(html || '');
    const productId = this.extractProductId(url);

    // 1. Title
    const name =
      $('h1.pd-title').text().trim() ||
      $('h1').first().text().trim() ||
      'Croma Product';

    // 2. Price
    const priceText =
      $('span.amount').first().text().trim() ||
      $('.pd-price .amount').text().trim() ||
      $('span[data-testid="new-price"]').text().trim() ||
      '';
    const currentPrice = this.parsePrice(priceText);

    // 3. Brand
    const brand = $('h1.pd-title').text().split(' ')[0] || 'Croma';

    // 4. Image
    const imageUrl =
      $('img.product-img').attr('src') ||
      $('img[src*="croma.com"]').first().attr('src') ||
      null;

    const rawOffers = this.scrapeOffers(url, html);

    return {
      name,
      brand,
      price: currentPrice,
      currency: 'INR',
      imageUrl,
      availability: 'in_stock',
      retailer: 'croma',
      sourceUrl: url,
      canonicalProductUrl: url,
      retailerProductId: productId || 'CROMA_ITEM',
      retrievedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      description: $('.product-details').text().trim().slice(0, 500) || null,
      category: 'Electronics',
      productIdentifiers: {
        sku: productId || undefined,
      },
      rawOffers,
    };
  }

  scrapeOffers(url, html) {
    if (!html) return [];
    const $ = cheerio.load(html);
    const offers = [];
    $('.bank-offer-item, .offer-text, .offers-list li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.toLowerCase().includes('discount') || text.toLowerCase().includes('bank') || text.toLowerCase().includes('cashback')) {
        offers.push({
          title: text.slice(0, 200),
          source: 'page_scrape',
          retailer: 'croma',
        });
      }
    });
    return offers;
  }
}

export default CromaScraper;

