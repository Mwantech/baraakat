// routes/doctors.js - Doctor-related routes
const express = require('express');
const router = express.Router();
const { User, Doctor, Appointment } = require('../models/Doctors');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all doctors (public route)
router.get('/', async (req, res) => {
  try {
    const { specialization, department } = req.query;
    
    // Build filter object
    const filter = {};
    if (specialization) filter.specialization = specialization;
    if (department) filter.department = department;
    
    const doctors = await Doctor.find(filter)
      .populate('user', 'firstName lastName email phone');
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor by ID (public route)
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.params.id })
      .populate('user', 'firstName lastName email phone createdAt');
      
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor profile (doctor only)
router.put('/:id', auth, roleCheck(['doctor', 'admin']), async (req, res) => {
  try {
    // Only allow updating own profile or if admin
    if (req.user.role === 'doctor' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this doctor profile' });
    }
    
    const { specialization, qualification, department, experience, fees, availability } = req.body;
    
    // Find and update doctor
    const doctor = await Doctor.findOne({ user: req.params.id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Update fields
    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (department) doctor.department = department;
    if (experience) doctor.experience = experience;
    if (fees) doctor.fees = fees;
    if (availability) doctor.availability = availability;
    
    await doctor.save();
    
    // Update user information if provided
    if (req.body.firstName || req.body.lastName || req.body.phone) {
      const user = await User.findById(req.params.id);
      
      if (req.body.firstName) user.firstName = req.body.firstName;
      if (req.body.lastName) user.lastName = req.body.lastName;
      if (req.body.phone) user.phone = req.body.phone;
      
      await user.save();
    }
    
    res.json({ message: 'Doctor profile updated successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor's appointments
router.get('/:id/appointments', auth, async (req, res) => {
  try {
    // Only allow access to own appointments or if admin
    if (req.user.role === 'doctor' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to access these appointments' });
    }
    
    const { date, status } = req.query;
    
    // Build filter object
    const filter = { doctor: req.params.id };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    if (status) filter.status = status;
    
    const appointments = await Appointment.find(filter)
      .populate('patient', 'user')
      .populate('patient.user', 'firstName lastName')
      .sort({ appointmentDate: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor availability
router.put('/:id/availability', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    // Only allow updating own availability
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this doctor\'s availability' });
    }
    
    const { availability } = req.body;
    
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: 'Valid availability schedule is required' });
    }
    
    // Find and update doctor
    const doctor = await Doctor.findOne({ user: req.params.id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    doctor.availability = availability;
    await doctor.save();
    
    res.json({ message: 'Availability updated successfully', availability: doctor.availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;