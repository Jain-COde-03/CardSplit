import * as cheerio from 'cheerio';
import BaseScraper from './base.scraper.js';

export class FlipkartScraper extends BaseScraper {
  constructor() {
    super('flipkart');
  }

  canHandle(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return host.includes('flipkart');
    } catch {
      return false;
    }
  }

  extractProductId(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);

      // Check PID query param first (Flipkart standard)
      const pid = parsed.searchParams.get('pid');
      if (pid) return pid.toUpperCase();

      // Check /p/itm... in pathname
      const itmMatch = parsed.pathname.match(/\/p\/([a-zA-Z0-9]+)/i);
      if (itmMatch && itmMatch[1]) {
        return itmMatch[1].toUpperCase();
      }

      return null;
    } catch {
      return null;
    }
  }

  scrapeProduct(url, html) {
    const $ = cheerio.load(html || '');
    const productId = this.extractProductId(url);

    // 1. Extract Name
    const name =
      $('span.VU-ZEz').text().trim() ||
      $('span.B_NuCI').text().trim() ||
      $('h1.yhB1nd').text().trim() ||
      'Flipkart Product';

    // 2. Extract Price
    let priceText =
      $('div.Nx9bqj.CxhGGd').first().text().trim() ||
      $('div._30jeq3._16Jk6d').first().text().trim() ||
      $('div._30jeq3').first().text().trim() ||
      '';

    let currentPrice = this.parsePrice(priceText);

    // 3. Extract Brand
    let brand = $('span.G6XhRU').text().trim() || '';

    // 4. Extract Image
    let imageUrl =
      $('img._396cs4._2amPTt').attr('src') ||
      $('img.DByuf4').attr('src') ||
      $('img._2r_T1I').attr('src') ||
      null;

    // 5. Extract Availability
    const htmlText = $.text().toLowerCase();
    let availability = 'in_stock';
    if (htmlText.includes('sold out') || htmlText.includes('currently out of stock')) {
      availability = 'out_of_stock';
    }

    // 6. Canonical URL
    const canonical = productId
      ? `https://www.flipkart.com/product/p/itm?pid=${productId}`
      : url;

    // 7. Extract Offers
    const rawOffers = this.scrapeOffers(url, html);

    return {
      name,
      brand: brand || null,
      price: currentPrice,
      currency: 'INR',
      imageUrl,
      availability,
      retailer: 'flipkart',
      sourceUrl: url,
      canonicalProductUrl: canonical,
      retailerProductId: productId || 'UNKNOWN_FSN',
      retrievedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      description: null,
      category: 'General',
      productIdentifiers: {
        fsn: productId || undefined,
      },
      rawOffers,
    };
  }

  scrapeOffers(url, html) {
    if (!html) return [];
    const $ = cheerio.load(html);
    const offers = [];

    // Common Flipkart offer list items
    $('li.col.col-12-12, span._3j4vdM, span[class*="offer"]').each((idx, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (
        text.toLowerCase().includes('bank offer') ||
        text.toLowerCase().includes('discount') ||
        text.toLowerCase().includes('cashback')
      ) {
        offers.push({
          title: text.slice(0, 150),
          source: 'page_scrape',
          retailer: 'flipkart',
        });
      }
    });

    return offers.slice(0, 5);
  }
}

export default FlipkartScraper;

