// 📁 config/db.ts

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/badmintonDB';

/**
 * Connects to MongoDB using Mongoose.
 * Utilizes a global cache to prevent multiple connections during hot reloads (common in dev).
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  console.log('✅ Mongoose connected to DB');
  return cached.conn;
}

export default connectDB;
