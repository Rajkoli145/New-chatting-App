const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[+]?[1-9]\d{1,14}$/ // International phone number format
  },
  preferredLanguage: {
    type: String,
    required: true,
    default: 'en',
    enum: ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'bn', 'ur', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'mr', 'or']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ phone: 1 });
userSchema.index({ name: 'text' });
userSchema.index({ isOnline: 1 });

// Virtual for user's full display info
userSchema.virtual('displayInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    preferredLanguage: this.preferredLanguage,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    avatar: this.avatar
  };
});

// Method to update online status
userSchema.methods.updateOnlineStatus = function(isOnline, socketId = null) {
  this.isOnline = isOnline;
  this.lastSeen = new Date();
  if (socketId !== null) {
    this.socketId = socketId;
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
