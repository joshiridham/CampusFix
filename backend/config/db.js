const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix';

  // Mask credentials for clean security logging
  const maskedUri = connUri.replace(/:([^:@]+)@/, ':****@');

  try {
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    console.error(`[MongoDB Connection Error] Failed to connect to DB at ${maskedUri}: ${err.message}`);
    return false;
  }
};

module.exports = connectDB;
