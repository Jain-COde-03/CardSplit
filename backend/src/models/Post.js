import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null, index: true },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['published', 'removed'], default: 'published' },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, createdAt: -1 });
export default mongoose.models.Post || mongoose.model('Post', postSchema);
