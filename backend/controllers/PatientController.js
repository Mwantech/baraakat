// controllers/patientController.js
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * @desc Get all patients with optional filtering and pagination
 * @route GET /api/patients
 * @access Private (Admin, Doctor)
 */
const getAllPatients = async (req, res) => {
  try {
    // Parse query parameters
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt', 
      search, 
      gender, 
      bloodGroup,
      hasAllergies,
      minAge,
      maxAge
    } = req.query;

    // Build the query
    let query = {};

    // Search by patient name (through user reference)
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ],
        role: 'patient'
      }).select('_id');
      
      query.user = { $in: users.map(u => u._id) };
    }

    // Filter by gender
    if (gender) {
      query.gender = gender;
    }

    // Filter by blood group
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Filter by allergies
    if (hasAllergies === 'true') {
      query.allergies = { $exists: true, $not: { $size: 0 } };
    } else if (hasAllergies === 'false') {
      query.$or = [
        { allergies: { $exists: false } },
        { allergies: { $size: 0 } }
      ];
    }

    // Filter by age range
    if (minAge || maxAge) {
      const dateRange = {};
      if (minAge) {
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - minAge);
        dateRange.$lte = minDate;
      }
      if (maxAge) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - maxAge - 1);
        dateRange.$gt = maxDate;
      }
      query.dateOfBirth = dateRange;
    }

    // Execute query with pagination
    const patients = await Patient.find(query)
      .populate({
        path: 'user',
        select: 'firstName lastName email phone role'
      })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .sort(sort);

    // Get total count for pagination
    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      count: patients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: patients
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc Get single patient by ID
 * @route GET /api/patients/:id
 * @access Private (Admin, Doctor, Patient - only their own record)
 */
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'firstName lastName email phone role'
      });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Check if user has permission to access this patient record
    // (Admin and doctors can access all, patients can only access their own)
    if (req.user.role === 'patient' && patient.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this patient record' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc Get patient by user ID
 * @route GET /api/patients/user/:userId
 * @access Private (Admin, Doctor, Patient - only their own record)
 */
const getPatientByUserId = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.params.userId })
      .populate({
        path: 'user',
        select: 'firstName lastName email phone role'
      });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Check if user has permission to access this patient record
    if (req.user.role === 'patient' && patient.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this patient record' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc Get patients with specific medical condition
 * @route GET /api/patients/condition/:condition
 * @access Private (Admin, Doctor)
 */
const getPatientsByCondition = async (req, res) => {
  try {
    // Only allow doctors and admins to access this endpoint
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { condition } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const patients = await Patient.find({
      'medicalHistory.condition': { $regex: condition, $options: 'i' }
    })
      .populate({
        path: 'user',
        select: 'firstName lastName email phone'
      })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments({
      'medicalHistory.condition': { $regex: condition, $options: 'i' }
    });

    res.json({
      success: true,
      count: patients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: patients
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getPatientByUserId,
  getPatientsByCondition
};