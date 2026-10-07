const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured');
  const connection = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${connection.connection.host}`);
  return connection;
}

module.exports = connectDB;
