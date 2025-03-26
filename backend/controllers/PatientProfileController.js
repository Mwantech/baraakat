const Patient = require('../models/Patient');
const User = require('../models/User');

// Get patient profile
exports.getPatientProfile = async (req, res) => {
  try {
    // Find patient by user ID and populate user details
    const patient = await Patient.findOne({ user: req.user.id })
      .populate('user', '-password');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching patient profile' });
  }
};

// Update patient profile
exports.updatePatientProfile = async (req, res) => {
  try {
    const { 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      address, 
      emergencyContact, 
      allergies, 
      medicalHistory, 
      insurance 
    } = req.body;

    // Find and update patient profile
    const patient = await Patient.findOneAndUpdate(
      { user: req.user.id },
      { 
        dateOfBirth, 
        gender, 
        bloodGroup, 
        address, 
        emergencyContact, 
        allergies, 
        medicalHistory, 
        insurance 
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating patient profile' });
  }
};

// Add or update medical history
exports.addMedicalHistory = async (req, res) => {
  try {
    const { condition, diagnosedDate, notes } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { user: req.user.id },
      { $push: { medicalHistory: { condition, diagnosedDate, notes } } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json(patient.medicalHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while adding medical history' });
  }
};