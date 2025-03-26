const express = require('express');
const router = express.Router();
const patientController = require('../controllers/PatientProfileController');
const doctorController = require('../controllers/DoctorProfileController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get patient profile
router.get('/patients-profile', 
  auth, 
  roleCheck(['patient']), 
  patientController.getPatientProfile
);

// Update patient profile
router.put('/patients-profile', 
  auth, 
  roleCheck(['patient']), 
  patientController.updatePatientProfile
);

// Add medical history
router.post('/medical-history', 
  auth, 
  roleCheck(['patient']), 
  patientController.addMedicalHistory
);

// Get doctor profile
router.get('/doctors-profile', 
    auth, 
    roleCheck(['doctor']), 
    doctorController.getDoctorProfile
  );
  
  // Update doctor profile
  router.put('/doctors-profile', 
    auth, 
    roleCheck(['doctor']), 
    doctorController.updateDoctorProfile
  );
  
  // Update doctor availability
  router.patch('/availability', 
    auth, 
    roleCheck(['doctor']), 
    doctorController.updateDoctorAvailability
  );

module.exports = router;