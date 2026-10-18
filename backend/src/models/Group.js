import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

groupSchema.index({ visibility: 1, createdAt: -1 });
export default mongoose.models.Group || mongoose.model('Group', groupSchema);
