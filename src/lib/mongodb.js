
import mongoose from "mongoose";

// Get MongoDB connection string from .env.local
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define MONGODB_URI in your .env.local file"
  );
}

// Cache MongoDB connection to prevent multiple connections
const cached = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

// Connect to MongoDB Atlas
export async function connectDB() {
  // Return existing connection
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // Create connection if one doesn't exist
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log("MongoDB connected successfully");

    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;

    console.error("MongoDB connection failed:", error.message);

    throw error;
  }
}

export default connectDB;
