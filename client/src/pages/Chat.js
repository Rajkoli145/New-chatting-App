import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import UserProfile from '../components/chat/UserProfile';
import ConnectionStatus from '../components/chat/ConnectionStatus';

const Chat = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { isConnected } = useSocket();
  const { activeConversation, loading: chatLoading } = useChat();

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading || chatLoading) {
    return <LoadingSpinner text="Loading chat..." />;
  }

  return (
    <div className="h-screen bg-dark-900 flex overflow-hidden">
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />
      
      {/* Sidebar */}
      <div className={`${
        sidebarCollapsed && activeConversation ? 'hidden md:flex' : 'flex'
      } flex-col w-full md:w-80 lg:w-96 border-r border-dark-700 bg-dark-800`}>
        <Sidebar 
          onProfileClick={() => setShowProfile(true)}
          onConversationSelect={() => {
            if (window.innerWidth < 768) {
              setSidebarCollapsed(true);
            }
          }}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`${
        sidebarCollapsed || !activeConversation ? 'flex' : 'hidden md:flex'
      } flex-1 flex flex-col`}>
        {activeConversation ? (
          <ChatWindow 
            onBackClick={() => setSidebarCollapsed(false)}
            showBackButton={window.innerWidth < 768}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-dark-900">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-24 h-24 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to Cross-Lingo Talk</h2>
              <p className="text-dark-300 mb-6">
                Select a conversation from the sidebar to start chatting, or search for users to begin a new conversation.
              </p>
              <div className="space-y-2 text-sm text-dark-400">
                <p>🌍 Messages are automatically translated</p>
                <p>⚡ Real-time messaging with typing indicators</p>
                <p>👥 See who's online and offline</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile 
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default Chat;
