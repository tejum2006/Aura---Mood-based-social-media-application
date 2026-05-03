const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true }, // supports mock + real post IDs
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
