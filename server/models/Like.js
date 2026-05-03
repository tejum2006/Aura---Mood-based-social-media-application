const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: String, required: true }, // supports both mock IDs and real Mongo IDs
  },
  { timestamps: true }
);

// A user can only like a post once
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
