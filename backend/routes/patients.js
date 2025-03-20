// routes/patients.js - Patient-related routes
const express = require('express');
const router = express.Router();
const { User, Patient, Appointment, MedicalRecord, Prescription } = require('../models/Patient');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all patients (admin and doctors only)
router.get('/', auth, roleCheck(['admin', 'doctor']), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('user', 'firstName lastName email phone createdAt');
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Only allow access to own profile or if admin/doctor
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to access this patient profile' });
    }
    
    const patient = await Patient.findOne({ user: req.params.id })
      .populate('user', 'firstName lastName email phone createdAt');
      
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update patient profile
router.put('/:id', auth, async (req, res) => {
  try {
    // Only allow updating own profile or if admin
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this patient profile' });
    }
    
    const { dateOfBirth, gender, bloodGroup, address, emergencyContact } = req.body;
    
    // Find and update patient
    const patient = await Patient.findOne({ user: req.params.id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Update fields
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (address) patient.address = address;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    
    await patient.save();
    
    // Update user information if provided
    if (req.body.firstName || req.body.lastName || req.body.phone) {
      const user = await User.findById(req.params.id);
      
      if (req.body.firstName) user.firstName = req.body.firstName;
      if (req.body.lastName) user.lastName = req.body.lastName;
      if (req.body.phone) user.phone = req.body.phone;
      
      await user.save();
    }
    
    res.json({ message: 'Patient profile updated successfully', patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient appointments
router.get('/:id/appointments', auth, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to access these appointments' });
    }
    
    const appointments = await Appointment.find({ patient: req.params.id })
      .populate('doctor', 'user')
      .populate('doctor.user', 'firstName lastName')
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient medical records
router.get('/:id/medical-records', auth, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to access these medical records' });
    }
    
    const medicalRecords = await MedicalRecord.find({ patient: req.params.id })
      .populate('doctor', 'user')
      .populate('doctor.user', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient prescriptions
router.get('/:id/prescriptions', auth, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to access these prescriptions' });
    }
    
    const prescriptions = await Prescription.find({ patient: req.params.id })
      .populate('doctor', 'user')
      .populate('doctor.user', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;