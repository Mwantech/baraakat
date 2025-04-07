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
        availableTime,  // This will be undefined if not provided
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
        availableTime,  // Just pass the value - schema will handle the default
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


module.exports = {
  AuthController
};