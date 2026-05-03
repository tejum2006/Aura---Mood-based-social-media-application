const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Message = require('../models/Message');

// GET /api/messages/:receiverId  — get conversation between logged-in user and receiver
router.get('/:receiverId', auth, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(receiverId);

    const query = isValidObjectId
      ? {
          $or: [
            { sender: req.user._id, receiverId },
            { sender: receiverId, receiverId: req.user._id.toString() },
          ],
        }
      : { sender: req.user._id, receiverId };

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .lean();

    res.json({
      messages: messages.map(m => ({
        id: m._id,
        text: m.text,
        isSender: m.sender._id.toString() === req.user._id.toString(),
        time: formatTime(m.createdAt),
        senderName: m.sender.name,
      })),
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/messages  — send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, receiverName, receiverAvatar, text } = req.body;

    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ message: 'receiverId and text are required.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiverId,
      receiverName: receiverName || 'Unknown',
      receiverAvatar: receiverAvatar || '',
      text: text.trim(),
    });

    res.status(201).json({
      message: {
        id: message._id,
        text: message.text,
        isSender: true,
        time: 'just now',
        senderName: req.user.name,
      },
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/messages  — get all conversations (latest message from each person)
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiverId: req.user._id.toString() }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar')
      .lean();

    res.json({ count: messages.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

function formatTime(date) {
  const d = new Date(date);
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

module.exports = router;
