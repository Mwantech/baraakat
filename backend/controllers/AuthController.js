// AuthController.js
const User = require('../models/User');
const Doctor = require('../models/Doctors');
const Patient = require('../models/Patient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
  // PATIENT REGISTRATION
  static async registerPatient(req, res) {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        phone,
        // Patient specific fields
        dateOfBirth,
        gender,
        address,
        bloodGroup,
        allergies,
        medicalHistory
      } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Create base user with patient role
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: 'patient',
        phone
      });
      
      await user.save();
      
      // Create patient profile linked to user
      const patient = new Patient({
        user: user._id,
        dateOfBirth,
        gender,
        address,
        bloodGroup,
        allergies: allergies || [],
        medicalHistory: medicalHistory || []
      });
      
      await patient.save();
      
      // Create token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.status(201).json({
        message: 'Patient registered successfully',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName, 
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // DOCTOR REGISTRATION
  static async registerDoctor(req, res) {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        phone,
        // Doctor specific fields
        specialization,
        qualification,
        licenseNumber,
        experience,
        department,
        availableTime,
        fees,
        bio
      } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Check if license number is already registered
      const existingDoctor = await Doctor.findOne({ licenseNumber });
      if (existingDoctor) {
        return res.status(400).json({ message: 'License number already registered' });
      }
      
      // Create base user with doctor role
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: 'doctor',
        phone
      });
      
      await user.save();
      
      // Create doctor profile linked to user
      const doctor = new Doctor({
        user: user._id,
        specialization,
        qualification: qualification || [],
        licenseNumber,
        experience: experience || 0,
        department,
        availableTime: availableTime || [],
        fees,
        bio: bio || '',
        isAvailable: true
      });
      
      await doctor.save();
      
      // Create token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.status(201).json({
        message: 'Doctor registered successfully',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName, 
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // ADMIN REGISTRATION (restricted to super admin)
  static async registerAdmin(req, res) {
    try {
      // Only super admins can create other admins
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const { email, password, firstName, lastName, phone } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Create admin user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: 'admin',
        phone
      });
      
      await user.save();
      
      return res.status(201).json({
        message: 'Admin registered successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName, 
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // UNIFIED LOGIN FOR ALL USER TYPES
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Update last login
      user.lastLogin = Date.now();
      await user.save();
      
      // Create token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // PASSWORD RESET FLOW
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      
      // Set token expiration (1 hour)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
      
      // In a real app, you would send an email with the reset link
      // For now, just return the token
      return res.json({ 
        message: 'Password reset token generated',
        resetToken
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, token, newPassword } = req.body;
      
      // Find user by email and token
      const user = await User.findOne({ 
        email,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      // Update password and clear reset token
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.json({ message: 'Password reset successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // TOKEN REFRESH
  static async refreshToken(req, res) {
    try {
      // Create new token
      const token = jwt.sign(
        { id: req.userId, role: req.userRole },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return res.json({
        message: 'Token refreshed successfully',
        token
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

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
      const { 
        firstName, 
        lastName, 
        phone,
        dateOfBirth,
        gender,
        address,
        bloodGroup,
        allergies,
        medicalHistory
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
          medicalHistory
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
      return res.status(500).json({ message: 'Server error', error: error.message });
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
  AuthController,
  ProfileController,
  AdminController
};