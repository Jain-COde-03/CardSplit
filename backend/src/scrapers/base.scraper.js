/**
 * Base abstract scraper class.
 * Every retailer scraper extends this base class to ensure a strictly
 * normalized output format for product details and offer extraction.
 */
export class BaseScraper {
  constructor(retailerName) {
    if (!retailerName) {
      throw new Error('A retailer name must be specified for the scraper.');
    }
    this.retailer = retailerName;
  }

  /**
   * Determines if this scraper can process the given URL.
   * @param {string} url
   * @returns {boolean}
   */
  canHandle(_url) {
    throw new Error(`canHandle() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Extracts the unique retailer product identifier (e.g. ASIN, FSN) from the URL.
   * @param {string} _url
   * @returns {string|null}
   */
  extractProductId(_url) {
    throw new Error(`extractProductId() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Parses the HTML content and returns a normalized product object.
   * @param {string} _url
   * @param {string} _html
   * @returns {object}
   */
  scrapeProduct(_url, _html) {
    throw new Error(`scrapeProduct() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Extracts any bank/card promotions present on the product page.
   * @param {string} _url
   * @param {string} _html
   * @returns {Array<object>}
   */
  scrapeOffers(_url, _html) {
    return [];
  }

  /**
   * Cleans and converts currency strings into clean numbers.
   * E.g. "₹54,999.00" -> 54999
   */
  parsePrice(rawPrice) {
    if (typeof rawPrice === 'number') return rawPrice;
    if (!rawPrice || typeof rawPrice !== 'string') return 0;

    // Strip commas and extract first valid numeric floating point value
    const cleaned = rawPrice.replace(/,/g, '').trim();
    const match = cleaned.match(/\d+(?:\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}

export default BaseScraper;
