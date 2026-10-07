const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured');

  // Kung naka-connect na, gamitin na agad
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // Kung nagka-connect na pero nag-iinit pa lang, hintayin matapos
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    return mongoose;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: true, // I-enable ang buffering para hindi mag-error habang nag-aantay sa serverless
    });
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDB;