// routes/admin.js - Admin panel routes
const express = require('express');
const router = express.Router();
const { User, Patient, Doctor, Admin, Appointment, MedicalRecord } = require('../models/Admin');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const bcrypt = require('bcrypt');

// Admin routes are protected
router.use(auth, roleCheck(['admin']));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const stats = {
      totalPatients: await Patient.countDocuments(),
      totalDoctors: await Doctor.countDocuments(),
      totalAppointments: await Appointment.countDocuments(),
      pendingAppointments: await Appointment.countDocuments({ status: 'pending' }),
      completedAppointments: await Appointment.countDocuments({ status: 'completed' }),
      recentUsers: await User.find().sort({ createdAt: -1 }).limit(5),
      appointmentsToday: await Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new admin user
    const newUser = new User({
      email,
      password,
      role: 'admin',
      firstName,
      lastName,
      phone
    });
    
    const savedUser = await newUser.save();
    
    // Create admin profile
    const newAdmin = new Admin({
      user: savedUser._id,
      permissions: req.body.permissions || ['users', 'doctors', 'patients', 'appointments']
    });
    
    await newAdmin.save();
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = status;
    await user.save();
    
    res.json({ message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset user password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-8);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(randomPassword, salt);
    
    await user.save();
    
    res.json({ 
      message: 'Password reset successfully', 
      newPassword: randomPassword 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get department statistics
router.get('/departments', async (req, res) => {
  try {
    const departments = await Doctor.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const appointmentsByDepartment = await Doctor.aggregate([
      { $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'doctor',
          as: 'appointments'
      }},
      { $unwind: '$appointments' },
      { $group: {
          _id: '$department',
          appointmentCount: { $sum: 1 }
      }},
      { $sort: { appointmentCount: -1 } }
    ]);
    
    res.json({
      departments,
      appointmentsByDepartment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;