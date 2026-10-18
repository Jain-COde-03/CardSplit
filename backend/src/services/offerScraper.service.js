/**
 * Offer Scraper Service.
 * Normalizes unstructured text lines extracted from retailer pages into
 * candidate credit-card offer structures for comparison.
 */
export class OfferScraperService {
  /**
   * Identifies the bank name from offer description text.
   */
  detectBank(text) {
    const lower = text.toLowerCase();
    if (lower.includes('hdfc')) return 'HDFC Bank';
    if (lower.includes('icici')) return 'ICICI Bank';
    if (lower.includes('sbi')) return 'SBI Card';
    if (lower.includes('axis')) return 'Axis Bank';
    if (lower.includes('kotak')) return 'Kotak Mahindra Bank';
    if (lower.includes('amazon pay')) return 'ICICI Bank';
    if (lower.includes('flipkart axis')) return 'Axis Bank';
    if (lower.includes('onecard')) return 'OneCard';
    if (lower.includes('hsbc')) return 'HSBC';
    if (lower.includes('bob') || lower.includes('bank of baroda')) return 'Bank of Baroda';
    return 'Other Bank';
  }

  /**
   * Parses offer text into structured discount parameters.
   */
  parseOfferDetails(rawOffer) {
    const text = typeof rawOffer === 'string' ? rawOffer : rawOffer.title || '';
    const bank = this.detectBank(text);

    let discountType = 'instant_discount_percentage';
    let discountValue = 0;
    let maximumDiscount = null;
    let minimumPurchase = 0;
    const isCashback = text.toLowerCase().includes('cashback');
    const emiText = text.replace(/\bnon[\s-]+emi\b/gi, '');
    const isEmi = /\bemi\b|equated monthly instal{1,2}ments?/i.test(emiText);

    // Detect percentage (e.g. "10% Instant Discount" or "5% Cashback")
    const percentMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:instant\s*discount|off|cashback)/i);
    if (percentMatch) {
      discountValue = parseFloat(percentMatch[1]);
      if (isCashback) {
        discountType = 'cashback_percentage';
      } else if (isEmi) {
        discountType = 'emi_discount';
      }
    } else {
      // Detect flat amount (e.g. "₹1,500 Instant Discount" or "Flat ₹500 off")
      const flatMatch = text.match(/(?:flat\s*)?(?:₹|rs\.?)\s*([\d,]+)/i);
      if (flatMatch) {
        discountType = isCashback ? 'cashback_flat' : isEmi ? 'emi_discount' : 'instant_discount_flat';
        discountValue = parseFloat(flatMatch[1].replace(/,/g, ''));
      }
    }
    if (isEmi && !isCashback && percentMatch) discountType = 'emi_discount';

    // Detect maximum cap (e.g. "up to ₹1,500" or "upto Rs 2000")
    const capMatch = text.match(/up\s*to\s*(?:₹|rs\.?)\s*([\d,]+)/i);
    if (capMatch) {
      maximumDiscount = parseFloat(capMatch[1].replace(/,/g, ''));
    }

    // Detect minimum purchase (e.g. "on orders of ₹5,000 and above" or "Min purchase value ₹50,000")
    const minMatch = text.match(
      /(?:on\s*(?:orders|purchase)\s*(?:of|above)|min(?:imum)?\s*(?:spend|purchase(?:\s*value)?))\s*(?:₹|rs\.?)\s*([\d,]+)/i
    );
    if (minMatch) {
      minimumPurchase = parseFloat(minMatch[1].replace(/,/g, ''));
    }

    return {
      title: text,
      bank,
      discountType,
      discountValue,
      maximumDiscount,
      minimumPurchase,
      verificationStatus: 'unverified', // Scraped offers are candidate until confirmed
      retailer: rawOffer.retailer || 'all',
      source: 'web_scrape',
    };
  }

  /**
   * Normalizes an array of raw offer items.
   */
  normalizeOffers(rawOffers = []) {
    return rawOffers.map((offer) => this.parseOfferDetails(offer));
  }
}

export const offerScraperService = new OfferScraperService();
export default offerScraperService;
