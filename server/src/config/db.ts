import mongoose from 'mongoose';
import { env } from './env';

let memoryServer: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[DB] Attempting connection to configured MongoDB URI...`);
      const conn = await mongoose.connect(uri);
      console.log(`[DB] Successfully connected to MongoDB at: ${conn.connection.host}`);
      return conn;
    } catch (err: any) {
      console.warn(`[DB] Warning: Failed to connect to configured MONGODB_URI: ${err.message}`);
      console.log(`[DB] Falling back to embedded in-memory MongoDB for local execution...`);
    }
  }

  // Fallback to MongoMemoryServer
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    console.log(`[DB] Starting embedded MongoMemoryServer at: ${memUri}`);
    const conn = await mongoose.connect(memUri);
    console.log(`[DB] Successfully connected to embedded MongoMemoryServer!`);
    return conn;
  } catch (err: any) {
    console.error(`[DB] Critical Error: Unable to connect to MongoDB or start MongoMemoryServer: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
