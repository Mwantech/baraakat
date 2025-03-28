const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/DoctorProfileController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get doctor profile (public route)
router.get('/', doctorController.getDoctorProfile);

// Protected routes for authenticated doctors
router.put('/', 
  auth, 
  roleCheck(['doctor']), 
  doctorController.updateDoctorProfile
);

router.patch('/availability', 
  auth, 
  roleCheck(['doctor']), 
  doctorController.updateDoctorAvailability
);

module.exports = router;