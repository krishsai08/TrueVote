import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  age: { type: Number, required: true },
  occupation: { type: String, default: '' },
  faceEmbedding: { type: [Number], default: [] },
  faceImageBase64: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
