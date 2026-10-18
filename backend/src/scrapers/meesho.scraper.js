import * as cheerio from 'cheerio';
import BaseScraper from './base.scraper.js';

export class MeeshoScraper extends BaseScraper {
  constructor() {
    super('meesho');
  }

  canHandle(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return host.includes('meesho');
    } catch {
      return false;
    }
  }

  extractProductId(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/p\/([a-zA-Z0-9]+)/i);
      return match && match[1] ? match[1].toLowerCase() : null;
    } catch {
      return null;
    }
  }

  scrapeProduct(url, html) {
    const $ = cheerio.load(html || '');
    const productId = this.extractProductId(url);

    // 1. Extract Name
    const name =
      $('h1').first().text().trim() ||
      $('h4').first().text().trim() ||
      'Meesho Product';

    // 2. Extract Price
    let priceText =
      $('h5').filter((_, el) => $(el).text().includes('₹')).first().text().trim() ||
      $('h4').filter((_, el) => $(el).text().includes('₹')).first().text().trim() ||
      '';

    let currentPrice = this.parsePrice(priceText);

    // 3. Extract Image
    let imageUrl =
      $('img[src*="meesho"]').first().attr('src') ||
      $('img').first().attr('src') ||
      null;

    return {
      name,
      brand: null,
      price: currentPrice,
      currency: 'INR',
      imageUrl,
      availability: 'in_stock',
      retailer: 'meesho',
      sourceUrl: url,
      canonicalProductUrl: url,
      retailerProductId: productId || 'UNKNOWN_MEESHO_ID',
      retrievedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      description: null,
      category: 'Fashion & Apparel',
      productIdentifiers: {
        sku: productId || undefined,
      },
      rawOffers: [],
    };
  }

  scrapeOffers(_url, _html) {
    return [];
  }
}

export default MeeshoScraper;
