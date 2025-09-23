#!/bin/bash

echo "🔧 Setting up environment files for Cross-Lingo Chat"
echo "=================================================="

# Backend .env setup
echo ""
echo "📁 Backend Environment Setup"
echo "----------------------------"

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -hex 32)

# Update backend .env file
cat > backend/.env << EOF
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/cross-lingo-chat
# For MongoDB Atlas (replace with your actual URI):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cross-lingo-chat

# JWT Configuration (auto-generated secure key)
JWT_SECRET=$JWT_SECRET

# Google Gemini API Key (replace with your actual key)
GEMINI_API_KEY=your-gemini-api-key-here

# Twilio Configuration (Optional - for production SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF

echo "✅ Backend .env file created with secure JWT secret"

# Frontend .env setup
echo ""
echo "📁 Frontend Environment Setup"
echo "-----------------------------"

cat > frontend/.env << EOF
# API Configuration for local development
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SERVER_URL=http://localhost:5001
EOF

echo "✅ Frontend .env file created"

echo ""
echo "🔧 Next Steps:"
echo "=============="
echo "1. 📝 Edit backend/.env and replace 'your-gemini-api-key-here' with your actual Gemini API key"
echo "2. 🗄️  Set up MongoDB (local or Atlas) and update MONGODB_URI if needed"
echo "3. 📱 Optional: Add Twilio credentials for SMS in production"
echo "4. 🚀 Run 'npm run dev' to start both servers"
echo ""
echo "🔗 Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "🔗 Set up MongoDB Atlas: https://cloud.mongodb.com"
echo ""
echo "✨ Environment files are ready!"
