import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      // Create socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        setIsConnected(true);
        // Remove toast notification for connection
        
        // Request current online users with a small delay to ensure server is ready
        setTimeout(() => {
          newSocket.emit('get-online-users');
        }, 1000);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
        // Only show disconnect toast if it was unexpected
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        // Remove toast notification for connection errors
      });

      // User status event handlers
      newSocket.on('user-online', (data) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(data.userId, {
            ...data,
            isOnline: true
          });
          return updated;
        });
      });

      newSocket.on('user-offline', (data) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(data.userId, {
            ...data,
            isOnline: false,
            lastSeen: data.lastSeen
          });
          return updated;
        });
      });

      // Handle online users list
      newSocket.on('online-users-list', (users) => {
        const usersMap = new Map();
        users.forEach(user => {
          usersMap.set(user.userId, {
            ...user,
            isOnline: true
          });
        });
        setOnlineUsers(usersMap);
      });

      // Typing indicators
      newSocket.on('user-typing', (data) => {
        const { conversationId, userId, userName, isTyping } = data;
        const key = `${conversationId}_${userId}`;
        
        setTypingUsers(prev => {
          const updated = new Map(prev);
          if (isTyping) {
            updated.set(key, { userId, userName, conversationId });
          } else {
            updated.delete(key);
          }
          return updated;
        });
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        // Remove toast notification for socket errors
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Map());
        setTypingUsers(new Map());
      };
    }
  }, [isAuthenticated, token, user]);

  // Socket helper functions
  const joinConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', { conversationId });
    }
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    }
  };

  const startTyping = (conversationId, recipientId) => {
    if (socket && isConnected) {
      socket.emit('typing-start', { conversationId, recipientId });
    }
  };

  const stopTyping = (conversationId, recipientId) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', { conversationId, recipientId });
    }
  };

  const markMessagesAsRead = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('mark-messages-read', { conversationId });
    }
  };

  // Check if user is online
  const isUserOnline = (userId) => {
    const userStatus = onlineUsers.get(userId);
    return userStatus?.isOnline || false;
  };

  // Get user's last seen
  const getUserLastSeen = (userId) => {
    const userStatus = onlineUsers.get(userId);
    return userStatus?.lastSeen;
  };

  // Check if user is typing in a conversation
  const isUserTyping = (conversationId, userId) => {
    const key = `${conversationId}_${userId}`;
    return typingUsers.has(key);
  };

  // Get typing users in a conversation
  const getTypingUsers = (conversationId) => {
    const typing = [];
    for (const [, data] of typingUsers.entries()) {
      if (data.conversationId === conversationId) {
        typing.push(data);
      }
    }
    return typing;
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    isUserOnline,
    getUserLastSeen,
    isUserTyping,
    getTypingUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
