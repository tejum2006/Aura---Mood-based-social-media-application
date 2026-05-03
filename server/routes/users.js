const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/users/me  — get profile
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/users/change-password  — change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/users/profile  — update profile name / bio / avatar
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/network  — get pending requests and active connections
router.get('/network', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('pendingRequests', 'name avatar email bio')
      .populate('following', 'name avatar email bio')
      .lean();

    // In a real app we might determine mutuals differently, but here we just map them
    const requests = (user.pendingRequests || []).map(u => ({
      id: u._id,
      name: u.name,
      username: `@${u.email.split('@')[0]}`,
      avatar: u.avatar || '',
      gradient: 'from-orange-400 to-rose-400',
      mutual: Math.floor(Math.random() * 10), // mock mutual count
      location: 'AURA Network',
    }));

    const connections = (user.following || []).map(u => ({
      id: u._id,
      name: u.name,
      username: `@${u.email.split('@')[0]}`,
      avatar: u.avatar || '',
    }));

    res.json({ requests, connections });
  } catch (err) {
    console.error('Network error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/users/follow/:id  — send request, accept, or decline
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'request', 'accept', 'decline'
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself.' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    if (action === 'request') {
      if (!targetUser.pendingRequests.includes(currentUserId) && !targetUser.followers.includes(currentUserId)) {
        targetUser.pendingRequests.push(currentUserId);
        await targetUser.save();
      }
      return res.json({ message: 'Follow request sent.' });
    }

    if (action === 'accept') {
      // Remove from pending
      currentUser.pendingRequests = currentUser.pendingRequests.filter(id => id.toString() !== targetUserId);
      
      // Add to followers and following (mutual connection)
      if (!currentUser.followers.includes(targetUserId)) {
        currentUser.followers.push(targetUserId);
        currentUser.following.push(targetUserId);
      }
      if (!targetUser.following.includes(currentUserId)) {
        targetUser.following.push(currentUserId);
        targetUser.followers.push(currentUserId);
      }

      await currentUser.save();
      await targetUser.save();
      return res.json({ message: 'Request accepted.' });
    }

    if (action === 'decline') {
      currentUser.pendingRequests = currentUser.pendingRequests.filter(id => id.toString() !== targetUserId);
      await currentUser.save();
      return res.json({ message: 'Request declined.' });
    }

    res.status(400).json({ message: 'Invalid action.' });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/profile/:id  — get user profile and their posts
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const targetUser = await User.findById(req.params.id)
      .select('name avatar location followers following')
      .lean();

    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    const posts = await Post.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    const loggedInUser = await User.findById(req.user._id);

    res.json({
      profile: {
        id: targetUser._id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        location: targetUser.location || 'AURA User',
        followersCount: targetUser.followers?.length || 0,
        followingCount: targetUser.following?.length || 0,
        isFollowing: targetUser.followers?.some(f => f.toString() === req.user._id.toString()),
      },
      posts: posts.map(p => ({
        id: p._id,
        caption: p.caption,
        image: p.image,
        mood: p.mood,
        likes: p.likes || 0,
        comments: p.comments || 0,
        time: 'recently',
        isBookmarked: loggedInUser.bookmarks?.includes(p._id.toString()),
      })),
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
