import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';

// Components
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';
import Chat from './pages/Chat';

function App() {
  return (
    <div className="App min-h-screen bg-dark-900">
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
                
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<OTPVerification />} />
                
                {/* Protected Routes */}
                
                <Route path="/chat" element={
                    
                  <AuthGuard>
                    <Chat />
                  </AuthGuard>
                } />
                
                {/* Default Route */}
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#1e293b',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#1e293b',
                  },
                },
              }}
            />
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
