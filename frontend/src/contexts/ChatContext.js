
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

  // Handle new message (from socket or API)
  const handleNewMessage = useCallback((messageData) => {
    const conversationId = messageData.conversationId;

    // Add message to messages map (check for duplicates)
    setMessages(prev => {
      const updated = new Map(prev);
      const existing = updated.get(conversationId) || [];
      
      // Check if message already exists (by ID or if it's from current user and very recent)
      const messageExists = existing.some(msg => {
        // Exact ID match
        if (msg.id === messageData.id) return true;
        
        // For messages from current user, check if it's a duplicate based on content and time
        if (messageData.sender.id === user?.id && msg.sender.id === user?.id) {
          const timeDiff = Math.abs(new Date(messageData.createdAt) - new Date(msg.createdAt));
          const sameContent = msg.originalText === messageData.originalText;
          // If same content and within 5 seconds, consider it duplicate
          if (sameContent && timeDiff < 5000) {
            return true;
          }
        }
        
        return false;
      });
      
      if (messageExists) {
        console.log('Message already exists, skipping:', messageData.id);
        return prev; // Return previous state unchanged
      }
      
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
    }
  }, [user?.id]);

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
      const handleNewMessageEvent = (messageData) => {
        // Skip processing our own messages that come back from server
        // (they should be handled by message-sent event instead)
        if (messageData.sender.id === user?.id) {
          console.log('Skipping own message from new-message event:', messageData.id);
          return;
        }
        handleNewMessage(messageData);
      };

      // Message sent confirmation
      const handleMessageSentEvent = (data) => {
        console.log('Message sent confirmation:', data);
        if (data.tempMessageId && data.realMessage) {
          // Replace optimistic message with real message
          console.log('Replacing optimistic message:', data.tempMessageId, 'with real message:', data.realMessage.id);
          replaceOptimisticMessage(data.tempMessageId, data.realMessage);
        } else if (data.tempMessageId) {
          // If we have tempMessageId but no realMessage, just update the optimistic message
          console.log('Updating optimistic message status:', data.tempMessageId);
          updateOptimisticMessageStatus(data.tempMessageId, {
            isDelivered: true,
            deliveredAt: data.deliveredAt,
            isOptimistic: false
          });
        } else {
          // Fallback: just update status by ID
          updateMessageStatus(data.id, { 
            isDelivered: true, 
            deliveredAt: data.deliveredAt 
          });
        }
      };

      // Messages read receipt
      const handleMessagesReadEvent = (data) => {
        markConversationMessagesAsRead(data.conversationId, data.readBy);
      };

      // Handle message translation updates
      const handleMessageTranslatedEvent = (messageData) => {
        setMessages(prev => {
          const updated = new Map(prev);
          const conversationId = messageData.conversationId;
          const existing = updated.get(conversationId) || [];
          
          // Find and update the message with translation
          const updatedMessages = existing.map(msg => 
            msg.id === messageData.id 
              ? { ...msg, ...messageData }
              : msg
          );
          
          updated.set(conversationId, updatedMessages);
          return updated;
        });
      };

      socket.on('new-message', handleNewMessageEvent);
      socket.on('message-sent', handleMessageSentEvent);
      socket.on('messages-read', handleMessagesReadEvent);
      socket.on('message-translated', handleMessageTranslatedEvent);

      return () => {
        socket.off('new-message', handleNewMessageEvent);
        socket.off('message-sent', handleMessageSentEvent);
        socket.off('messages-read', handleMessagesReadEvent);
        socket.off('message-translated', handleMessageTranslatedEvent);
      };
    }
  }, [socket, isConnected, handleNewMessage, user?.id]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/messages/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error.response?.data?.message || error.message || error);
      // Remove toast notification for loading errors
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
      // Remove toast notification for loading errors
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
    // Create optimistic message for instant UI update
    const tempMessageId = `temp_${Date.now()}_${Math.random()}`;
    
    try {
      // Find existing conversation with this recipient
      const existingConversation = conversations.find(c => c.participant.id === recipientId);
      
      const optimisticMessage = {
        id: tempMessageId,
        conversationId: existingConversation?.id || `temp_${recipientId}`,
        sender: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar
        },
        originalText: text.trim(),
        displayText: text.trim(),
        senderLanguage: user.preferredLanguage,
        recipientLanguage: null,
        messageType,
        isTranslated: false,
        isDelivered: false, // Will be updated when confirmed
        isRead: false,
        createdAt: new Date().toISOString(),
        isOptimistic: true // Flag to identify optimistic messages
      };

      // Add optimistic message immediately to UI
      console.log('Adding optimistic message:', tempMessageId);
      handleNewMessage(optimisticMessage);

      const messageData = {
        recipientId,
        text: text.trim(),
        messageType,
        tempMessageId, // Include temp ID for matching
        // Include conversationId if we have an existing conversation
        ...(existingConversation && !existingConversation.id.startsWith('temp_') && {
          conversationId: existingConversation.id
        })
      };

      console.log('Sending message:', messageData);

      // Send via socket for real-time delivery
      if (socket && isConnected) {
        socket.emit('send-message', messageData);
        
        // Set a timeout to update the message status if no confirmation received
        setTimeout(() => {
          updateOptimisticMessageStatus(tempMessageId, {
            isDelivered: true,
            isOptimistic: false
          });
        }, 3000); // 3 second timeout
      } else {
        // Fallback to HTTP API
        console.log('Socket not connected, using HTTP API fallback');
        const response = await axios.post('/messages/send', messageData);
        // Replace optimistic message with real one
        replaceOptimisticMessage(tempMessageId, response.data.data);
      }

      return true;
    } catch (error) {
      console.error('Failed to send message:', error.response?.data?.message || error.message || error);
      // Remove the optimistic message on error
      removeOptimisticMessage(tempMessageId);
      return false;
    }
  };

  // Replace optimistic message with real message
  const replaceOptimisticMessage = (tempMessageId, realMessage) => {
    console.log('Attempting to replace optimistic message:', tempMessageId);
    setMessages(prev => {
      const updated = new Map(prev);
      let found = false;
      for (const [conversationId, msgs] of updated.entries()) {
        const msgIndex = msgs.findIndex(m => m.id === tempMessageId);
        if (msgIndex >= 0) {
          console.log('Found optimistic message at index:', msgIndex, 'in conversation:', conversationId);
          const updatedMsgs = [...msgs];
          updatedMsgs[msgIndex] = realMessage;
          updated.set(conversationId, updatedMsgs);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log('Optimistic message not found:', tempMessageId);
      }
      return updated;
    });
  };

  // Update optimistic message status
  const updateOptimisticMessageStatus = (tempMessageId, updates) => {
    console.log('Updating optimistic message status:', tempMessageId, updates);
    setMessages(prev => {
      const updated = new Map(prev);
      let found = false;
      for (const [conversationId, msgs] of updated.entries()) {
        const msgIndex = msgs.findIndex(m => m.id === tempMessageId);
        if (msgIndex >= 0) {
          const updatedMsgs = [...msgs];
          updatedMsgs[msgIndex] = { ...updatedMsgs[msgIndex], ...updates };
          updated.set(conversationId, updatedMsgs);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log('Optimistic message not found for status update:', tempMessageId);
      }
      return updated;
    });
  };

  // Remove optimistic message (on error)
  const removeOptimisticMessage = (tempMessageId) => {
    setMessages(prev => {
      const updated = new Map(prev);
      for (const [conversationId, msgs] of updated.entries()) {
        const msgIndex = msgs.findIndex(m => m.id === tempMessageId);
        if (msgIndex >= 0) {
          const updatedMsgs = [...msgs];
          updatedMsgs.splice(msgIndex, 1);
          updated.set(conversationId, updatedMsgs);
          break;
        }
      }
      return updated;
    });
  };

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
  const markConversationMessagesAsRead = useCallback((conversationId, readBy) => {
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
  }, [user?.id]);

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
