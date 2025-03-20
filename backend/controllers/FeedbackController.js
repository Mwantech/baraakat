// FeedbackController.js
const Feedback = require('../models/Feedback');

class FeedbackController {
  static async getAll(req, res) {
    try {
      const feedback = await Feedback.find()
        .populate('patient')
        .populate('doctor');
      return res.json(feedback);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const feedback = await Feedback.findById(req.params.id)
        .populate('patient')
        .populate('doctor');
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      return res.json(feedback);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const feedback = new Feedback(req.body);
      await feedback.save();
      return res.status(201).json(feedback);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      return res.json(feedback);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const feedback = await Feedback.findByIdAndDelete(req.params.id);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      return res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = FeedbackController;
