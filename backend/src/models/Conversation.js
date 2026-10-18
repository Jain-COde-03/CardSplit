import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
