// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/PatientController');

// Get all patients
router.get('/', patientController.getAllPatients);

// Get single patient by ID
router.get('/:id', patientController.getPatientById);

// Get patient by user ID
router.get('/user/:userId', patientController.getPatientByUserId);

// Get patients with specific medical condition
router.get('/condition/:condition', patientController.getPatientsByCondition);

module.exports = router;