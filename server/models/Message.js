const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: String, required: true }, // real userId or 'mock-luna' etc.
    receiverName: { type: String, required: true },
    receiverAvatar: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
