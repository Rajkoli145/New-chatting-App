const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otpCode: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries and automatic cleanup
otpVerificationSchema.index({ phone: 1 });
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to verify OTP
otpVerificationSchema.methods.verifyOTP = function(inputOTP) {
  if (this.isUsed) {
    throw new Error('OTP already used');
  }
  
  if (this.attempts >= 3) {
    throw new Error('Maximum attempts exceeded');
  }
  
  if (new Date() > this.expiresAt) {
    throw new Error('OTP expired');
  }
  
  this.attempts += 1;
  
  if (this.otpCode === inputOTP) {
    this.isVerified = true;
    this.isUsed = true;
    return this.save().then(() => true);
  } else {
    return this.save().then(() => false);
  }
};

// Static method to generate OTP
otpVerificationSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create new OTP
otpVerificationSchema.statics.createOTP = async function(phone) {
  // Delete any existing OTP for this phone
  await this.deleteMany({ phone, isUsed: false });
  
  const otpCode = this.generateOTP();
  const otp = new this({
    phone,
    otpCode
  });
  
  await otp.save();
  return otp;
};

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
