const Prescription = require('../models/Prescription');

class PrescriptionController {
  static async getAll(req, res) {
    try {
      const prescriptions = await Prescription.find()
        .populate('patient')
        .populate('doctor');
      return res.json(prescriptions);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const prescription = await Prescription.findById(req.params.id)
        .populate('patient')
        .populate('doctor');
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      return res.json(prescription);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getByPatientId(req, res) {
    try {
      const prescriptions = await Prescription.find({ patient: req.params.patientId })
        .populate('doctor')
        .sort({ date: -1 });
      return res.json(prescriptions);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const prescription = new Prescription(req.body);
      await prescription.save();
      return res.status(201).json(prescription);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      return res.json(prescription);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const prescription = await Prescription.findByIdAndDelete(req.params.id);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      return res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = PrescriptionController;
