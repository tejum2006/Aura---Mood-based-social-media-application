const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// POST /api/likes/toggle  — toggle like on a post
router.post('/toggle', auth, async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: 'postId is required.' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes.pull(req.user._id);
      await post.save();
      return res.json({ liked: false, message: 'Post unliked.' });
    } else {
      post.likes.push(req.user._id);
      await post.save();
      return res.json({ liked: true, message: 'Post liked.' });
    }
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/likes/my  — get all postIds liked by logged-in user
router.get('/my', auth, async (req, res) => {
  try {
    const posts = await Post.find({ likes: req.user._id }).select('_id');
    res.json({ likedPostIds: posts.map(p => p._id) });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/likes/count/:postId  — count likes on a post
router.get('/count/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select('likes');
    res.json({ count: post ? post.likes.length : 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
