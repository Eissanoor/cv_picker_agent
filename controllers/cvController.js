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
 * Search for CVs using multiple approaches with enhanced filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function searchCVs(req, res) {
  try {
    const { 
      query, 
      limit = 10,
      page = 1,
      filters = {}, 
      sortBy = 'relevance',
      sortOrder = 'desc',
      searchType = 'auto' // 'auto', 'vector', 'text'
    } = req.body;
    
    if (!query && Object.keys(filters).length === 0) {
      return res.status(400).json({ 
        error: 'Search requires either a query or filters',
        message: 'Please provide a search query or at least one filter'
      });
    }
    
    const skip = (page - 1) * limit;
    let results = [];
    let total = 0;
    let searchMethod = '';
    
    // Build the filter conditions
    const filterConditions = buildFilterConditions(filters);
    
    // Determine if we should try vector search
    const useVectorSearch = searchType === 'auto' || searchType === 'vector';
    const useTextSearch = searchType === 'auto' || searchType === 'text';
    
    // Try vector search if requested and a query is provided
    if (useVectorSearch && query) {
      try {
        // Generate embeddings for the search query
        const queryEmbedding = await generateEmbeddings(query);
        
        // Build the aggregation pipeline
        const pipeline = [
          {
            "$vectorSearch": {
              "queryVector": queryEmbedding,
              "path": "embeddings",
              "numCandidates": Math.max(100, limit * 3),
              "limit": limit * 5, // Get more results than needed for post-filtering
              "index": "vectorIndex"
            }
          }
        ];
        
        // Add match stage for filters if any
        if (Object.keys(filterConditions).length > 0) {
          pipeline.push({ $match: filterConditions });
        }
        
        // Add sorting stage (relevance is default for vector search)
        if (sortBy !== 'relevance') {
          const sortStage = buildSortStage(sortBy, sortOrder);
          pipeline.push(sortStage);
        }
        
        // Add pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        
        // Add projection to remove large fields
        pipeline.push({
          $project: {
            content: 0,
            embeddings: 0
          }
        });
        
        // Execute vector search
        results = await CV.aggregate(pipeline);
        
        // Get total count (in a separate query to not affect the main results)
        const countPipeline = [...pipeline];
        countPipeline.pop(); // Remove the projection
        countPipeline.pop(); // Remove the limit
        countPipeline.pop(); // Remove the skip
        countPipeline.push({ $count: 'total' });
        const totalCountResult = await CV.aggregate(countPipeline);
        total = totalCountResult.length > 0 ? totalCountResult[0].total : results.length;
        
        searchMethod = 'vector';
      } catch (error) {
        console.error('Vector search failed:', error.message);
        
        // Only throw if vector search was explicitly requested
        if (searchType === 'vector') {
          throw new Error('Vector search failed: ' + error.message);
        }
        
        // Otherwise, fall back to text search if auto mode
        if (searchType === 'auto') {
          console.log('Falling back to text search...');
        }
      }
    }
    
    // If vector search failed or wasn't attempted, use text search
    if ((useTextSearch && results.length === 0) || searchType === 'text') {
      let textSearchQuery = {};
      
      if (query) {
        // Add text search conditions
        textSearchQuery = buildTextSearchQuery(query);
      }
      
      // Combine text search with filters
      const finalQuery = Object.keys(filterConditions).length > 0 
        ? { $and: [textSearchQuery, filterConditions] }
        : textSearchQuery;
      
      // Create sort options
      const sortOptions = buildSortOptions(sortBy, sortOrder);
      
      // Execute the text search query
      results = await CV.find(finalQuery)
        .sort(sortOptions)
        .select('-content -embeddings')
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Get total count
      total = await CV.countDocuments(finalQuery);
      
      searchMethod = 'text';
    }
    
    // Format and return the results
    res.json({
      success: true,
      count: results.length,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      searchMethod: searchMethod,
      query: query,
      filters: filters,
      results: results.map(result => ({
        ...result,
        content: undefined, // Ensure content is never sent
        embeddings: undefined // Ensure embeddings are never sent
      }))
    });
  } catch (error) {
    console.error('Error in CV search:', error);
    res.status(500).json({ 
      error: 'Failed to search CVs', 
      details: error.message,
      success: false
    });
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

/**
 * Build filter conditions based on provided filters
 * @param {Object} filters - Filter criteria
 * @returns {Object} MongoDB filter conditions
 */
function buildFilterConditions(filters) {
  const conditions = {};
  
  // Skills filter (supports multiple skills with AND/OR logic)
  if (filters.skills) {
    if (Array.isArray(filters.skills)) {
      if (filters.skillsLogic === 'AND') {
        conditions['metadata.skills'] = { $all: filters.skills };
      } else {
        // Default to OR logic
        conditions['metadata.skills'] = { $in: filters.skills };
      }
    } else if (typeof filters.skills === 'string') {
      conditions['metadata.skills'] = filters.skills;
    }
  }
  
  // Experience filter (min/max)
  if (filters.experience) {
    conditions['metadata.experience'] = {};
    
    if (filters.experience.min !== undefined) {
      conditions['metadata.experience'].$gte = parseInt(filters.experience.min, 10);
    }
    
    if (filters.experience.max !== undefined) {
      conditions['metadata.experience'].$lte = parseInt(filters.experience.max, 10);
    }
    
    // If only a single value is provided (not an object with min/max)
    if (typeof filters.experience === 'number' || typeof filters.experience === 'string') {
      conditions['metadata.experience'] = parseInt(filters.experience, 10);
    }
  }
  
  // Job titles filter
  if (filters.jobTitles) {
    if (Array.isArray(filters.jobTitles)) {
      conditions['metadata.jobTitles'] = { $in: filters.jobTitles };
    } else if (typeof filters.jobTitles === 'string') {
      conditions['metadata.jobTitles'] = filters.jobTitles;
    }
  }
  
  // Education filter
  if (filters.education) {
    if (Array.isArray(filters.education)) {
      conditions['metadata.education'] = { $in: filters.education };
    } else if (typeof filters.education === 'string') {
      conditions['metadata.education'] = filters.education;
    }
  }
  
  // Date range filter
  if (filters.dateRange) {
    conditions.uploadDate = {};
    
    if (filters.dateRange.from) {
      conditions.uploadDate.$gte = new Date(filters.dateRange.from);
    }
    
    if (filters.dateRange.to) {
      conditions.uploadDate.$lte = new Date(filters.dateRange.to);
    }
  }
  
  // Custom metadata filters
  if (filters.custom) {
    for (const [key, value] of Object.entries(filters.custom)) {
      conditions[`metadata.${key}`] = value;
    }
  }
  
  return conditions;
}

/**
 * Build text search query for MongoDB
 * @param {string} query - User's search query
 * @returns {Object} MongoDB text search query
 */
function buildTextSearchQuery(query) {
  // Use text index if it's a simple term, or regex for more complex queries
  if (query.length < 50 && !query.includes('"') && !query.includes('*')) {
    return { $text: { $search: query } };
  } else {
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return {
      $or: [
        { 'metadata.skills': { $regex: searchRegex } },
        { 'metadata.jobTitles': { $regex: searchRegex } },
        { 'metadata.education': { $regex: searchRegex } },
        { content: { $regex: searchRegex } }
      ]
    };
  }
}

/**
 * Build MongoDB sort options
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort direction (asc/desc)
 * @returns {Object} MongoDB sort options
 */
function buildSortOptions(sortBy, sortOrder) {
  const direction = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  
  switch (sortBy) {
    case 'uploadDate':
      return { uploadDate: direction };
    case 'experience':
      return { 'metadata.experience': direction };
    case 'relevance':
      return { score: { $meta: 'textScore' } };
    default:
      return { uploadDate: -1 }; // Default to newest first
  }
}

/**
 * Build MongoDB aggregation sort stage
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort direction (asc/desc)
 * @returns {Object} MongoDB aggregation sort stage
 */
function buildSortStage(sortBy, sortOrder) {
  const direction = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  const sortStage = { $sort: {} };
  
  switch (sortBy) {
    case 'uploadDate':
      sortStage.$sort.uploadDate = direction;
      break;
    case 'experience':
      sortStage.$sort['metadata.experience'] = direction;
      break;
    default:
      sortStage.$sort.uploadDate = -1; // Default to newest first
  }
  
  return sortStage;
}

module.exports = {
  uploadCV,
  searchCVs,
  getCVById
}; 