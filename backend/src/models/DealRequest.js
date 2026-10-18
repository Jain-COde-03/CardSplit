import mongoose from 'mongoose';

const dealRequestSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cardholderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserCard', required: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductAnalysis', required: true },
  offerIndex: { type: Number, required: true, min: 0 },
  product: { type: mongoose.Schema.Types.Mixed, required: true },
  offer: { type: mongoose.Schema.Types.Mixed, required: true },
  calculation: {
    listedPrice: { type: Number, required: true },
    eligibleDiscount: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    platformCommissionPercent: { type: Number, required: true, default: 10 },
    platformCommissionAmount: { type: Number, required: true, default: 0 },
    cardholderPayout: { type: Number, required: true, default: 0 },
    netPayable: { type: Number, required: true },
    estimatedSavings: { type: Number, required: true },
  },
  deliveryAddress: {
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    addressLine: { type: String, required: true, trim: true, maxlength: 240 },
    pincode: { type: String, required: true, trim: true, maxlength: 10 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
  },
  status: { type: String, enum: ['requested', 'agreed', 'escrow_funded', 'order_placed', 'delivered', 'completed', 'declined'], default: 'requested', index: true },
  escrow: {
    mode: { type: String, enum: ['demo'], default: 'demo' },
    amount: { type: Number, default: null },
    fundedAt: { type: Date, default: null },
    releasedAmount: { type: Number, default: null },
    platformAmount: { type: Number, default: null },
    refundedAmount: { type: Number, default: null },
    refundedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
  },
  order: {
    reference: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    carrier: { type: String, default: '' },
    estimatedDelivery: { type: String, default: '' },
    placedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    verified: { type: Boolean, default: false },
  },
  rating: {
    score: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, trim: true, maxlength: 500, default: '' },
    createdAt: { type: Date, default: null },
  },
  events: [{ type: { type: String, required: true }, actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, note: { type: String, default: '' }, createdAt: { type: Date, default: Date.now } }],
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, default: '' },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true, optimisticConcurrency: true });

dealRequestSchema.index({ buyerId: 1, createdAt: -1 });
dealRequestSchema.index({ cardholderId: 1, createdAt: -1 });

export default mongoose.models.DealRequest || mongoose.model('DealRequest', dealRequestSchema);
