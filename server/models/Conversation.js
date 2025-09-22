const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only 2 participants per conversation
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next();
});

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageTime: -1 });

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    participants: { $all: [userId1, userId2] }
  }).populate('participants', 'name phone preferredLanguage isOnline lastSeen avatar')
    .populate('lastMessage');
};

// Static method to create or get conversation
conversationSchema.statics.createOrGet = async function(userId1, userId2) {
  let conversation = await this.findBetweenUsers(userId1, userId2);
  
  if (!conversation) {
    conversation = new this({
      participants: [userId1, userId2]
    });
    await conversation.save();
    await conversation.populate('participants', 'name phone preferredLanguage isOnline lastSeen avatar');
  }
  
  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
