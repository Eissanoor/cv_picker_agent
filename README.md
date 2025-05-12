# CV Picker - Resume Management & Search System

A modern CV/Resume management system that uses OpenAI embeddings for semantic search and intelligent CV parsing.

## Features

- **PDF CV Upload**: Upload and parse PDF resumes
- **AI-Powered Analysis**: Extract structured data from CVs using OpenAI
- **Advanced Search**: Multiple search methods with comprehensive filtering options
- **Vector & Text Search**: Find CVs using semantic similarity or text-based search
- **Flexible Filtering**: Filter by skills, experience, job titles, education and more
- **Sorting & Pagination**: Order results and paginate for better browsing

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with vector search capability
- **AI**: OpenAI API for embeddings and analysis
- **Architecture**: MVC (Model-View-Controller) pattern

## Project Structure

```
cv-picker/
├── config/             # Application configuration
│   ├── config.js       # Environment variables and settings
│   └── database.js     # Database connection
├── controllers/        # Request handlers
│   └── cvController.js # CV operations controller
├── middlewares/        # Express middlewares
│   └── errorHandler.js # Global error handler
├── models/             # MongoDB models
│   └── cvModel.js      # CV data model
├── routes/             # API routes
│   └── cvRoutes.js     # CV endpoints routing
├── utils/              # Utility functions
│   ├── cvParser.js     # PDF parsing and CV analysis
│   └── openaiService.js# OpenAI API integration
├── .env                # Environment variables (not in repo)
├── server.js           # Application entry point
└── package.json        # Dependencies and scripts
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://127.0.0.1:27017/cvDatabase
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
   OPENAI_COMPLETION_MODEL=gpt-3.5-turbo
   
   # File Upload Limits
   MAX_FILE_SIZE=10485760
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| PORT | The port on which the server will run | 3001 |
| NODE_ENV | The environment mode (development/production) | development |
| MONGODB_URI | MongoDB connection string | mongodb://127.0.0.1:27017/cvDatabase |
| OPENAI_API_KEY | Your OpenAI API key (required) | none |
| OPENAI_EMBEDDING_MODEL | The OpenAI model for embeddings | text-embedding-ada-002 |
| OPENAI_COMPLETION_MODEL | The OpenAI model for CV analysis | gpt-3.5-turbo |
| MAX_FILE_SIZE | Maximum allowed size for CV uploads in bytes | 10485760 (10MB) |

## API Endpoints

### Upload
- **POST /api/cv/upload**: Upload a new CV (PDF file)

### Search
- **POST /api/cv/search**: Advanced CV search with filtering, sorting and pagination
- **GET /api/cv/search**: Simple search via query parameters
- **GET /api/cv/metadata**: Get metadata for search filters (skills, job titles, etc.)
- **GET /api/cv/:id**: Get a specific CV by ID

### Search Parameters

#### POST /api/cv/search
Request body:
```json
{
  "query": "javascript developer",
  "limit": 10,
  "page": 1,
  "sortBy": "relevance",
  "sortOrder": "desc",
  "searchType": "auto",
  "filters": {
    "skills": ["JavaScript", "React"],
    "skillsLogic": "AND",
    "experience": {
      "min": 2,
      "max": 5
    },
    "jobTitles": ["Frontend Developer", "UI Developer"],
    "education": ["Computer Science"],
    "dateRange": {
      "from": "2023-01-01",
      "to": "2023-12-31"
    }
  }
}
```

#### GET /api/cv/search
Query parameters:
```
/api/cv/search?q=javascript&skills=React,Node.js&experience=2-5&page=1&limit=10&sortBy=experience&sortOrder=desc
```

## MongoDB Setup

Ensure you have MongoDB installed and running, with vector search capability. For MongoDB Atlas, create a vector search index on the `embeddings` field.

## License

ISC 