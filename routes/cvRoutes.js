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

// CV routes
router.post('/upload', upload.single('cv'), cvController.uploadCV);
router.post('/search', cvController.searchCVs);
router.get('/:id', cvController.getCVById);

module.exports = router; 