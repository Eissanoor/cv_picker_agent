const mongoose = require('mongoose');
const config = require('./config');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const connectionString = config.mongodb.uri;
    
    console.log(`Connecting to MongoDB at: ${connectionString.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Check if vector search is available
    try {
      const adminDb = conn.connection.db.admin();
      const serverInfo = await adminDb.serverInfo();
      
      if (parseFloat(serverInfo.version) < 6.0) {
        console.warn('MongoDB version is below 6.0. Vector search might not be available.');
        console.warn('Consider upgrading or using MongoDB Atlas for vector search capabilities.');
      }
    } catch (error) {
      console.warn('Could not verify MongoDB version for vector search capability.');
    }
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB }; 