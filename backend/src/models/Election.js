import mongoose from 'mongoose';

const ElectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  candidates: [{ type: String, required: true }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['scheduled','active','completed','suspended'], default: 'scheduled' },
  eligibleAgeGroups: [
    {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    }
  ],
  resultsReleased: { type: Boolean, default: false } // ✅ new field
}, { timestamps: true });

export default mongoose.model('Election', ElectionSchema);
