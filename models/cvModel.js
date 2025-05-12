const mongoose = require('mongoose');

// Define CV Schema with improved structure
const cvSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embeddings: {
    type: [Number],
    index: true, // This helps with vector search
    required: false, // Make embeddings optional
    default: []
  },
  uploadDate: { 
    type: Date, 
    default: Date.now 
  },
  metadata: {
    skills: [String],
    experience: Number,
    jobTitles: [String],
    education: [String],
    contactDetails: {
      email: String,
      phone: String
    }
  },
  // Track if this CV is searchable via vector search
  hasEmbeddings: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add index for vector search if MongoDB version supports it
// Note: This requires MongoDB 5.0+ with Atlas Search or MongoDB 6.0+ with vector search capability
cvSchema.index({ embeddings: "vectorSearch" });

// Add text index for fallback searching
cvSchema.index({ 
  "content": "text",
  "metadata.skills": "text",
  "metadata.jobTitles": "text"
});

// Pre-save middleware to check if embeddings exist
cvSchema.pre('save', function(next) {
  this.hasEmbeddings = Array.isArray(this.embeddings) && this.embeddings.length > 0;
  next();
});

module.exports = mongoose.model('CV', cvSchema); 