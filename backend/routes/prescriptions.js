// routes/prescriptions.js - Prescription management
const express = require('express');
const router = express.Router();
const { Prescription, Patient, Doctor, User, Notification, MedicalRecord } = require('../models/Prescription');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all prescriptions (admin only)
router.get('/all', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
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
      .sort({ createdAt: -1 });
    
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user prescriptions (based on role)
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
    
    const prescriptions = await Prescription.find(filter)
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
      .sort({ createdAt: -1 });
    
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get prescription by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
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
      .populate('appointment');
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if user is authorized to view this prescription
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || prescription.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this prescription' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || prescription.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this prescription' });
      }
    }
    
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new prescription (doctors only)
router.post('/', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    const { 
      patientId, 
      appointmentId, 
      diagnosis, 
      medications, 
      instructions, 
      followUp
    } = req.body;
    
    // Validate required fields
    if (!patientId || !diagnosis || !medications || !instructions) {
      return res.status(400).json({ message: 'Patient ID, diagnosis, medications, and instructions are required' });
    }
    
    // Get doctor ID
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create prescription
    const newPrescription = new Prescription({
      doctor: doctor._id,
      patient: patientId,
      appointment: appointmentId || null,
      diagnosis,
      medications,
      instructions,
      followUp: followUp || null,
      status: 'active'
    });
    
    const savedPrescription = await newPrescription.save();
    
    // If there's an appointment, create medical record
    if (appointmentId) {
      const newMedicalRecord = new MedicalRecord({
        patient: patientId,
        doctor: doctor._id,
        appointment: appointmentId,
        prescription: savedPrescription._id,
        diagnosis,
        notes: instructions,
        type: 'consultation'
      });
      
      await newMedicalRecord.save();
    }
    
    // Create notification for patient
    const notification = new Notification({
      recipient: patient.user,
      type: 'new_prescription',
      title: 'New Prescription',
      message: 'A new prescription has been added to your medical records',
      relatedId: savedPrescription._id
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: savedPrescription
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update prescription (doctors only)
router.put('/:id', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    const { 
      diagnosis, 
      medications, 
      instructions, 
      followUp,
      status
    } = req.body;
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if doctor is authorized to update this prescription
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor || prescription.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this prescription' });
    }
    
    // Update fields
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (medications) prescription.medications = medications;
    if (instructions) prescription.instructions = instructions;
    if (followUp) prescription.followUp = followUp;
    if (status) prescription.status = status;
    
    await prescription.save();
    
    // Create notification for patient
    const notification = new Notification({
      recipient: (await Patient.findById(prescription.patient)).user,
      type: 'prescription_updated',
      title: 'Prescription Updated',
      message: 'Your prescription has been updated',
      relatedId: prescription._id
    });
    
    await notification.save();
    
    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark prescription as filled/completed (patients only)
router.put('/:id/status', auth, roleCheck(['patient']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status !== 'active' && status !== 'filled' && status !== 'completed') {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if patient is authorized to update this prescription
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient || prescription.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this prescription' });
    }
    
    prescription.status = status;
    await prescription.save();
    
    res.json({
      message: `Prescription marked as ${status}`,
      prescription
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;