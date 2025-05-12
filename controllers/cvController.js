const CV = require('../models/cvModel');
const { parsePDF, extractMetadata } = require('../utils/cvParser');
const { generateEmbeddings, analyzeCV } = require('../utils/openaiService');

/**
 * Upload and process a new CV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadCV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse the PDF file
    const textContent = await parsePDF(req.file.buffer);
    
    // Generate embeddings for the CV text
    let embedding = [];
    try {
      embedding = await generateEmbeddings(textContent);
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      // Continue without embeddings - this will affect search but still allow uploads
      console.warn('Continuing without embeddings - vector search will not work for this document');
    }
    
    // Extract metadata - try AI analysis first, fall back to rule-based
    let metadata;
    try {
      const aiAnalysis = await analyzeCV(textContent);
      metadata = aiAnalysis || extractMetadata(textContent);
    } catch (error) {
      console.error('AI analysis failed, using rule-based extraction:', error);
      metadata = extractMetadata(textContent);
    }

    // Create and save the CV document
    const cv = new CV({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      content: textContent,
      embeddings: embedding,
      metadata: metadata
    });

    await cv.save();
    
    const response = { 
      message: 'CV uploaded and processed successfully', 
      id: cv._id,
      metadata: cv.metadata
    };
    
    // Add warning if embeddings could not be generated
    if (embedding.length === 0) {
      response.warning = 'Embeddings could not be generated. This CV will not appear in vector searches.';
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error in CV upload:', error);
    res.status(500).json({ error: 'Failed to process CV', details: error.message });
  }
}

/**
 * Search for CVs using semantic similarity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function searchCVs(req, res) {
  try {
    const { query, limit = 10, filters = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    let results = [];
    
    try {
      // Generate embeddings for the search query
      const queryEmbedding = await generateEmbeddings(query);
      
      // Build the aggregation pipeline
      const pipeline = [
        {
          "$vectorSearch": {
            "queryVector": queryEmbedding,
            "path": "embeddings",
            "numCandidates": Math.max(100, limit * 2),
            "limit": limit,
            "index": "vectorIndex"
          }
        }
      ];
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        const filterStage = { $match: {} };
        
        // Handle skills filter
        if (filters.skills && filters.skills.length > 0) {
          filterStage.$match['metadata.skills'] = { $in: filters.skills };
        }
        
        // Handle experience filter
        if (filters.minExperience) {
          filterStage.$match['metadata.experience'] = { $gte: filters.minExperience };
        }
        
        // Add more filters as needed
        
        pipeline.push(filterStage);
      }
      
      // Add projection to remove large content field from results
      pipeline.push({
        $project: {
          content: 0,
          embeddings: 0
        }
      });
      
      results = await CV.aggregate(pipeline);
    } catch (error) {
      console.error('Vector search failed, falling back to regular search:', error.message);
      
      // Fall back to a basic text search if vector search fails
      const searchRegex = new RegExp(query, 'i');
      results = await CV.find({
        $or: [
          { 'metadata.skills': { $regex: searchRegex } },
          { 'metadata.jobTitles': { $regex: searchRegex } },
          { content: { $regex: searchRegex } }
        ]
      })
      .select('-content -embeddings')
      .limit(limit);
    }
    
    res.json({
      count: results.length,
      vectorSearchUsed: results.score !== undefined,
      results: results
    });
  } catch (error) {
    console.error('Error in CV search:', error);
    res.status(500).json({ error: 'Failed to search CVs', details: error.message });
  }
}

/**
 * Get CV by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getCVById(req, res) {
  try {
    const cv = await CV.findById(req.params.id);
    
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }
    
    res.json(cv);
  } catch (error) {
    console.error('Error fetching CV:', error);
    res.status(500).json({ error: 'Failed to fetch CV', details: error.message });
  }
}

module.exports = {
  uploadCV,
  searchCVs,
  getCVById
}; 