// ChatMessageController.js
const ChatMessage = require('../models/ChatMessage');

class ChatMessageController {
  static async getMessages(req, res) {
    try {
      const { senderId, receiverId } = req.query;
      const messages = await ChatMessage.find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }).sort({ createdAt: 1 });
      return res.json(messages);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async sendMessage(req, res) {
    try {
      const { senderId, receiverId, message } = req.body;
      const newMessage = new ChatMessage({
        senderId,
        receiverId,
        message,
        timestamp: new Date()
      });
      await newMessage.save();
      return res.status(201).json(newMessage);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const message = await ChatMessage.findByIdAndDelete(req.params.id);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      return res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = ChatMessageController;