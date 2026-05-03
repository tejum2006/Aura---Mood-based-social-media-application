const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, required: true, trim: true, maxlength: 2000 },
    image: { type: String, default: '' },
    mood: { type: String, enum: ['happy', 'chill', 'energetic'], default: 'happy' },
    hashtags: [{ type: String }],
    location: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentsArray: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

postSchema.index({ mood: 1, createdAt: -1 });
postSchema.index({ caption: 'text', hashtags: 'text' }); // text search

module.exports = mongoose.model('Post', postSchema);
