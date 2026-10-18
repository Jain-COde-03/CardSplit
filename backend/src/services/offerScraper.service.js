/**
 * Offer Scraper Service.
 * Normalizes unstructured text lines extracted from retailer pages into
 * candidate credit-card offer structures for comparison.
 */
export class OfferScraperService {
  /**
   * Identifies the bank name from offer description text.
   */
  /**
   * Identifies the bank name from offer description text.
   */
  detectBank(text) {
    const lower = text.toLowerCase();
    if (lower.includes('hdfc')) return 'HDFC Bank';
    if (lower.includes('amazon pay') || lower.includes('icici')) return 'ICICI Bank';
    if (lower.includes('sbi')) return 'SBI Card';
    if (lower.includes('axis')) return 'Axis Bank';
    if (lower.includes('kotak')) return 'Kotak Mahindra Bank';
    if (lower.includes('onecard')) return 'OneCard';
    if (lower.includes('hsbc')) return 'HSBC';
    if (lower.includes('federal')) return 'Federal Bank';
    if (lower.includes('amex') || lower.includes('american express')) return 'American Express';
    if (lower.includes('bob') || lower.includes('bank of baroda')) return 'Bank of Baroda';
    if (lower.includes('indusind')) return 'IndusInd Bank';
    return 'Bank Partner';
  }

  /**
   * Parses offer text into structured discount parameters.
   */
  parseOfferDetails(rawOffer, index = 0) {
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
      // Detect flat amount (e.g. "Up to ₹4,000.00 discount" or "Flat ₹500 off" or "₹1,799.00 cashback")
      const flatMatch = text.match(/(?:flat|upto|up\s*to)?\s*(?:₹|rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
      if (flatMatch) {
        discountType = isCashback ? 'cashback_flat' : isEmi ? 'emi_discount' : 'instant_discount_flat';
        discountValue = parseFloat(flatMatch[1].replace(/,/g, ''));
      }
    }
    if (isEmi && !isCashback && percentMatch) discountType = 'emi_discount';

    // Detect maximum cap (e.g. "up to ₹1,500" or "upto Rs 2000" or "upto ₹4,000.00")
    const capMatch = text.match(/up\s*to\s*(?:₹|rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
    if (capMatch) {
      maximumDiscount = parseFloat(capMatch[1].replace(/,/g, ''));
      if (discountValue === 0) discountValue = maximumDiscount;
    }

    // Detect minimum purchase (e.g. "on orders of ₹5,000 and above" or "Min purchase value ₹50,000")
    const minMatch = text.match(
      /(?:on\s*(?:orders|purchase)\s*(?:of|above)|min(?:imum)?\s*(?:spend|purchase(?:\s*value)?))\s*(?:₹|rs\.?)\s*([\d,]+)/i
    );
    if (minMatch) {
      minimumPurchase = parseFloat(minMatch[1].replace(/,/g, ''));
    }

    // Friendly card name and monogram
    let cardName = `${bank} Credit Card`;
    const lowerText = text.toLowerCase();
    if (lowerText.includes('amazon pay')) cardName = 'Amazon Pay ICICI Card';
    else if (lowerText.includes('flipkart axis')) cardName = 'Flipkart Axis Bank Card';
    else if (lowerText.includes('millennia')) cardName = 'HDFC Millennia Credit Card';
    else if (lowerText.includes('simplyclick')) cardName = 'SBI SimplyCLICK Credit Card';
    else if (isEmi) cardName = `${bank} No Cost EMI Card`;

    const bankMonogram = bank === 'ICICI Bank' ? 'ICICI' : bank === 'HDFC Bank' ? 'HDFC' : bank === 'SBI Card' ? 'SBI' : bank === 'Axis Bank' ? 'AXIS' : bank.slice(0, 4).toUpperCase();

    const uniqueId = `offer-${bank.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index}`;

    const badge = discountType.includes('percentage')
      ? `${discountValue}% OFF`
      : discountValue > 0
        ? `₹${discountValue.toLocaleString('en-IN')} OFF`
        : 'SPECIAL OFFER';

    return {
      id: uniqueId,
      title: text,
      bank,
      bankMonogram,
      cardName,
      badge,
      description: text,
      discountType,
      discountValue,
      maximumDiscount: maximumDiscount || discountValue,
      minimumPurchase,
      verificationStatus: 'verified',
      retailer: rawOffer.retailer || 'amazon',
      source: 'retailer_scrape',
    };
  }

  /**
   * Normalizes an array of raw offer items.
   */
  normalizeOffers(rawOffers = []) {
    return rawOffers.map((offer, idx) => this.parseOfferDetails(offer, idx));
  }
}

export const offerScraperService = new OfferScraperService();
export default offerScraperService;
