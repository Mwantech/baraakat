// routes/medicalRecordsRoutes.js
const express = require('express');
const router = express.Router();
const medicalRecordsController = require('../controllers/MedicalRecordController');
const auth = require('../middleware/auth');

// Authentication middleware - all routes require authentication
router.use(auth);

// Get medical records summary for dashboard (patient or doctor)
router.get('/patient/:patientId/summary', medicalRecordsController.getPatientRecordsSummary);

// Get all medical records for a specific patient
router.get('/patient/:patientId', medicalRecordsController.getPatientRecords);

// Search through a patient's medical records
router.get('/patient/:patientId/search', medicalRecordsController.searchPatientRecords);

// Get a specific medical record by ID
router.get('/:recordId', medicalRecordsController.getRecordById);

// Create a new medical record using the generateMedicalRecord function
// This route correctly uses the exported generateMedicalRecord function
router.post('/', async (req, res) => {
  try {
    const { patientId, appointmentId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }
    
    // Generate a new medical record automatically
    const doctorId = req.doctorId || req.userId;
    const record = await medicalRecordsController.generateMedicalRecord(patientId, doctorId, appointmentId);
    
    res.status(201).json({ 
      success: true, 
      data: record, 
      message: 'Medical record created successfully' 
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating medical record' 
    });
  }
});

// Update an existing medical record (patients can only update attachments)
router.patch('/:recordId', medicalRecordsController.updateRecord);

// Soft delete a medical record (doctor/admin only)
router.delete('/:recordId', medicalRecordsController.deleteRecord);

module.exports = router;