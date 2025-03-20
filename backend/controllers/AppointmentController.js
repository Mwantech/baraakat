// AppointmentController.js
const Appointment = require('../models/Appointment');

class AppointmentController {
  static async getAll(req, res) {
    try {
      const appointments = await Appointment.find()
        .populate('patient')
        .populate('doctor');
      return res.json(appointments);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('patient')
        .populate('doctor');
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      return res.json(appointment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const appointment = new Appointment(req.body);
      await appointment.save();
      return res.status(201).json(appointment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      return res.json(appointment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const appointment = await Appointment.findByIdAndDelete(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      return res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = AppointmentController;