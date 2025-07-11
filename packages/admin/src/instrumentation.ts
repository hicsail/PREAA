import mongoose from 'mongoose';

export async function register() {
  // Handle MongoDB connection
  await mongoose.connect(process.env.MONGODB_URI!);
}
