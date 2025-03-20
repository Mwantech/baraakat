// DoctorController.js
const Doctor = require('../models/Doctors');

class DoctorController {
  static async getAll(req, res) {
    try {
      const doctors = await Doctor.find();
      return res.json(doctors);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      return res.json(doctor);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const doctor = new Doctor(req.body);
      await doctor.save();
      return res.status(201).json(doctor);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      return res.json(doctor);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const doctor = await Doctor.findByIdAndDelete(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      return res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getAvailableDoctors(req, res) {
    try {
      const { date, specialty } = req.query;
      // Logic to find available doctors based on date and specialty
      const availableDoctors = await Doctor.find({
        specialty,
        // Additional logic to check availability based on appointments
      });
      return res.json(availableDoctors);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = DoctorController;
