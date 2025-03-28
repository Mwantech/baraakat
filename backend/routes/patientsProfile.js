const express = require('express');
const router = express.Router();
const patientController = require('../controllers/PatientProfileController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get patient profile (public route)
router.get('/', auth, roleCheck(['patient']),  patientController.getPatientProfile);

// Protected routes for authenticated patients
router.put('/', 
  auth, 
  roleCheck(['patient']), 
  patientController.updatePatientProfile
);

router.post('/medical-history', 
  auth, 
  roleCheck(['patient']), 
  patientController.addMedicalHistory
);

module.exports = router;