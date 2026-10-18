import mongoose from 'mongoose';

const circleRequestSchema = new mongoose.Schema(
  {
    circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
    shopperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopperName: { type: String, required: true },
    shopperAvatar: { type: String, default: '' },
    productTitle: { type: String, required: true, trim: true, maxlength: 200 },
    merchant: { type: String, required: true, trim: true, maxlength: 80, default: 'Amazon.in' },
    requiredBank: { type: String, required: true, trim: true, maxlength: 80 },
    orderAmount: { type: Number, required: true, min: 1 },
    instantDiscount: { type: Number, required: true, min: 0 },
    netPayable: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['open', 'accepted', 'fulfilled', 'settled', 'cancelled'],
      default: 'open',
      index: true,
    },
    acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedByName: { type: String, default: '' },
    acceptedByCard: { type: String, default: '' },
    trustTier: {
      type: String,
      enum: ['friend', 'friend_of_friend', 'stranger'],
      default: 'friend',
    },
  },
  { timestamps: true }
);

circleRequestSchema.index({ circleId: 1, status: 1, createdAt: -1 });

export default mongoose.models.CircleRequest || mongoose.model('CircleRequest', circleRequestSchema);

