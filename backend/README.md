# 🌍 Cross-Lingo Chat - Backend

Node.js backend API for the multilingual real-time chat application.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/cross-lingo-chat

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Development
```bash
npm run dev
```
Runs on http://localhost:5001

### Production
```bash
npm start
```

## 🛠 Technology Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication
- **Google Gemini API** - Translation service

## 📁 Project Structure
```
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Business logic
├── middleware/     # Custom middleware
├── socket/         # Socket.io handlers
└── index.js        # Server entry point
```

## 🚀 Deployment

### Railway (Recommended)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Heroku
```bash
git add .
git commit -m "Deploy to Heroku"
heroku create your-app-name
git push heroku main
```

### Render
- Connect your GitHub repository
- Set environment variables
- Deploy automatically

## 🔧 Environment Variables
Set these in your deployment platform:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GEMINI_API_KEY` - Google Gemini API key
- `NODE_ENV` - Set to "production"
- `CLIENT_URL` - Your frontend URL
