import mongoose from 'mongoose';
import { config } from '../config/env.js';

export async function connectDB() {
  await mongoose.connect(config.MONGO_URI, { dbName: 'smart_evote' });
  console.log('MongoDB connected');
}
