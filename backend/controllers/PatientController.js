// PatientController.js
const Patient = require('../models/Patient');

class PatientController {
  static async getAll(req, res) {
    try {
      const patients = await Patient.find();
      return res.json(patients);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      return res.json(patient);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const patient = new Patient(req.body);
      await patient.save();
      return res.status(201).json(patient);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      return res.json(patient);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const patient = await Patient.findByIdAndDelete(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      return res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = PatientController;
