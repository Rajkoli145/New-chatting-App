const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const translationService = require('../services/translationService');

// Store active users and their typing status
const activeUsers = new Map();
const typingUsers = new Map();

const socketHandler = (io) => {
  // Store io instance for use in routes
  io.app = io;

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isVerified) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);

    try {
      // Update user's online status and socket ID
      await socket.user.updateOnlineStatus(true, socket.id);
      activeUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        lastSeen: new Date()
      });

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Get user's conversations and join those rooms
      const conversations = await Conversation.find({ 
        participants: socket.userId 
      });
      
      conversations.forEach(conversation => {
        socket.join(`conversation_${conversation._id}`);
      });

      // Notify other users that this user is online
      socket.broadcast.emit('user-online', {
        userId: socket.userId,
        name: socket.user.name,
        isOnline: true,
        lastSeen: new Date()
      });

      // Also send to all conversation rooms this user is part of
      conversations.forEach(conversation => {
        socket.to(`conversation_${conversation._id}`).emit('user-online', {
          userId: socket.userId,
          name: socket.user.name,
          isOnline: true,
          lastSeen: new Date()
        });
      });

      // Handle request for online users list
      socket.on('get-online-users', () => {
        const onlineUsersList = Array.from(activeUsers.values()).map(userData => ({
          userId: userData.user._id.toString(),
          name: userData.user.name,
          isOnline: true,
          lastSeen: userData.lastSeen
        }));
        socket.emit('online-users-list', onlineUsersList);
      });

      // Handle joining a conversation
      socket.on('join-conversation', async (data) => {
        try {
          const { conversationId } = data;
          
          // Verify user is part of this conversation
          const conversation = await Conversation.findById(conversationId);
          if (conversation && conversation.participants.includes(socket.userId)) {
            socket.join(`conversation_${conversationId}`);
            console.log(`📱 User ${socket.user.name} joined conversation ${conversationId}`);
            
            // Mark messages as delivered
            await Message.updateMany(
              { 
                conversationId,
                sender: { $ne: socket.userId },
                isDelivered: false
              },
              { 
                isDelivered: true,
                deliveredAt: new Date()
              }
            );
          }
        } catch (error) {
          console.error('Join conversation error:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle sending messages
      socket.on('send-message', async (data) => {
        const startTime = Date.now();
        try {
          const { conversationId, recipientId, text, messageType = 'text', tempMessageId } = data;
          console.log(`📤 Processing message from ${socket.user.name} to ${recipientId}`);

          // Verify recipient exists
          const recipient = await User.findById(recipientId);
          if (!recipient || !recipient.isVerified) {
            socket.emit('error', { message: 'Recipient not found' });
            return;
          }

          // Get or create conversation
          const conversation = await Conversation.createOrGet(socket.userId, recipientId);

          // Get languages
          const senderLanguage = socket.user.preferredLanguage;
          const recipientLanguage = recipient.preferredLanguage;

          // Create message with original text (no translation stored in DB)
          const message = new Message({
            conversationId: conversation._id,
            sender: socket.userId,
            originalText: text,
            translatedText: null, // We'll translate on-demand for each user
            senderLanguage,
            recipientLanguage: null, // Not storing specific recipient language
            messageType,
            isTranslated: false, // Will be determined per user
            isDelivered: true,
            deliveredAt: new Date()
          });

          // Save message and get participants in parallel
          const [savedMessage, participants] = await Promise.all([
            message.save().then(msg => msg.populate('sender', 'name phone avatar')),
            User.find({ 
              _id: { $in: conversation.participants } 
            }).select('_id preferredLanguage')
          ]);

          // Update conversation asynchronously (don't wait for it)
          conversation.lastMessage = savedMessage._id;
          conversation.lastMessageTime = new Date();
          conversation.save().catch(err => console.error('Failed to update conversation:', err));

          // First, send the message immediately to all participants with original text
          // This ensures instant delivery, then we handle translations asynchronously
          const baseMessageData = {
            id: message._id,
            conversationId: message.conversationId,
            sender: {
              id: message.sender._id,
              name: message.sender.name,
              phone: message.sender.phone,
              avatar: message.sender.avatar
            },
            originalText: message.originalText,
            senderLanguage: message.senderLanguage,
            messageType: message.messageType,
            isDelivered: message.isDelivered,
            deliveredAt: message.deliveredAt,
            createdAt: message.createdAt
          };

          // Send immediate message to all participants (except sender)
          participants.forEach(participant => {
            // Skip sending to the sender (they get confirmation via message-sent event)
            if (participant._id.toString() === socket.userId) {
              return;
            }
            
            const immediateMessageData = {
              ...baseMessageData,
              displayText: text, // Show original text first
              recipientLanguage: participant.preferredLanguage,
              isTranslated: false,
              translatedText: null
            };
            io.to(`user_${participant._id}`).emit('new-message', immediateMessageData);
          });

          // Handle translations asynchronously for participants with different languages (except sender)
          const translationPromises = participants
            .filter(participant => 
              participant.preferredLanguage !== senderLanguage && 
              participant._id.toString() !== socket.userId
            )
            .map(async (participant) => {
              try {
                const displayText = await translationService.translateText(
                  text, 
                  senderLanguage, 
                  participant.preferredLanguage
                );
                
                // Only send update if translation is different from original
                if (displayText !== text) {
                  const translatedMessageData = {
                    ...baseMessageData,
                    displayText: displayText,
                    recipientLanguage: participant.preferredLanguage,
                    isTranslated: true,
                    translatedText: displayText
                  };
                  
                  // Send translated version
                  io.to(`user_${participant._id}`).emit('message-translated', translatedMessageData);
                  console.log(`Translated message for ${participant._id}: "${text}" -> "${displayText}"`);
                }
              } catch (translationError) {
                console.error('Translation failed for participant:', participant._id, translationError);
                // No need to send anything as original message was already sent
              }
            });

          // Execute all translations in parallel (don't wait for them)
          Promise.all(translationPromises).catch(error => {
            console.error('Some translations failed:', error);
          });

          // Confirm to sender with real message data
          const processingTime = Date.now() - startTime;
          console.log(`✅ Message sent in ${processingTime}ms`);
          console.log('Sending confirmation with tempMessageId:', tempMessageId);
          
          socket.emit('message-sent', {
            id: message._id,
            tempMessageId, // Include temp ID for frontend to match
            conversationId: message.conversationId,
            isDelivered: true,
            deliveredAt: message.deliveredAt,
            processingTime,
            realMessage: {
              id: message._id,
              conversationId: message.conversationId,
              sender: {
                id: message.sender._id,
                name: message.sender.name,
                phone: message.sender.phone,
                avatar: message.sender.avatar
              },
              originalText: message.originalText,
              displayText: text,
              senderLanguage: message.senderLanguage,
              recipientLanguage: null,
              messageType: message.messageType,
              isTranslated: false,
              isDelivered: true,
              isRead: false,
              deliveredAt: message.deliveredAt,
              createdAt: message.createdAt,
              isOptimistic: false // Mark as not optimistic
            }
          });

        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('message-error', { 
            message: 'Failed to send message',
            error: error.message,
            originalData: data
          });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { conversationId, recipientId } = data;
        
        // Store typing status
        const typingKey = `${conversationId}_${socket.userId}`;
        typingUsers.set(typingKey, {
          userId: socket.userId,
          userName: socket.user.name,
          conversationId,
          timestamp: new Date()
        });

        // Notify recipient
        io.to(`user_${recipientId}`).emit('user-typing', {
          conversationId,
          userId: socket.userId,
          userName: socket.user.name,
          isTyping: true
        });

        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          if (typingUsers.has(typingKey)) {
            typingUsers.delete(typingKey);
            io.to(`user_${recipientId}`).emit('user-typing', {
              conversationId,
              userId: socket.userId,
              userName: socket.user.name,
              isTyping: false
            });
          }
        }, 3000);
      });

      socket.on('typing-stop', (data) => {
        const { conversationId, recipientId } = data;
        const typingKey = `${conversationId}_${socket.userId}`;
        
        typingUsers.delete(typingKey);
        
        // Notify recipient
        io.to(`user_${recipientId}`).emit('user-typing', {
          conversationId,
          userId: socket.userId,
          userName: socket.user.name,
          isTyping: false
        });
      });

      // Handle message read receipts
      socket.on('mark-messages-read', async (data) => {
        try {
          const { conversationId } = data;

          // Verify user is part of conversation
          const conversation = await Conversation.findById(conversationId);
          if (!conversation || !conversation.participants.includes(socket.userId)) {
            socket.emit('error', { message: 'Access denied to conversation' });
            return;
          }

          // Mark messages as read
          await Message.updateMany(
            { 
              conversationId, 
              sender: { $ne: socket.userId },
              isRead: false 
            },
            { 
              isRead: true, 
              readAt: new Date() 
            }
          );

          // Notify other participants
          socket.to(`conversation_${conversationId}`).emit('messages-read', {
            conversationId,
            readBy: socket.userId,
            readAt: new Date()
          });

        } catch (error) {
          console.error('Mark read error:', error);
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`🔌 User disconnected: ${socket.user.name} (${socket.userId})`);

        try {
          // Update user's offline status
          await socket.user.updateOnlineStatus(false, null);
          
          // Remove from active users
          activeUsers.delete(socket.userId);

          // Clear typing indicators
          for (const [key, typing] of typingUsers.entries()) {
            if (typing.userId === socket.userId) {
              typingUsers.delete(key);
              // Notify that user stopped typing
              io.to(`conversation_${typing.conversationId}`).emit('user-typing', {
                conversationId: typing.conversationId,
                userId: socket.userId,
                userName: socket.user.name,
                isTyping: false
              });
            }
          }

          // Notify other users that this user is offline
          const offlineData = {
            userId: socket.userId,
            name: socket.user.name,
            isOnline: false,
            lastSeen: new Date()
          };
          
          socket.broadcast.emit('user-offline', offlineData);
          
          // Also notify all conversation rooms
          const userConversations = await Conversation.find({ 
            participants: socket.userId 
          });
          
          userConversations.forEach(conversation => {
            socket.to(`conversation_${conversation._id}`).emit('user-offline', offlineData);
          });

        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  });

  // Clean up typing indicators periodically
  setInterval(() => {
    const now = new Date();
    for (const [key, typing] of typingUsers.entries()) {
      if (now - typing.timestamp > 5000) { // 5 seconds
        typingUsers.delete(key);
        io.to(`conversation_${typing.conversationId}`).emit('user-typing', {
          conversationId: typing.conversationId,
          userId: typing.userId,
          userName: typing.userName,
          isTyping: false
        });
      }
    }
  }, 5000);

  console.log('🚀 Socket.io server initialized');
};

module.exports = socketHandler;
