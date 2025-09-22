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
        isOnline: true
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
        try {
          const { conversationId, recipientId, text, messageType = 'text' } = data;

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

          // Translate message if needed
          let translatedText = text;
          let isTranslated = false;
          
          if (senderLanguage !== recipientLanguage) {
            try {
              translatedText = await translationService.translateText(
                text, 
                senderLanguage, 
                recipientLanguage
              );
              isTranslated = true;
            } catch (translationError) {
              console.error('Translation failed:', translationError);
            }
          }

          // Create message
          const message = new Message({
            conversationId: conversation._id,
            sender: socket.userId,
            originalText: text,
            translatedText,
            senderLanguage,
            recipientLanguage,
            messageType,
            isTranslated,
            isDelivered: true,
            deliveredAt: new Date()
          });

          await message.save();
          await message.populate('sender', 'name phone avatar');

          // Update conversation
          conversation.lastMessage = message._id;
          conversation.lastMessageTime = new Date();
          await conversation.save();

          const messageData = {
            id: message._id,
            conversationId: message.conversationId,
            sender: {
              id: message.sender._id,
              name: message.sender.name,
              phone: message.sender.phone,
              avatar: message.sender.avatar
            },
            originalText: message.originalText,
            translatedText: message.translatedText,
            displayText: message.translatedText || message.originalText,
            senderLanguage: message.senderLanguage,
            recipientLanguage: message.recipientLanguage,
            messageType: message.messageType,
            isTranslated: message.isTranslated,
            isDelivered: message.isDelivered,
            deliveredAt: message.deliveredAt,
            createdAt: message.createdAt
          };

          // Send to conversation room
          io.to(`conversation_${conversation._id}`).emit('new-message', messageData);

          // Send to recipient's personal room (in case they're not in conversation room)
          io.to(`user_${recipientId}`).emit('new-message', messageData);

          // Confirm to sender
          socket.emit('message-sent', {
            id: message._id,
            conversationId: message.conversationId,
            isDelivered: true,
            deliveredAt: message.deliveredAt
          });

        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
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
          socket.broadcast.emit('user-offline', {
            userId: socket.userId,
            name: socket.user.name,
            isOnline: false,
            lastSeen: new Date()
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
