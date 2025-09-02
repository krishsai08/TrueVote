import mongoose from 'mongoose';

const FraudLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
    type: { 
      type: String, 
      required: true,
      enum: [
        'FaceMismatch',
        'RepeatVoteAttempt', 
        'SuspiciousIP',
        'MultipleDevices',
        'AgeEligibilityViolation',
        'OTPVerificationFailed',
        'InvalidVoteOption',
        'SystemManipulation',
        'UnauthorizedAccess',
        'DataTampering'
      ]
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    details: { type: String, default: '' },
    ipAddress: { type: String },
    userAgent: { type: String },
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for better query performance
FraudLogSchema.index({ createdAt: -1 });
FraudLogSchema.index({ type: 1 });
FraudLogSchema.index({ severity: 1 });
FraudLogSchema.index({ resolved: 1 });
FraudLogSchema.index({ userId: 1, electionId: 1 });

export default mongoose.model('FraudLog', FraudLogSchema);
