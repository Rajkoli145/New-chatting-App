# 🚀 Quick Setup Guide for Cross-Lingo Talk

## Prerequisites
- Node.js 16+ installed
- MongoDB database (local or Atlas)
- Google Gemini API key

## 1. Quick Setup (Automated)
```bash
# Run the setup script
./setup.sh
```

## 2. Manual Setup

### Step 1: Install Dependencies
```bash
npm run install-deps
```

### Step 2: Environment Configuration

#### Server Environment (`server/.env`)
```env
# Copy from server/.env.development and update:
MONGODB_URI=mongodb://localhost:27017/cross-lingo-chat
JWT_SECRET=your-secure-jwt-secret-here
GEMINI_API_KEY=your-gemini-api-key-here
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

#### Client Environment (`client/.env`)
```env
# Copy from client/.env.development:
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SERVER_URL=http://localhost:5001
```

### Step 3: Get Required API Keys

#### MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free account and cluster
3. Get connection string
4. Update `MONGODB_URI` in `server/.env`

#### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Update `GEMINI_API_KEY` in `server/.env`

#### JWT Secret
Generate a secure random string:
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Use OpenSSL
openssl rand -hex 64
```

### Step 4: Start Development
```bash
# Start both server and client
npm run dev

# Or start individually:
npm run server  # Backend on port 5001
npm run client  # Frontend on port 3000
```

## 3. Verification

### Check if everything is working:
1. **Backend Health**: http://localhost:5001/api/health
2. **Frontend**: http://localhost:3000
3. **Database Connection**: Check server logs for "Connected to MongoDB"

### Test the Application:
1. Register with phone number
2. Verify OTP (check console in dev mode)
3. Start chatting with translation

## 4. Production Deployment

### Vercel Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production:
Set these in Vercel dashboard:
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secure random string
- `GEMINI_API_KEY`: Google Gemini API key
- `NODE_ENV`: `production`

## 5. Troubleshooting

### Common Issues:

#### MongoDB Connection Failed
- Check if MongoDB is running locally
- Verify connection string format
- Check network access in MongoDB Atlas

#### Gemini API Errors
- Verify API key is correct
- Check API quotas and billing
- Ensure API is enabled

#### Socket.io Connection Issues
- Check CORS configuration
- Verify server URL in client environment
- Check firewall settings

#### Build Errors
- Clear node_modules and reinstall
- Check Node.js version (16+ required)
- Verify all dependencies are installed

### Getting Help:
1. Check the [Issues](https://github.com/Rajkoli145/New-chatting-App/issues) page
2. Review the full [README.md](README.md)
3. Check server logs for detailed error messages

## 6. Development Tips

### Useful Commands:
```bash
# View server logs
npm run server

# Build for production
npm run build

# Check dependencies
npm audit

# Update dependencies
npm update
```

### Development Workflow:
1. Make changes to code
2. Server auto-restarts (nodemon)
3. Client auto-reloads (React dev server)
4. Test features in browser
5. Check console for errors

---

**Happy Coding! 🎉**

For detailed documentation, see [README.md](README.md)
