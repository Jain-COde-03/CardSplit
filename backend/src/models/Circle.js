import mongoose from 'mongoose';

const vouchSchema = new mongoose.Schema(
  {
    vouchedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vouchedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, maxlength: 200, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const circleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    type: {
      type: String,
      enum: ['Family', 'Hostel Gang', 'Office', 'Flatmates', 'Club', 'General'],
      default: 'General',
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    vouches: [vouchSchema],
    totalSaved: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

circleSchema.index({ memberIds: 1 });

export default mongoose.models.Circle || mongoose.model('Circle', circleSchema);

