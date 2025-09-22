#!/bin/bash

# Script to create .env files from templates
echo "🔧 Creating environment files..."

# Create server .env
if [ ! -f "server/.env" ]; then
    cp server/.env.development server/.env
    echo "✅ Created server/.env"
else
    echo "ℹ️  server/.env already exists"
fi

# Create client .env  
if [ ! -f "client/.env" ]; then
    cp client/.env.development client/.env
    echo "✅ Created client/.env"
else
    echo "ℹ️  client/.env already exists"
fi

echo ""
echo "⚠️  IMPORTANT: Update the following in server/.env:"
echo "   1. MONGODB_URI - Your MongoDB connection string"
echo "   2. JWT_SECRET - Generate a secure random string"
echo "   3. GEMINI_API_KEY - Get from Google AI Studio"
echo ""
echo "🔗 Helpful links:"
echo "   MongoDB Atlas: https://cloud.mongodb.com/"
echo "   Gemini API: https://makersuite.google.com/app/apikey"
echo ""
echo "💡 Generate JWT Secret:"
echo "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
