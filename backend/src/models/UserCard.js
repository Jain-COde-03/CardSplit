import mongoose from 'mongoose';

const userCardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issuer: { type: String, required: true, trim: true, maxlength: 80 },
    cardProduct: { type: String, required: true, trim: true, maxlength: 120 },
    cardVariant: { type: String, trim: true, maxlength: 80, default: '' },
    availableCredit: { type: Number, min: 0, max: 100000000, default: null },
    creditLimit: { type: Number, min: 0, max: 100000000, default: null },
    milestone: { type: String, trim: true, maxlength: 240, default: '' },
    benefit: { type: String, trim: true, maxlength: 240, default: '' },
    ownershipVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    visibility: { type: String, enum: ['hidden', 'discoverable', 'circles_only'], default: 'hidden' },
    allowedCircleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Circle' }],
    monthlyCapPerPerson: { type: Number, min: 0, default: 25000 },
    approveEachRequest: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userCardSchema.index({ userId: 1, issuer: 1, cardProduct: 1 }, { unique: true });
userCardSchema.index({ visibility: 1, issuer: 1, cardProduct: 1 });

export default mongoose.models.UserCard || mongoose.model('UserCard', userCardSchema);
