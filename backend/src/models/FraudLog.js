import mongoose from 'mongoose';

const FraudLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
    type: { type: String, required: true },
    details: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('FraudLog', FraudLogSchema);
