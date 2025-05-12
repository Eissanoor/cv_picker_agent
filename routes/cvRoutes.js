const express = require('express');
const multer = require('multer');
const cvController = require('../controllers/cvController');
const config = require('../config/config');

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    // Only accept PDFs
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// CV upload route
router.post('/upload', upload.single('cv'), cvController.uploadCV);

// CV search routes
router.post('/search', cvController.searchCVs);

// GET version of search for simpler queries
router.get('/search', (req, res) => {
  // Convert query parameters to body format expected by the controller
  const body = {
    query: req.query.q || '',
    limit: parseInt(req.query.limit || '10', 10),
    page: parseInt(req.query.page || '1', 10),
    sortBy: req.query.sortBy || 'relevance',
    sortOrder: req.query.sortOrder || 'desc',
    searchType: req.query.searchType || 'auto'
  };

  // Parse filters if provided
  if (req.query.skills) {
    body.filters = body.filters || {};
    body.filters.skills = req.query.skills.split(',').map(s => s.trim());
    body.filters.skillsLogic = req.query.skillsLogic;
  }

  if (req.query.experience) {
    body.filters = body.filters || {};
    // Handle min/max experience range
    if (req.query.experience.includes('-')) {
      const [min, max] = req.query.experience.split('-').map(n => parseInt(n.trim(), 10));
      body.filters.experience = { min, max };
    } else {
      body.filters.experience = parseInt(req.query.experience, 10);
    }
  }

  if (req.query.jobTitles) {
    body.filters = body.filters || {};
    body.filters.jobTitles = req.query.jobTitles.split(',').map(t => t.trim());
  }

  // Set the modified request object and forward to the controller
  req.body = body;
  cvController.searchCVs(req, res);
});

// Get CV metadata for search filters
router.get('/metadata', async (req, res) => {
  try {
    const CV = require('../models/cvModel');
    
    // Get distinct skills
    const skills = await CV.distinct('metadata.skills');
    
    // Get distinct job titles
    const jobTitles = await CV.distinct('metadata.jobTitles');
    
    // Get min and max experience
    const experienceStats = await CV.aggregate([
      {
        $group: {
          _id: null,
          min: { $min: '$metadata.experience' },
          max: { $max: '$metadata.experience' },
          avg: { $avg: '$metadata.experience' }
        }
      }
    ]);
    
    // Get education options
    const education = await CV.distinct('metadata.education');
    
    res.json({
      skills: skills.filter(Boolean).sort(),
      jobTitles: jobTitles.filter(Boolean).sort(),
      experience: experienceStats.length > 0 ? {
        min: experienceStats[0].min || 0,
        max: experienceStats[0].max || 0,
        avg: Math.round(experienceStats[0].avg || 0)
      } : { min: 0, max: 0, avg: 0 },
      education: education.filter(Boolean).sort(),
      totalCVs: await CV.countDocuments()
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metadata', 
      details: error.message 
    });
  }
});

// Get a specific CV
router.get('/:id', cvController.getCVById);

module.exports = router; 