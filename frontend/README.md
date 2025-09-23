# 🌍 Cross-Lingo Chat - Frontend

React.js frontend for the multilingual real-time chat application.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SERVER_URL=http://localhost:5001
```

For production:
```env
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_SERVER_URL=https://your-backend-url.com
```

### Development
```bash
npm start
```
Runs on http://localhost:3000

### Build for Production
```bash
npm run build
```

## 🛠 Technology Stack
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 📁 Project Structure
```
src/
├── components/     # Reusable components
├── contexts/       # React context providers
├── pages/          # Page components
├── utils/          # Utility functions
└── App.js          # Main app component
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload build/ folder to Netlify
```

## 🔧 Configuration
- Update `REACT_APP_API_URL` to point to your backend
- Update `REACT_APP_SERVER_URL` for Socket.io connection
