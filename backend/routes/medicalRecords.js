// routes/medicalRecords.js - Medical record access
const express = require('express');
const router = express.Router();
const { MedicalRecord, Patient, Doctor, User, Notification } = require('../models/MedicalRecord');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all medical records (admin only)
router.get('/all', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const medicalRecords = await MedicalRecord.find()
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('appointment')
      .populate('prescription')
      .sort({ createdAt: -1 });
    
    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user medical records (based on role)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      filter.doctor = doctor._id;
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      filter.patient = patient._id;
    }
    
    const medicalRecords = await MedicalRecord.find(filter)
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('appointment')
      .populate('prescription')
      .sort({ createdAt: -1 });
    
    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient's medical records
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if user is authorized to view these records
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || patient._id.toString() !== patientId) {
        return res.status(403).json({ message: 'Not authorized to view these medical records' });
      }
    } else if (req.user.role === 'doctor') {
      // Doctors can view patient records (assuming they have permission)
      // This could be enhanced with consent management in a real system
    }
    
    const medicalRecords = await MedicalRecord.find({ patient: patientId })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('appointment')
      .populate('prescription')
      .sort({ createdAt: -1 });
    
    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get medical record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('appointment')
      .populate('prescription');
    
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Check if user is authorized to view this record
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || medicalRecord.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this medical record' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || medicalRecord.doctor.toString() !== doctor._id.toString()) {
        // Allow doctors to view other doctors' records for their patients
        // This could be enhanced with more granular permissions
      }
    }
    
    res.json(medicalRecord);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new medical record (doctors only)
router.post('/', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    const { 
      patientId, 
      appointmentId, 
      prescriptionId,
      diagnosis, 
      notes,
      type,
      attachments,
      vitals
    } = req.body;
    
    // Validate required fields
    if (!patientId || !diagnosis || !type) {
      return res.status(400).json({ message: 'Patient ID, diagnosis, and type are required' });
    }
    
    // Get doctor ID
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create medical record
    const newMedicalRecord = new MedicalRecord({
      doctor: doctor._id,
      patient: patientId,
      appointment: appointmentId || null,
      prescription: prescriptionId || null,
      diagnosis,
      notes: notes || '',
      type,
      attachments: attachments || [],
      vitals: vitals || {}
    });
    
    const savedRecord = await newMedicalRecord.save();
    
    // Create notification for patient
    const notification = new Notification({
      recipient: patient.user,
      type: 'new_medical_record',
      title: 'New Medical Record',
      message: 'A new entry has been added to your medical records',
      relatedId: savedRecord._id
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Medical record created successfully',
      medicalRecord: savedRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update medical record (doctors only)
router.put('/:id', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    const { 
      diagnosis, 
      notes,
      attachments,
      vitals
    } = req.body;
    
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Check if doctor is authorized to update this record
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor || medicalRecord.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this medical record' });
    }
    
    // Update fields
    if (diagnosis) medicalRecord.diagnosis = diagnosis;
    if (notes) medicalRecord.notes = notes;
    if (attachments) medicalRecord.attachments = attachments;
    if (vitals) medicalRecord.vitals = vitals;
    
    await medicalRecord.save();
    
    res.json({
      message: 'Medical record updated successfully',
      medicalRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload attachment to medical record
router.post('/:id/attachments', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    // Note: Actual file upload handling would depend on your storage solution
    // This is a simplified version that assumes the file is already uploaded and
    // we're just adding its URL and metadata to the medical record
    
    const { fileUrl, fileType, fileName } = req.body;
    
    if (!fileUrl || !fileType || !fileName) {
      return res.status(400).json({ message: 'File URL, type, and name are required' });
    }
    
    const medicalRecord = await MedicalRecord.findById(req.params.id);
    
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Check if doctor is authorized to update this record
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor || medicalRecord.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this medical record' });
    }
    
    // Add attachment
    medicalRecord.attachments.push({
      url: fileUrl,
      type: fileType,
      name: fileName,
      uploadedBy: req.user.id,
      uploadedAt: Date.now()
    });
    
    await medicalRecord.save();
    
    res.json({
      message: 'Attachment added successfully',
      medicalRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;