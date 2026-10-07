const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured');

  // Kung may nakatago nang connection, gamitin na lang agad para mabilis
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
    cachedConnection = connection;
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDB;