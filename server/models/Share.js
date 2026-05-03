const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toName: { type: String, required: true }, // recipient display name
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Share', shareSchema);
