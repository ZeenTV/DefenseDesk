const mongoose = require('mongoose');
let connectionPromise;

async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured');

  if (mongoose.connection.readyState === 1) return mongoose;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, { bufferCommands: true })
      .then((connection) => {
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        return connection;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      })
      .finally(() => { connectionPromise = undefined; });
  }
  return connectionPromise;
}

module.exports = connectDB;
