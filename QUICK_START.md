# ⚡ Quick Start - Cross-Lingo Talk

## 🚀 Get Started in 3 Steps

### 1. Create Environment Files
```bash
./create-env.sh
```

### 2. Update Configuration
Edit `server/.env` with your actual values:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Start Development
```bash
npm run install-deps
npm run dev
```

## 🔑 Get API Keys

### MongoDB (Database)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free account → Create cluster
3. Get connection string → Update `MONGODB_URI`

### Gemini API (Translation)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key → Update `GEMINI_API_KEY`

### JWT Secret (Security)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 📱 Test Features
1. Register with phone number
2. Verify OTP (shown on screen in dev mode)
3. Search for users or see all users
4. Start chatting with automatic translation!

---

**Need help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) or [README.md](README.md)
