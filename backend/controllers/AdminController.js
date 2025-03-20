Files

// AdminController.js
const Admin = require('../models/Admin');

class AdminController {
  static async getAll(req, res) {
    try {
      const admins = await Admin.find();
      return res.json(admins);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const admin = await Admin.findById(req.params.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      return res.json(admin);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const admin = new Admin(req.body);
      await admin.save();
      return res.status(201).json(admin);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      return res.json(admin);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const admin = await Admin.findByIdAndDelete(req.params.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      return res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = AdminController;