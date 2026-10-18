import * as cheerio from 'cheerio';
import BaseScraper from './base.scraper.js';

export class AppleScraper extends BaseScraper {
  constructor() {
    super('apple');
  }

  canHandle(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return host.includes('apple.com');
    } catch {
      return false;
    }
  }

  extractProductId(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'apple-product';
    } catch {
      return null;
    }
  }

  scrapeProduct(url, html) {
    const $ = cheerio.load(html || '');
    const productId = this.extractProductId(url);

    // 1. Title
    const name =
      $('h1.rf-flagship-product-title').text().trim() ||
      $('h1').first().text().trim() ||
      'Apple Product';

    // 2. Price
    const priceText =
      $('.rc-prices-fullprice').first().text().trim() ||
      $('[data-autom="full-price"]').first().text().trim() ||
      '';
    const currentPrice = this.parsePrice(priceText);

    // 3. Image
    const imageUrl =
      $('img[class*="hero"]').first().attr('src') ||
      $('img[src*="apple.com"]').first().attr('src') ||
      null;

    const rawOffers = this.scrapeOffers(url, html);

    return {
      name,
      brand: 'Apple',
      price: currentPrice,
      currency: 'INR',
      imageUrl,
      availability: 'in_stock',
      retailer: 'apple',
      sourceUrl: url,
      canonicalProductUrl: url,
      retailerProductId: productId || 'APPLE_ITEM',
      retrievedAt: new Date().toISOString(),
      verificationStatus: 'verified',
      description: 'Official Apple Store product listing with bank cashback eligibility.',
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
    $('[data-autom*="offer"], .rf-tradein-footnote, .footnote').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.toLowerCase().includes('cashback') || text.toLowerCase().includes('hdfc') || text.toLowerCase().includes('instant')) {
        offers.push({
          title: text.slice(0, 200),
          source: 'page_scrape',
          retailer: 'apple',
        });
      }
    });
    return offers;
  }
}

export default AppleScraper;

