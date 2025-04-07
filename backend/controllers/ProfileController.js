const User = require('../models/User');
const Doctor = require('../models/Doctors');
const Patient = require('../models/Patient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// ProfileController.js
class ProfileController {
  // PATIENT PROFILE MANAGEMENT
  static async getPatientProfile(req, res) {
    try {
      // Find user and associated patient profile
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role !== 'patient') {
        return res.status(400).json({ message: 'Not a patient profile' });
      }
      
      const patient = await Patient.findOne({ user: req.userId });
      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      return res.json({
        user,
        patient
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updatePatientProfile(req, res) {
    try {
      // Only extract fields that Patient model would need
      const {
        dateOfBirth,
        gender,
        address,
        bloodGroup,
        allergies,
        medicalHistory,
        emergencyContact
      } = req.body;
      
      // First check if the user exists and is a patient
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role !== 'patient') {
        return res.status(400).json({ message: 'Not a patient profile' });
      }
      
      // Update patient profile
      const patient = await Patient.findOneAndUpdate(
        { user: req.userId },
        {
          dateOfBirth,
          gender,
          address,
          bloodGroup,
          allergies,
          medicalHistory,
          emergencyContact
        },
        { new: true }
      );
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      return res.json({
        message: 'Patient profile updated successfully',
        user,
        patient
      });
    } catch (error) {
      console.error('Error updating patient profile:', error);
      return res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
  
  // DOCTOR PROFILE MANAGEMENT
  static async getDoctorProfile(req, res) {
    try {
      // Find user and associated doctor profile
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role !== 'doctor') {
        return res.status(400).json({ message: 'Not a doctor profile' });
      }
      
      const doctor = await Doctor.findOne({ user: req.userId });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      
      return res.json({
        user,
        doctor
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateDoctorProfile(req, res) {
    try {
      const { 
        firstName, 
        lastName, 
        phone,
        specialization,
        qualification,
        experience,
        department,
        availableTime,
        fees,
        bio,
        isAvailable
      } = req.body;
      
      // Update base user info
      const user = await User.findByIdAndUpdate(
        req.userId,
        { firstName, lastName, phone },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role !== 'doctor') {
        return res.status(400).json({ message: 'Not a doctor profile' });
      }
      
      // Update doctor profile
      const doctor = await Doctor.findOneAndUpdate(
        { user: req.userId },
        {
          specialization,
          qualification,
          experience,
          department,
          availableTime,
          fees,
          bio,
          isAvailable
        },
        { new: true }
      );
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      
      return res.json({
        message: 'Doctor profile updated successfully',
        user,
        doctor
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // ADMIN PROFILE MANAGEMENT
  static async getAdminProfile(req, res) {
    try {
      // Only allow admin access
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async updateAdminProfile(req, res) {
    try {
      // Only allow admin access
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { firstName, lastName, phone } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.userId,
        { firstName, lastName, phone },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json({
        message: 'Admin profile updated successfully',
        user
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // COMMON PROFILE FUNCTIONS
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      return res.json({ message: 'Password changed successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

// AdminController.js
class AdminController {
  // USER MANAGEMENT
  static async getAllUsers(req, res) {
    try {
      // Only allow admins to access all users
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const users = await User.find().select('-password');
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      // Only allow admins or the user themselves to access user details
      if (req.userRole !== 'admin' && req.userId !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get role-specific profile
      let profileData = null;
      
      if (user.role === 'doctor') {
        profileData = await Doctor.findOne({ user: user._id });
      } else if (user.role === 'patient') {
        profileData = await Patient.findOne({ user: user._id });
      }
      
      return res.json({
        user,
        profile: profileData
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async toggleUserStatus(req, res) {
    try {
      // Only allow admins to toggle user status
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Toggle status
      user.isActive = !user.isActive;
      await user.save();
      
      return res.json({
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // DOCTOR SPECIFIC MANAGEMENT
  static async getAllDoctors(req, res) {
    try {
      const doctors = await Doctor.find().populate('user', '-password');
      return res.json(doctors);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async approveDoctorRegistration(req, res) {
    try {
      // Only allow admins
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { doctorId, isApproved } = req.body;
      
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      // Update doctor verification status
      doctor.isVerified = isApproved;
      await doctor.save();
      
      // If approved, activate the user account
      if (isApproved) {
        await User.findByIdAndUpdate(doctor.user, { isActive: true });
      }
      
      return res.json({
        message: `Doctor ${isApproved ? 'approved' : 'rejected'} successfully`,
        doctor
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // PATIENT SPECIFIC MANAGEMENT
  static async getAllPatients(req, res) {
    try {
      // Only allow admins or doctors
      if (req.userRole !== 'admin' && req.userRole !== 'doctor') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const patients = await Patient.find().populate('user', '-password');
      return res.json(patients);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}


module.exports = {
  ProfileController,
  AdminController
};