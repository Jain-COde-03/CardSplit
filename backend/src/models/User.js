import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    isShowcase: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
    profile: {
      avatarUrl: { type: String, trim: true, default: '' },
      avatarPublicId: { type: String, trim: true, select: false },
      bio: { type: String, trim: true, maxlength: 500, default: '' },
      city: { type: String, trim: true, maxlength: 100, default: '' },
      dealFeePercent: { type: Number, min: 0, max: 100, default: null },
      responseMinutes: { type: Number, min: 0, max: 10080, default: null },
      cardholderDiscovery: { type: Boolean, default: false },
    },
    accountStatus: { type: String, enum: ['active', 'suspended', 'deactivated'], default: 'active' },
  },
  { timestamps: true, strict: true }
);

userSchema.index({ accountStatus: 1, 'profile.cardholderDiscovery': 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
