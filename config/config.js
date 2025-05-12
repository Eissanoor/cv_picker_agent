// Load environment variables from .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Please check your .env file or environment configuration');
}

module.exports = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cvDatabase'
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    // Using older models that are more widely available
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    completionModel: process.env.OPENAI_COMPLETION_MODEL || 'gpt-3.5-turbo'
  },
  
  // File upload limits
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedTypes: ['application/pdf']
  }
}; 