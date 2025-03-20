// DiseaseController.js
const Disease = require('../models/Disease');

class DiseaseController {
  static async getAll(req, res) {
    try {
      const diseases = await Disease.find();
      return res.json(diseases);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const disease = await Disease.findById(req.params.id);
      if (!disease) {
        return res.status(404).json({ message: 'Disease not found' });
      }
      return res.json(disease);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const disease = new Disease(req.body);
      await disease.save();
      return res.status(201).json(disease);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const disease = await Disease.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!disease) {
        return res.status(404).json({ message: 'Disease not found' });
      }
      return res.json(disease);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const disease = await Disease.findByIdAndDelete(req.params.id);
      if (!disease) {
        return res.status(404).json({ message: 'Disease not found' });
      }
      return res.json({ message: 'Disease deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = DiseaseController;
