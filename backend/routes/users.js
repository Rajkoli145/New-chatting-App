const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users (for contact list)
router.get('/all', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const users = await User.find({ 
      _id: { $ne: currentUserId }, // Exclude current user
      isVerified: true 
    })
    .select('name phone preferredLanguage isOnline lastSeen avatar')
    .sort({ isOnline: -1, name: 1 }); // Online users first, then alphabetical

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        avatar: user.avatar
      }))
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Search users by name or phone
router.get('/search', auth, [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required')
], async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = {
      _id: { $ne: currentUserId }, // Exclude current user
      isVerified: true,
      $or: [
        { name: { $regex: q, $options: 'i' } }, // Case-insensitive name search
        { phone: { $regex: q.replace(/\D/g, '') } } // Phone search (digits only)
      ]
    };

    const users = await User.find(searchQuery)
      .select('name phone preferredLanguage isOnline lastSeen avatar')
      .limit(20) // Limit results
      .sort({ isOnline: -1, name: 1 });

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        avatar: user.avatar
      })),
      query: q
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Get user by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name phone preferredLanguage isOnline lastSeen avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'User not verified' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Get online users count
router.get('/stats/online', auth, async (req, res) => {
  try {
    const onlineCount = await User.countDocuments({ 
      isOnline: true, 
      isVerified: true,
      _id: { $ne: req.user._id }
    });

    const totalUsers = await User.countDocuments({ 
      isVerified: true,
      _id: { $ne: req.user._id }
    });

    res.json({
      onlineUsers: onlineCount,
      totalUsers: totalUsers
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

module.exports = router;
