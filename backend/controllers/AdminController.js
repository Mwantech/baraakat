// controllers/adminController.js

const Doctor = require('../models/Doctors');
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * GET /admin/dashboard
 * Fetch all doctors along with totals for doctors, patients, and users.
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Fetch all doctors and populate the associated user info
    const doctors = await Doctor.find().populate('user');

    // Count totals in respective collections
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      totalDoctors,
      totalPatients,
      totalUsers,
      doctors
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /admin/doctors/:doctorId/approve
 * Approve a doctor by setting the isVerified field to true.
 */
exports.approveDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).json({ message: 'Doctor approved successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /admin/doctors/:doctorId
 * Get detailed information about a specific doctor.
 */
exports.getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findById(doctorId).populate('user');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /admin/doctors/:doctorId
 * Delete a doctor from the database.
 */
exports.deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findByIdAndDelete(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /admin/add
 * Add a new admin user.
 */
exports.addAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Create a new admin user
    const newAdmin = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'admin'
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin added successfully', admin: newAdmin });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /admin/admins
 * List all admin users.
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' });
    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /admin/admins/:adminId
 * Get detailed information about a specific admin.
 */
exports.getAdminById = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await User.findOne({ _id: adminId, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /admin/admins/:adminId
 * Update an existing admin's details.
 */
exports.updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const { email, firstName, lastName, phone, password } = req.body;

    // Find admin by ID and ensure the user is an admin
    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Update fields if provided
    if (email) admin.email = email;
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (password) admin.password = password; // pre-save hook will hash the password
    
    await admin.save();

    res.status(200).json({ message: 'Admin updated successfully', admin });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /admin/admins/:adminId
 * Delete an admin from the database.
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await User.findOneAndDelete({ _id: adminId, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
