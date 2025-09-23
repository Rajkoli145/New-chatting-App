const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const translationService = require('../services/translationService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get conversation messages
router.get('/conversation/:conversationId', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    // Get messages with pagination
    const messages = await Message.getConversationMessages(conversationId, page, limit);

    // Mark messages as read for the current user
    await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: req.user._id },
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    // Translate messages for the current user's preferred language
    const userLanguage = req.user.preferredLanguage;
    const translatedMessages = await Promise.all(
      messages.map(async (message) => {
        let displayText = message.originalText;
        let isTranslated = false;

        // Translate if message sender's language is different from current user's language
        if (message.senderLanguage !== userLanguage) {
          try {
            displayText = await translationService.translateText(
              message.originalText,
              message.senderLanguage,
              userLanguage
            );
            // Only mark as translated if the text actually changed
            isTranslated = displayText !== message.originalText;
          } catch (translationError) {
            console.error('Translation failed for message:', message._id, translationError);
            displayText = message.originalText; // Fallback to original
          }
        }

        return {
          id: message._id,
          conversationId: message.conversationId,
          sender: {
            id: message.sender._id,
            name: message.sender.name,
            phone: message.sender.phone,
            avatar: message.sender.avatar
          },
          originalText: message.originalText,
          translatedText: isTranslated ? displayText : null,
          displayText: displayText,
          senderLanguage: message.senderLanguage,
          recipientLanguage: userLanguage,
          messageType: message.messageType,
          isRead: message.isRead,
          readAt: message.readAt,
          isDelivered: message.isDelivered,
          deliveredAt: message.deliveredAt,
          isTranslated: isTranslated,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        };
      })
    );

    res.json({
      messages: translatedMessages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Send a message
router.post('/send', auth, [
  body('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1-1000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { recipientId, text, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isVerified) {
      return res.status(404).json({ message: 'Recipient not found or not verified' });
    }

    // Get or create conversation
    const conversation = await Conversation.createOrGet(senderId, recipientId);

    // Get sender and recipient languages
    const senderLanguage = req.user.preferredLanguage;
    const recipientLanguage = recipient.preferredLanguage;

    // Translate message if needed
    let translatedText = null;
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
        // Continue without translation
        translatedText = text;
      }
    } else {
      translatedText = text;
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
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

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    // Emit socket event (handled in socket handler)
    const io = req.app.get('io');
    if (io) {
      // Emit to recipient
      if (recipient.socketId) {
        io.to(recipient.socketId).emit('new-message', {
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
          displayText: message.displayText,
          senderLanguage: message.senderLanguage,
          recipientLanguage: message.recipientLanguage,
          messageType: message.messageType,
          isTranslated: message.isTranslated,
          createdAt: message.createdAt
        });
      }

      // Emit to sender for confirmation
      if (req.user.socketId) {
        io.to(req.user.socketId).emit('message-sent', {
          id: message._id,
          conversationId: message.conversationId,
          isDelivered: true,
          deliveredAt: message.deliveredAt
        });
      }
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: {
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
        displayText: message.displayText,
        senderLanguage: message.senderLanguage,
        recipientLanguage: message.recipientLanguage,
        messageType: message.messageType,
        isTranslated: message.isTranslated,
        isDelivered: message.isDelivered,
        deliveredAt: message.deliveredAt,
        createdAt: message.createdAt
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Get user's conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ 
      participants: userId 
    })
    .populate('participants', 'name phone preferredLanguage isOnline lastSeen avatar')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    const formattedConversations = conversations.map(conversation => {
      const otherParticipant = conversation.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      return {
        id: conversation._id,
        participant: {
          id: otherParticipant._id,
          name: otherParticipant.name,
          phone: otherParticipant.phone,
          preferredLanguage: otherParticipant.preferredLanguage,
          isOnline: otherParticipant.isOnline,
          lastSeen: otherParticipant.lastSeen,
          avatar: otherParticipant.avatar
        },
        lastMessage: conversation.lastMessage ? {
          id: conversation.lastMessage._id,
          text: conversation.lastMessage.displayText,
          sender: conversation.lastMessage.sender.toString(),
          createdAt: conversation.lastMessage.createdAt,
          isRead: conversation.lastMessage.isRead
        } : null,
        lastMessageTime: conversation.lastMessageTime,
        createdAt: conversation.createdAt
      };
    });

    res.json({
      conversations: formattedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    // Mark unread messages as read
    const result = await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: userId },
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    // Emit socket event for read receipts
    const io = req.app.get('io');
    if (io) {
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== userId.toString()
      );
      
      const otherUser = await User.findById(otherParticipant);
      if (otherUser && otherUser.socketId) {
        io.to(otherUser.socketId).emit('messages-read', {
          conversationId,
          readBy: userId,
          readAt: new Date()
        });
      }
    }

    res.json({
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read', error: error.message });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      sender: { $ne: userId },
      isRead: false,
      conversationId: { 
        $in: await Conversation.find({ participants: userId }).distinct('_id')
      }
    });

    res.json({
      unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
});

module.exports = router;
