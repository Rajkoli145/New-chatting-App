import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState(new Map());
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { socket, isConnected, joinConversation } = useSocket();
  const { user, isAuthenticated } = useAuth();

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      loadUsers();
      loadUnreadCount();
    }
  }, [isAuthenticated]);

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      // New message received
      socket.on('new-message', (messageData) => {
        handleNewMessage(messageData);
      });

      // Message sent confirmation
      socket.on('message-sent', (data) => {
        // Update message status
        updateMessageStatus(data.id, { 
          isDelivered: true, 
          deliveredAt: data.deliveredAt 
        });
      });

      // Messages read receipt
      socket.on('messages-read', (data) => {
        markConversationMessagesAsRead(data.conversationId, data.readBy);
      });

      return () => {
        socket.off('new-message');
        socket.off('message-sent');
        socket.off('messages-read');
      };
    }
  }, [socket, isConnected]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/messages/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load all users
  const loadUsers = async () => {
    try {
      const response = await axios.get('/users/all');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  // Load unread message count
  const loadUnreadCount = async () => {
    try {
      const response = await axios.get('/messages/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // Search users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
      setSearchResults([]);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId, page = 1) => {
    try {
      const response = await axios.get(`/messages/conversation/${conversationId}?page=${page}&limit=50`);
      const conversationMessages = response.data.messages.reverse(); // Reverse to show oldest first
      
      setMessages(prev => {
        const updated = new Map(prev);
        if (page === 1) {
          // First page, replace all messages
          updated.set(conversationId, conversationMessages);
        } else {
          // Additional pages, prepend to existing messages
          const existing = updated.get(conversationId) || [];
          updated.set(conversationId, [...conversationMessages, ...existing]);
        }
        return updated;
      });

      return response.data;
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
      return null;
    }
  };

  // Send a message
  const sendMessage = async (recipientId, text, messageType = 'text') => {
    try {
      const messageData = {
        recipientId,
        text: text.trim(),
        messageType
      };

      // Send via socket for real-time delivery
      if (socket && isConnected) {
        socket.emit('send-message', messageData);
      } else {
        // Fallback to HTTP API
        const response = await axios.post('/messages/send', messageData);
        handleNewMessage(response.data.data);
      }

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  // Handle new message (from socket or API)
  const handleNewMessage = useCallback((messageData) => {
    const conversationId = messageData.conversationId;

    // Add message to messages map
    setMessages(prev => {
      const updated = new Map(prev);
      const existing = updated.get(conversationId) || [];
      updated.set(conversationId, [...existing, messageData]);
      return updated;
    });

    // Update conversation list
    setConversations(prev => {
      const updated = [...prev];
      const conversationIndex = updated.findIndex(c => c.id === conversationId);
      
      if (conversationIndex >= 0) {
        // Update existing conversation
        updated[conversationIndex] = {
          ...updated[conversationIndex],
          lastMessage: {
            id: messageData.id,
            text: messageData.displayText,
            sender: messageData.sender.id,
            createdAt: messageData.createdAt,
            isRead: messageData.sender.id === user?.id
          },
          lastMessageTime: messageData.createdAt
        };
        
        // Move to top
        const conversation = updated.splice(conversationIndex, 1)[0];
        updated.unshift(conversation);
      } else {
        // Create new conversation entry (this shouldn't happen often)
        const newConversation = {
          id: conversationId,
          participant: messageData.sender,
          lastMessage: {
            id: messageData.id,
            text: messageData.displayText,
            sender: messageData.sender.id,
            createdAt: messageData.createdAt,
            isRead: messageData.sender.id === user?.id
          },
          lastMessageTime: messageData.createdAt,
          createdAt: messageData.createdAt
        };
        updated.unshift(newConversation);
      }
      
      return updated;
    });

    // Update unread count if message is not from current user
    if (messageData.sender.id !== user?.id) {
      setUnreadCount(prev => prev + 1);
      
      // Show notification if not in active conversation
      if (activeConversation?.id !== conversationId) {
        toast.success(`New message from ${messageData.sender.name}`);
      }
    }
  }, [user?.id, activeConversation?.id]);

  // Update message status
  const updateMessageStatus = (messageId, updates) => {
    setMessages(prev => {
      const updated = new Map(prev);
      for (const [conversationId, msgs] of updated.entries()) {
        const msgIndex = msgs.findIndex(m => m.id === messageId);
        if (msgIndex >= 0) {
          const updatedMsgs = [...msgs];
          updatedMsgs[msgIndex] = { ...updatedMsgs[msgIndex], ...updates };
          updated.set(conversationId, updatedMsgs);
          break;
        }
      }
      return updated;
    });
  };

  // Mark conversation messages as read
  const markConversationMessagesAsRead = (conversationId, readBy) => {
    if (readBy === user?.id) return; // Don't update if current user read the messages

    setMessages(prev => {
      const updated = new Map(prev);
      const msgs = updated.get(conversationId);
      if (msgs) {
        const updatedMsgs = msgs.map(msg => 
          msg.sender.id === user?.id && !msg.isRead
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        );
        updated.set(conversationId, updatedMsgs);
      }
      return updated;
    });
  };

  // Start a conversation with a user
  const startConversation = async (userId) => {
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.participant.id === userId);
      if (existingConversation) {
        setActiveConversation(existingConversation);
        joinConversation(existingConversation.id);
        return existingConversation;
      }

      // Find user details
      const targetUser = users.find(u => u.id === userId) || 
                        searchResults.find(u => u.id === userId);
      
      if (!targetUser) {
        toast.error('User not found');
        return null;
      }

      // Create new conversation object (will be updated when first message is sent)
      const newConversation = {
        id: `temp_${userId}`, // Temporary ID
        participant: targetUser,
        lastMessage: null,
        lastMessageTime: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      setActiveConversation(newConversation);
      return newConversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  // Set active conversation
  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    
    if (conversation && !conversation.id.startsWith('temp_')) {
      // Join socket room
      joinConversation(conversation.id);
      
      // Load messages if not already loaded
      if (!messages.has(conversation.id)) {
        await loadMessages(conversation.id);
      }
      
      // Mark messages as read
      try {
        await axios.put(`/messages/read/${conversation.id}`);
        // Update local state
        markConversationMessagesAsRead(conversation.id, user?.id);
        // Update unread count
        loadUnreadCount();
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    }
  };

  const value = {
    conversations,
    messages,
    activeConversation,
    users,
    searchResults,
    loading,
    unreadCount,
    loadConversations,
    loadUsers,
    loadMessages,
    searchUsers,
    sendMessage,
    startConversation,
    selectConversation,
    setActiveConversation,
    getConversationMessages: (conversationId) => messages.get(conversationId) || []
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
