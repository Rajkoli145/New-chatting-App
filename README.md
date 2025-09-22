# Cross-Lingo Talk - Multilingual Real-Time Chat Application

A modern, real-time chat application that breaks language barriers by automatically translating messages between users who speak different languages. Built with React.js, Node.js, Express.js, MongoDB, Socket.io, and Google's Gemini API.

## 🌟 Features

### 📱 Phone-Based Authentication
- **Simple Registration**: Sign up with just your name, phone number, and preferred language
- **OTP Verification**: Secure phone number verification with OTP
- **Auto-Login**: Seamless login experience for returning users
- **Development Mode**: OTP displayed on screen/console for easy testing

### 🌍 Automatic Translation
- **Real-Time Translation**: Messages automatically translated using Google's Gemini API
- **22+ Languages Supported**: Including English, Hindi, Spanish, French, German, Arabic, Chinese, and more
- **Bidirectional Translation**: Both users see messages in their preferred language
- **Original Text Preservation**: Original messages stored alongside translations

### ⚡ Real-Time Features
- **Instant Messaging**: Real-time message delivery using Socket.io
- **Typing Indicators**: See when someone is typing
- **Online/Offline Status**: Accurate presence detection
- **Message Delivery Status**: Read receipts and delivery confirmations
- **Persistent Messages**: Messages delivered even when recipient is offline

### 👥 User Discovery
- **Automatic Contact List**: All registered users visible like WhatsApp
- **Smart Search**: Find users by name or phone number
- **Language Indicators**: See each user's preferred language

### 🎨 Modern UI/UX
- **Dark Theme**: Beautiful dark interface optimized for messaging
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Polished user experience with subtle animations
- **Accessibility**: Built with accessibility best practices

## 🛠 Technology Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.io Client**: Real-time communication
- **React Router**: Client-side routing
- **React Hot Toast**: Beautiful notifications
- **Lucide React**: Modern icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Token authentication
- **Google Gemini API**: AI-powered translation

### Infrastructure
- **Vercel**: Deployment platform
- **MongoDB Atlas**: Cloud database
- **Environment Variables**: Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB database (local or Atlas)
- Google Gemini API key

### 1. Clone Repository
```bash
git clone https://github.com/Rajkoli145/New-chatting-App.git
cd New-chatting-App
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, client)
npm run install-deps
```

### 3. Environment Setup

#### Server Environment
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/cross-lingo-chat
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cross-lingo-chat

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Twilio for real SMS (for production)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

#### Client Environment
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SERVER_URL=http://localhost:5001
```

### 4. Start Development Servers
```bash
# From root directory - starts both server and client
npm run dev

# Or start individually:
# npm run server  (starts backend on port 5001)
# npm run client  (starts frontend on port 3000)
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP and complete registration
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### User Endpoints
- `GET /api/users/all` - Get all users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/stats/online` - Get online user stats

### Message Endpoints
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/conversation/:id` - Get conversation messages
- `POST /api/messages/send` - Send message
- `PUT /api/messages/read/:conversationId` - Mark messages as read
- `GET /api/messages/unread-count` - Get unread message count

### Socket.io Events
#### Client to Server
- `join-conversation` - Join conversation room
- `send-message` - Send new message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `mark-messages-read` - Mark messages as read

#### Server to Client
- `new-message` - Receive new message
- `message-sent` - Message delivery confirmation
- `user-typing` - User typing status
- `user-online` - User came online
- `user-offline` - User went offline
- `messages-read` - Messages read receipt

## 🚀 Deployment to Vercel

### 1. Prepare for Deployment
```bash
# Build the client
cd client
npm run build
```

### 2. Set Environment Variables in Vercel
In your Vercel dashboard, add these environment variables:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Secure random string for JWT signing
- `GEMINI_API_KEY`: Your Google Gemini API key
- `NODE_ENV`: `production`

### 3. Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 4. Update Client Environment
After deployment, update `client/.env`:
```env
REACT_APP_API_URL=https://your-app.vercel.app/api
REACT_APP_SERVER_URL=https://your-app.vercel.app
```

## 🗃 Database Schema

### Users Collection
```javascript
{
  name: String,           // User's full name
  phone: String,          // Phone number (unique)
  preferredLanguage: String, // Language code (en, hi, es, etc.)
  isOnline: Boolean,      // Current online status
  lastSeen: Date,         // Last activity timestamp
  socketId: String,       // Current socket connection ID
  isVerified: Boolean,    // Phone verification status
  avatar: String          // Profile picture URL
}
```

### Conversations Collection
```javascript
{
  participants: [ObjectId], // Array of user IDs (exactly 2)
  lastMessage: ObjectId,    // Reference to last message
  lastMessageTime: Date,    // Timestamp of last message
  isActive: Boolean         // Conversation status
}
```

### Messages Collection
```javascript
{
  conversationId: ObjectId, // Reference to conversation
  sender: ObjectId,         // Reference to sender user
  originalText: String,     // Original message text
  translatedText: String,   // Translated message text
  senderLanguage: String,   // Sender's language code
  recipientLanguage: String, // Recipient's language code
  messageType: String,      // 'text', 'image', 'file', 'system'
  isRead: Boolean,          // Read status
  readAt: Date,            // Read timestamp
  isDelivered: Boolean,     // Delivery status
  deliveredAt: Date,       // Delivery timestamp
  isTranslated: Boolean     // Translation status
}
```

### OTP Verifications Collection
```javascript
{
  phone: String,      // Phone number
  otpCode: String,    // 6-digit OTP code
  expiresAt: Date,    // Expiration timestamp (10 minutes)
  isVerified: Boolean, // Verification status
  attempts: Number,   // Number of verification attempts
  isUsed: Boolean     // Usage status
}
```

## 🔧 Configuration

### Supported Languages
The application supports 22+ languages:
- English (en), Hindi (hi), Spanish (es), French (fr)
- German (de), Italian (it), Portuguese (pt), Russian (ru)
- Japanese (ja), Korean (ko), Chinese (zh), Arabic (ar)
- Bengali (bn), Urdu (ur), Tamil (ta), Telugu (te)
- Malayalam (ml), Kannada (kn), Gujarati (gu), Punjabi (pa)
- Marathi (mr), Odia (or)

### Translation Service
The app uses Google's Gemini API for translation with fallback handling:
- Primary: Gemini Pro model for accurate translations
- Fallback: Returns original text if translation fails
- Language Detection: Automatic detection of source language

### Security Features
- JWT token authentication with 7-day expiration
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for secure cross-origin requests
- Helmet.js for security headers

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Code Structure
```
├── server/                 # Backend application
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── middleware/        # Custom middleware
│   ├── socket/            # Socket.io handlers
│   └── index.js           # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # App entry point
│   └── public/            # Static assets
└── vercel.json            # Vercel deployment config
```

### Development Scripts
```bash
# Root level
npm run dev          # Start both server and client
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build client for production
npm run install-deps # Install all dependencies

# Server level
npm start           # Start production server
npm run dev         # Start development server with nodemon

# Client level
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Rajkoli145/New-chatting-App/issues) page
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

## 🙏 Acknowledgments

- Google Gemini API for powerful translation capabilities
- Socket.io for real-time communication
- Tailwind CSS for beautiful styling
- MongoDB for flexible data storage
- Vercel for seamless deployment

---

**Built with ❤️ by [Raj Koli](https://github.com/Rajkoli145)**
