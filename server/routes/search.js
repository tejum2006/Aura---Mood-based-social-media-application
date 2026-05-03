const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const { posts: mockPosts } = require('../data/mockData');

// GET /api/search?q=query  — search posts and users
router.get('/', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const query = q.trim();

    if (!query) return res.json({ posts: [], users: [] });

    const regex = new RegExp(query, 'i');

    // Search real posts in DB
    let dbPosts = [];
    try {
      dbPosts = await Post.find({
        $or: [
          { caption: { $regex: regex } },
          { hashtags: { $regex: regex } },
          { location: { $regex: regex } },
        ],
      })
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } catch (_) {}

    // Search mock posts (client-visible)
    const matchedMock = mockPosts.filter(p =>
      regex.test(p.caption) ||
      p.hashtags.some(h => regex.test(h)) ||
      regex.test(p.user?.name || '') ||
      regex.test(p.user?.location || '')
    );

    // Search users in DB
    const dbUsers = await User.find({
      $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
    })
      .select('name email avatar')
      .limit(5)
      .lean();

    res.json({
      dbPosts: dbPosts.map(p => ({
        id: p._id,
        caption: p.caption,
        mood: p.mood,
        image: p.image,
        username: p.userId?.name || 'Unknown',
        avatarUrl: p.userId?.avatar || null,
        createdAt: p.createdAt,
      })),
      mockPostIds: matchedMock.map(p => p.id), // return IDs for frontend to filter
      users: dbUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatar || null,
      })),
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
