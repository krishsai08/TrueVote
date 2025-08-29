import mongoose from 'mongoose';
const VoteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  option: { type: String, required: true },  // renamed
  verifiedByFace: { type: Boolean, default: false },
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

VoteSchema.index({ electionId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Vote', VoteSchema);
