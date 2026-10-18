import mongoose from 'mongoose';

const circleLedgerSchema = new mongoose.Schema(
  {
    circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromUserName: { type: String, required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    discountSaved: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
      index: true,
    },
    upiId: { type: String, default: '' },
    settledAt: { type: Date, default: null },
    upiRef: { type: String, default: '' },
  },
  { timestamps: true }
);

circleLedgerSchema.index({ circleId: 1, status: 1, createdAt: -1 });

export default mongoose.models.CircleLedger || mongoose.model('CircleLedger', circleLedgerSchema);

