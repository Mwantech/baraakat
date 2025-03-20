// NotificationController.js
const Notification = require('../models/Notification');

class NotificationController {
  static async getByUserId(req, res) {
    try {
      const notifications = await Notification.find({ userId: req.params.userId })
        .sort({ createdAt: -1 });
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const notification = new Notification(req.body);
      await notification.save();
      return res.status(201).json(notification);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async markAsRead(req, res) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id, 
        { isRead: true }, 
        { new: true }
      );
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      await Notification.updateMany(
        { userId: req.params.userId, isRead: false },
        { isRead: true }
      );
      return res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      return res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = NotificationController;