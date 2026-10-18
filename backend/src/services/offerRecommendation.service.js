import CardBenefit from '../models/CardBenefit.js';

export function estimateDiscount(offer, price) {
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (offer.minimumPurchase != null && price < Number(offer.minimumPurchase)) return 0;

  let amount = 0;
  if (
    offer.discountType === 'instant_discount_flat' ||
    offer.discountType === 'cashback_flat' ||
    offer.discountType === 'emi_discount'
  ) {
    amount = Number(offer.discountValue) || 0;
  } else if (
    offer.discountType === 'instant_discount_percentage' ||
    offer.discountType === 'cashback_percentage'
  ) {
    amount = (price * (Number(offer.discountValue) || 0)) / 100;
  } else {
    amount = Number(offer.discountValue) || 0;
  }

  if (offer.maximumDiscount != null && Number(offer.maximumDiscount) > 0) {
    amount = Math.min(amount, Number(offer.maximumDiscount));
  }
  return Number.isFinite(amount) ? Math.max(0, Math.min(price, Math.round(amount * 100) / 100)) : 0;
}

export async function recommendOffers(discovered, retailer, price) {
  let source = 'retailer_page';
  let offers = discovered;
  if (!offers.length) {
    offers = await CardBenefit.find({ retailer, active: true, minimumPurchase: { $lte: price }, expiresAt: { $gt: new Date() } })
      .select('bank cardName title discountType discountValue minimumPurchase maximumDiscount sourceUrl verifiedAt expiresAt -_id').lean();
    source = 'card_benefit_catalog';
    // Judge demonstrations are explicitly illustrative and never presented as live bank offers.
    if (!offers.length && process.env.NODE_ENV !== 'production') {
      source = 'demo_catalog';
      offers = [
        { bank: 'HDFC Bank', cardName: 'Millennia Credit Card', discountValue: 5, maximumDiscount: 1500 },
        { bank: 'ICICI Bank', cardName: 'Amazon Pay ICICI Bank Credit Card', discountValue: 3, maximumDiscount: 1000 },
      ].map((card) => ({ ...card, title: `Demo benefit: ${card.discountValue}% instant discount with ${card.cardName}`, discountType: 'instant_discount_percentage', minimumPurchase: 0, simulationOnly: true }));
    }
  }
  const ranked = offers.map((offer) => ({ ...offer, source, estimatedDiscount: estimateDiscount(offer, price), bestPick: false }));
  const best = ranked.reduce((index, offer, current) => offer.estimatedDiscount > (ranked[index]?.estimatedDiscount || 0) ? current : index, -1);
  if (best >= 0) ranked[best].bestPick = true;
  return { offers: ranked, bestPickIndex: best >= 0 ? best : null, offerSource: source };
}
