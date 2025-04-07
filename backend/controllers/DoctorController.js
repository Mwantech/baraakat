// controllers/doctorController.js

const Doctor = require('../models/Doctors');

/**
 * GET /doctors
 * Fetch all doctors and populate associated user details.
 */
exports.getDoctors = async (req, res) => {
  try {
    // Fetch all doctors and populate the 'user' field with corresponding user data.
    const doctors = await Doctor.find().populate('user');
    res.status(200).json({ doctors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /doctors/:doctorId
 * Fetch a specific doctor by ID and populate associated user details.
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


