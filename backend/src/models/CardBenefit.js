import mongoose from 'mongoose';

// General retailer benefits only: product-specific promotions belong to the scraped analysis.
const schema = new mongoose.Schema({
  bank: { type: String, required: true },
  cardName: { type: String, required: true },
  title: { type: String, required: true },
  retailer: { type: String, trim: true, required: true },
  discountType: { type: String, enum: ['instant_discount_flat', 'instant_discount_percentage'], required: true },
  discountValue: { type: Number, min: 0, required: true },
  minimumPurchase: { type: Number, min: 0, required: true },
  maximumDiscount: { type: Number, min: 0 },
  sourceUrl: { type: String, required: true },
  verifiedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.CardBenefit || mongoose.model('CardBenefit', schema);
