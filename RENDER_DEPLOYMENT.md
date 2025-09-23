# 🚀 Deploy Backend to Render

This guide will help you deploy the Cross-Lingo Chat backend to Render.

## 📋 Prerequisites

1. **GitHub Repository** - Your code should be pushed to GitHub
2. **MongoDB Atlas Account** - For the database
3. **Google Gemini API Key** - For translation service
4. **Render Account** - Sign up at [render.com](https://render.com)

## 🔧 Step 1: Prepare Environment Variables

You'll need these environment variables for Render:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cross-lingo-chat
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key-here
CLIENT_URL=https://your-frontend-url.vercel.app
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

## 🚀 Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository: `New-chatting-App`

3. **Configure Service**
   - **Name**: `cross-lingo-chat-backend`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free` (or choose paid plan)

4. **Set Environment Variables**
   - Go to "Environment" tab
   - Add all the environment variables listed above
   - **Important**: Set `PORT=10000` (Render's default)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (~5-10 minutes)

### Option B: Using render.yaml (Automatic)

1. **Push render.yaml to GitHub**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Import render.yaml**
   - In Render dashboard, click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically read `render.yaml`
   - Set your environment variables

## 🔗 Step 3: Get Your Backend URL

After deployment:
1. Your backend will be available at: `https://your-app-name.onrender.com`
2. API endpoints will be at: `https://your-app-name.onrender.com/api/`
3. Health check: `https://your-app-name.onrender.com/api/health`

## 🔧 Step 4: Update Frontend Configuration

Update your frontend environment variables to point to the deployed backend:

```env
# In frontend/.env
REACT_APP_API_URL=https://your-app-name.onrender.com/api
REACT_APP_SERVER_URL=https://your-app-name.onrender.com
```

## 📊 Step 5: Monitor Deployment

1. **Check Logs**
   - Go to your service in Render dashboard
   - Click "Logs" tab to see deployment progress

2. **Test Health Endpoint**
   - Visit: `https://your-app-name.onrender.com/api/health`
   - Should return: `{"status": "OK", "timestamp": "..."}`

3. **Test API Endpoints**
   - Try: `https://your-app-name.onrender.com/api/users/all`
   - Should require authentication

## ⚠️ Important Notes

### Free Tier Limitations
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes ~30 seconds
- **Monthly Hours**: 750 hours per month (enough for most projects)

### Database Connection
- Use **MongoDB Atlas** (free tier available)
- Whitelist Render's IP addresses or use `0.0.0.0/0` for development

### Environment Variables
- Never commit `.env` files to GitHub
- Set all variables in Render dashboard
- Use strong, unique JWT secrets

## 🔄 Automatic Deployments

Render automatically redeploys when you push to your main branch:

```bash
git add .
git commit -m "Update backend"
git push
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build command: `cd backend && npm install`
   - Verify `package.json` exists in `backend/` folder

2. **App Won't Start**
   - Check start command: `cd backend && npm start`
   - Verify `PORT=10000` environment variable

3. **Database Connection Fails**
   - Check MongoDB URI format
   - Verify MongoDB Atlas allows connections from `0.0.0.0/0`

4. **CORS Errors**
   - Set `CLIENT_URL` and `CORS_ORIGIN` to your frontend URL
   - Update after frontend deployment

### Logs and Debugging
- Always check Render logs for error details
- Use `console.log()` for debugging (visible in logs)
- Test endpoints with Postman or curl

## 🎉 Success!

Once deployed successfully:
- ✅ Backend API running on Render
- ✅ MongoDB connected
- ✅ Environment variables configured
- ✅ Ready for frontend integration

Next: Deploy your frontend to Vercel and update the API URLs!
