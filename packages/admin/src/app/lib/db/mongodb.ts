import mongoose from 'mongoose';

/**
 * Connect to MongoDB if not already connected
 * This will be called automatically when models are first accessed,
 * but can also be called explicitly to ensure connection
 * 
 * Uses mongoose's built-in connection caching to avoid multiple connections
 */
export async function connectMongoDB(): Promise<typeof mongoose> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Check if already connected (readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If already connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise<void>((resolve) => {
      mongoose.connection.once('connected', () => resolve());
      mongoose.connection.once('error', () => resolve()); // Continue even on error, let it throw below
    });
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
