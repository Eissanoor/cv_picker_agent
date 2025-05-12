# CV Picker - Resume Management & Search System

A modern CV/Resume management system that uses OpenAI embeddings for semantic search and intelligent CV parsing.

## Features

- **PDF CV Upload**: Upload and parse PDF resumes
- **AI-Powered Analysis**: Extract structured data from CVs using OpenAI
- **Vector Search**: Find relevant CVs using semantic similarity
- **Filtering**: Filter search results by skills, experience, and other criteria

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
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   OPENAI_COMPLETION_MODEL=gpt-4o
   
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
| OPENAI_EMBEDDING_MODEL | The OpenAI model for embeddings | text-embedding-3-small |
| OPENAI_COMPLETION_MODEL | The OpenAI model for CV analysis | gpt-4o |
| MAX_FILE_SIZE | Maximum allowed size for CV uploads in bytes | 10485760 (10MB) |

## API Endpoints

- **POST /api/cv/upload**: Upload a new CV (PDF file)
- **POST /api/cv/search**: Search for CVs with semantic similarity
- **GET /api/cv/:id**: Get a specific CV by ID

## MongoDB Setup

Ensure you have MongoDB installed and running, with vector search capability. For MongoDB Atlas, create a vector search index on the `embeddings` field.

## License

ISC 