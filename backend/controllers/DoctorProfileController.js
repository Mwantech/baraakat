const Doctor = require('../models/Doctors');
const User = require('../models/User');

// Get doctor profile
exports.getDoctorProfile = async (req, res) => {
  try {
    // Find doctor by user ID and populate user details
    const doctor = await Doctor.findOne({ user: req.user.id })
      .populate('user', '-password');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching doctor profile' });
  }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { 
      specialization, 
      qualification, 
      licenseNumber, 
      experience, 
      department, 
      availableTime, 
      fees, 
      bio,
      profilePicture,
      isAvailable
    } = req.body;

    // Find and update doctor profile
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { 
        specialization, 
        qualification, 
        licenseNumber, 
        experience, 
        department, 
        availableTime, 
        fees, 
        bio,
        profilePicture,
        isAvailable
      },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating doctor profile' });
  }
};

// Update doctor availability
exports.updateDoctorAvailability = async (req, res) => {
  try {
    const { availableTime, isAvailable } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { availableTime, isAvailable },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ availableTime: doctor.availableTime, isAvailable: doctor.isAvailable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating doctor availability' });
  }
};