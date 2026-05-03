const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// GET /api/comments/:postId  — get all comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar')
      .lean();

    res.json({
      comments: comments.map(c => ({
        id: c._id,
        text: c.text,
        time: formatTime(c.createdAt),
        user: {
          name: c.userId?.name || 'Unknown',
          avatarUrl: c.userId?.avatar || null,
        },
      })),
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/comments  — add a comment
router.post('/', auth, async (req, res) => {
  try {
    const { postId, text } = req.body;
    if (!postId || !text?.trim()) {
      return res.status(400).json({ message: 'postId and text are required.' });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user._id,
      text: text.trim(),
    });

    await Post.findByIdAndUpdate(postId, { $push: { commentsArray: comment._id } });

    res.status(201).json({
      comment: {
        id: comment._id,
        text: comment.text,
        time: 'just now',
        user: {
          name: req.user.name,
          avatarUrl: req.user.avatar || null,
        },
      },
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/comments/:id  — delete own comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    
    await Post.findByIdAndUpdate(comment.postId, { $pull: { commentsArray: comment._id } });
    await comment.deleteOne();
    
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

function formatTime(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

module.exports = router;
