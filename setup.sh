#!/bin/bash

# Cross-Lingo Talk Setup Script
echo "🚀 Setting up Cross-Lingo Talk..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js $(node -v) detected"

# Install dependencies
print_info "Installing dependencies..."
npm install

print_info "Installing server dependencies..."
cd server && npm install && cd ..

print_info "Installing client dependencies..."
cd client && npm install && cd ..

print_status "Dependencies installed successfully"

# Create environment files
print_info "Setting up environment files..."

# Server .env
if [ ! -f "server/.env" ]; then
    cp server/.env.development server/.env
    print_status "Created server/.env from template"
    print_warning "Please update server/.env with your actual values:"
    print_warning "  - MONGODB_URI (MongoDB connection string)"
    print_warning "  - JWT_SECRET (secure random string)"
    print_warning "  - GEMINI_API_KEY (from Google AI Studio)"
else
    print_info "server/.env already exists"
fi

# Client .env
if [ ! -f "client/.env" ]; then
    cp client/.env.development client/.env
    print_status "Created client/.env from template"
else
    print_info "client/.env already exists"
fi

# Create directories for uploads (if needed in future)
mkdir -p server/uploads
mkdir -p client/public/uploads

print_status "Setup completed successfully!"

echo ""
print_info "📋 Next Steps:"
echo "1. 🔧 Update server/.env with your actual configuration:"
echo "   - Get MongoDB URI from https://cloud.mongodb.com/"
echo "   - Get Gemini API key from https://makersuite.google.com/app/apikey"
echo "   - Generate a secure JWT_SECRET"
echo ""
echo "2. 🚀 Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. 🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo ""
print_info "📖 For detailed instructions, see README.md"

# Check if MongoDB is running locally
if command -v mongod &> /dev/null; then
    if pgrep mongod > /dev/null; then
        print_status "MongoDB is running locally"
    else
        print_warning "MongoDB is installed but not running. Start it with: brew services start mongodb/brew/mongodb-community"
    fi
else
    print_info "MongoDB not found locally. Consider using MongoDB Atlas for cloud database."
fi

echo ""
print_status "🎉 Cross-Lingo Talk setup complete!"
