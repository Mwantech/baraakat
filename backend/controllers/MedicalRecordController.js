const MedicalRecord = require('../models/MedicalRecord');

class MedicalRecordController {
  static async getAll(req, res) {
    try {
      const records = await MedicalRecord.find()
        .populate('patient')
        .populate('doctor');
      return res.json(records);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const record = await MedicalRecord.findById(req.params.id)
        .populate('patient')
        .populate('doctor');
      if (!record) {
        return res.status(404).json({ message: 'Medical record not found' });
      }
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getByPatientId(req, res) {
    try {
      const records = await MedicalRecord.find({ patient: req.params.patientId })
        .populate('doctor')
        .sort({ date: -1 });
      return res.json(records);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const record = new MedicalRecord(req.body);
      await record.save();
      return res.status(201).json(record);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!record) {
        return res.status(404).json({ message: 'Medical record not found' });
      }
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const record = await MedicalRecord.findByIdAndDelete(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Medical record not found' });
      }
      return res.json({ message: 'Medical record deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = MedicalRecordController;