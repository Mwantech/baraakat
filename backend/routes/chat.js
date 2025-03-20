// routes/messages.js - Messaging system routes
const express = require('express');
const router = express.Router();
const { Message, Conversation, Doctor, Patient, User, Notification } = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all conversations for the current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'firstName lastName email role profileImage'
    })
    .populate({
      path: 'lastMessage'
    })
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get or create a conversation with another user
router.post('/conversations', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] }
    })
    .populate({
      path: 'participants',
      select: 'firstName lastName email role profileImage'
    })
    .populate({
      path: 'lastMessage'
    });
    
    if (existingConversation) {
      return res.json(existingConversation);
    }
    
    // Create new conversation
    const newConversation = new Conversation({
      participants: [req.user.id, recipientId],
      lastMessage: null
    });
    
    await newConversation.save();
    
    // Populate the participants for the response
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate({
        path: 'participants',
        select: 'firstName lastName email role profileImage'
      });
    
    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get messages with pagination, sorted by timestamp (newest first)
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'sender',
        select: 'firstName lastName role'
      });
    
    // Get total count for pagination
    const total = await Message.countDocuments({ conversation: conversationId });
    
    // Mark messages as read if current user is not the sender
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        read: false
      },
      { read: true }
    );
    
    res.json({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a new message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;
    
    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message content or attachments are required' });
    }
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'participants',
        select: 'firstName lastName'
      });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }
    
    // Create new message
    const newMessage = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content,
      attachments: attachments || [],
      read: false
    });
    
    await newMessage.save();
    
    // Update conversation with last message
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();
    
    // Get recipient for notification
    const recipient = conversation.participants.find(p => p._id.toString() !== req.user.id);
    
    // Create notification for recipient
    const notification = new Notification({
      recipient: recipient._id,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message from ${req.user.firstName} ${req.user.lastName}`,
      relatedId: conversationId
    });
    
    await notification.save();
    
    // Populate sender info before sending response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate({
        path: 'sender',
        select: 'firstName lastName role'
      });
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread message count
router.get('/unread', auth, async (req, res) => {
  try {
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: req.user.id
    });
    
    const conversationIds = conversations.map(conv => conv._id);
    
    // Count unread messages across all conversations
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user.id },
      read: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a message (soft delete)
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    // Soft delete
    message.deleted = true;
    message.content = 'This message has been deleted';
    message.attachments = [];
    
    await message.save();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;