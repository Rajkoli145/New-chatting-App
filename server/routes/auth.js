const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const OTPVerification = require('../models/OTPVerification');
const otpService = require('../services/otpService');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user and send OTP
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('preferredLanguage').isIn(['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'bn', 'ur', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'mr', 'or']).withMessage('Invalid language')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, phone, preferredLanguage } = req.body;
    const formattedPhone = otpService.formatPhoneNumber(phone);

    // Check if user already exists
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already registered with this phone number' });
      } else {
        // User exists but not verified, update details and resend OTP
        existingUser.name = name;
        existingUser.preferredLanguage = preferredLanguage;
        await existingUser.save();
      }
    } else {
      // Create new user
      const newUser = new User({
        name,
        phone: formattedPhone,
        preferredLanguage,
        isVerified: false
      });
      await newUser.save();
    }

    // Generate and send OTP
    const otpRecord = await OTPVerification.createOTP(formattedPhone);
    const otpResult = await otpService.sendOTP(formattedPhone, otpRecord.otpCode);

    res.status(200).json({
      message: 'OTP sent successfully',
      phone: formattedPhone,
      otpSent: otpResult.success,
      // In development mode, include OTP in response
      ...(process.env.NODE_ENV === 'development' && { otp: otpRecord.otpCode })
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', [
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { phone, otp } = req.body;
    const formattedPhone = otpService.formatPhoneNumber(phone);

    // Find the OTP record
    const otpRecord = await OTPVerification.findOne({ 
      phone: formattedPhone, 
      isUsed: false 
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP found for this phone number' });
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Invalid OTP', 
        attemptsLeft: 3 - otpRecord.attempts 
      });
    }

    // Find and verify user
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Phone number verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        isOnline: user.isOnline,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
});

// Login (for returning users)
router.post('/login', [
  body('phone').isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { phone } = req.body;
    const formattedPhone = otpService.formatPhoneNumber(phone);

    // Find user
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Phone number not verified. Please complete registration.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update online status
    await user.updateOnlineStatus(true);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        isOnline: user.isOnline,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('phone').isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { phone } = req.body;
    const formattedPhone = otpService.formatPhoneNumber(phone);

    // Check if user exists
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    // Generate and send new OTP
    const otpRecord = await OTPVerification.createOTP(formattedPhone);
    const otpResult = await otpService.sendOTP(formattedPhone, otpRecord.otpCode);

    res.status(200).json({
      message: 'OTP resent successfully',
      otpSent: otpResult.success,
      // In development mode, include OTP in response
      ...(process.env.NODE_ENV === 'development' && { otp: otpRecord.otpCode })
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
        preferredLanguage: req.user.preferredLanguage,
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
  body('preferredLanguage').optional().isIn(['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'bn', 'ur', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'mr', 'or']).withMessage('Invalid language')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, preferredLanguage } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        isOnline: user.isOnline,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

module.exports = router;
