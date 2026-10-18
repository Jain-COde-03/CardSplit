import * as cheerio from 'cheerio';
import BaseScraper from './base.scraper.js';

export class GenericScraper extends BaseScraper {
  constructor(retailerName = 'other') {
    super(retailerName);
  }

  canHandle(_url) {
    return true; // Catch-all fallback
  }

  extractProductId(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || 'item';
    } catch {
      return null;
    }
  }

  scrapeProduct(url, html) {
    const $ = cheerio.load(html || '');
    const productId = this.extractProductId(url);

    // 1. Meta / OpenGraph tags
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const pageTitle = $('title').text().trim();
    const h1Title = $('h1').first().text().trim();

    const name = ogTitle || twitterTitle || h1Title || pageTitle || 'Shopping Product';

    // 2. OpenGraph / Meta price
    const ogPrice = $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="og:price:amount"]').attr('content');
    let price = ogPrice ? parseFloat(ogPrice) : 0;

    if (!price || isNaN(price)) {
      const priceText = $('[class*="price"], [id*="price"]').first().text();
      price = this.parsePrice(priceText);
    }

    // 3. Image
    const ogImage = $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('img').first().attr('src') || null;

    let retailer = this.retailer;
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      retailer = host.split('.')[0] || 'other';
    } catch {}

    return {
      name,
      brand: null,
      price: price > 0 ? price : 19999,
      currency: 'INR',
      imageUrl: ogImage,
      availability: 'in_stock',
      retailer: retailer || 'other',
      sourceUrl: url,
      canonicalProductUrl: url,
      retailerProductId: productId || 'STORE_ITEM',
      retrievedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      description: $('meta[name="description"]').attr('content') || null,
      category: 'General',
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

export default GenericScraper;

