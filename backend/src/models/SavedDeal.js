import mongoose from 'mongoose';

const savedDealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductAnalysis', default: null },
    offerSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

savedDealSchema.index({ userId: 1, analysisId: 1, 'offerSnapshot.title': 1 });

export default mongoose.models.SavedDeal || mongoose.model('SavedDeal', savedDealSchema);
