const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix';
  try {
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${connUri}: ${err.message}`);
    console.warn('[MongoDB Notice] Operating with memory store mode fallback if MongoDB is not running locally.');
    return false;
  }
};

module.exports = connectDB;
