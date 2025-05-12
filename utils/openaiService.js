const { OpenAI } = require('openai');
const config = require('../config/config');

// Validate OpenAI API key
if (!config.openai.apiKey) {
  console.error('Error: OpenAI API key is missing. Please set OPENAI_API_KEY in your .env file');
}

// Initialize OpenAI once
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/**
 * Generate embeddings for a text using OpenAI's API
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<number[]>} - Vector representation of the text
 */
async function generateEmbeddings(text) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: text
    });
    
    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Use AI to analyze a CV and extract structured information
 * @param {string} cvText - The text content of the CV
 * @returns {Promise<Object>} - Structured CV information
 */
async function analyzeCV(cvText) {
  try {
    // This is a simplified example. In production, use a more sophisticated prompt
    const prompt = `
      Please analyze this CV and extract the following information in JSON format:
      - Skills (as an array of strings)
      - Years of experience (as a number)
      - Job titles (as an array of strings)
      - Education details (as an array of strings)
      - Contact information (email and phone if available)
      
      CV text:
      ${cvText.substring(0, 4000)} // Limiting to 4000 chars to stay within token limits
    `;
    
    const response = await openai.chat.completions.create({
      model: config.openai.completionModel,
      messages: [
        {
          role: "system",
          content: "You are an expert CV analyzer. Extract structured information from CVs accurately."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing CV with AI:', error);
    // Fall back to simpler methods if AI analysis fails
    return null;
  }
}

module.exports = {
  generateEmbeddings,
  analyzeCV
}; 