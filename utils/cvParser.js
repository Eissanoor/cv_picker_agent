const pdfParse = require('pdf-parse');

/**
 * Parse PDF buffer and extract content
 * @param {Buffer} pdfBuffer - Buffer of PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function parsePDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF document');
  }
}

/**
 * Extract skills from CV text
 * @param {string} text - CV text content
 * @returns {string[]} - Array of skills found
 */
function extractSkills(text) {
  // In production, use an LLM or ML model to extract this properly
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'Angular', 
    'Vue', 'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET', 
    'PHP', 'Laravel', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap'
  ];
  
  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

/**
 * Extract years of experience
 * @param {string} text - CV text content
 * @returns {number} - Years of experience
 */
function extractExperience(text) {
  // Improved regex for years of experience patterns
  const expPatterns = [
    /(\d+)\+?\s*years?\s*(of)?\s*experience/i,
    /experience\s*:\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s*work(ing)?/i
  ];
  
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

/**
 * Extract job titles from CV
 * @param {string} text - CV text content
 * @returns {string[]} - Array of job titles
 */
function extractJobTitles(text) {
  // Common job titles in tech
  const commonTitles = [
    'Software Engineer', 'Software Developer', 'Frontend Developer', 
    'Backend Developer', 'Full Stack Developer', 'DevOps Engineer',
    'Data Scientist', 'Data Engineer', 'Machine Learning Engineer',
    'System Architect', 'Technical Lead', 'Project Manager',
    'Product Manager', 'UI/UX Designer', 'QA Engineer',
    'Test Engineer', 'Scrum Master', 'Agile Coach'
  ];
  
  return commonTitles.filter(title => 
    text.toLowerCase().includes(title.toLowerCase())
  );
}

/**
 * Extract education details
 * @param {string} text - CV text content
 * @returns {string[]} - Array of education qualifications
 */
function extractEducation(text) {
  // Common education qualifications
  const educationKeywords = [
    'Bachelor', 'Master', 'PhD', 'BSc', 'MSc', 'MBA', 
    'Computer Science', 'Engineering', 'Information Technology'
  ];
  
  return educationKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * Extract all metadata from CV text
 * @param {string} text - CV text content
 * @returns {Object} - CV metadata
 */
function extractMetadata(text) {
  return {
    skills: extractSkills(text),
    experience: extractExperience(text),
    jobTitles: extractJobTitles(text),
    education: extractEducation(text)
  };
}

module.exports = {
  parsePDF,
  extractMetadata,
  extractSkills,
  extractExperience,
  extractJobTitles,
  extractEducation
}; 