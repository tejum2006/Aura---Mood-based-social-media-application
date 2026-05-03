const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const Post = require('../models/Post');
const Share = require('../models/Share');
const User = require('../models/User');

// GET /api/posts  — get user-created posts (DB only) with pagination
router.get('/', auth, async (req, res) => {
  try {
    const { mood, page = 1, limit = 10 } = req.query;
    const filter = mood && mood !== 'all' ? { mood } : {};
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(req.user._id);

    const posts = await Post.find(filter)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments(filter);

    res.json({
      posts: posts.map(p => ({
        id: p._id,
        caption: p.caption,
        image: p.image,
        mood: p.mood,
        likes: p.likes?.length || 0,
        comments: p.commentsArray?.length || 0,
        shares: p.shares || 0,
        hashtags: p.hashtags,
        location: p.location,
        createdAt: p.createdAt,
        isBookmarked: user?.bookmarks?.includes(p._id.toString()) || false,
        user: {
          id: p.userId?._id,
          name: p.userId?.name || 'Unknown',
          avatarUrl: p.userId?.avatar || null,
        },
      })),
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/posts  — create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { caption, mood, hashtags, location } = req.body;
    let imageUrl = '';

    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    } else if (req.body.image) {
      imageUrl = req.body.image; // Fallback to provided URL
    }

    if (!caption?.trim()) return res.status(400).json({ message: 'Caption is required.' });

    // Extract hashtags from caption if not provided
    let parsedTags = [];
    if (hashtags) {
      try {
        parsedTags = JSON.parse(hashtags);
      } catch (e) {
        parsedTags = Array.isArray(hashtags) ? hashtags : [hashtags];
      }
    }
    const extractedTags = caption.match(/#[\w]+/g) || [];
    const allTags = [...new Set([...parsedTags, ...extractedTags])];

    const post = await Post.create({
      userId: req.user._id,
      caption: caption.trim(),
      image: imageUrl,
      mood: mood || 'happy',
      hashtags: allTags,
      location: location || '',
    });

    res.status(201).json({
      post: {
        id: post._id,
        caption: post.caption,
        image: post.image,
        mood: post.mood,
        hashtags: post.hashtags,
        createdAt: post.createdAt,
        user: {
          id: req.user._id,
          name: req.user.name,
          avatarUrl: req.user.avatar || null,
        },
      },
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/posts/share  — share a post to someone
router.post('/share', auth, async (req, res) => {
  try {
    const { postId, toName, message } = req.body;
    if (!postId || !toName) return res.status(400).json({ message: 'postId and toName required.' });

    await Share.create({
      postId,
      fromUser: req.user._id,
      toName,
      message: message || '',
    });

    res.status(201).json({ message: `Post shared with ${toName} ✓` });
  } catch (err) {
    console.error('Share error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/posts/:id/bookmark  — toggle bookmark
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const postId = req.params.id;

    const isBookmarked = user.bookmarks.includes(postId);
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(id => id.toString() !== postId);
    } else {
      user.bookmarks.push(postId);
    }

    await user.save();
    res.json({ isBookmarked: !isBookmarked, message: !isBookmarked ? 'Post bookmarked.' : 'Bookmark removed.' });
  } catch (err) {
    console.error('Bookmark error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
