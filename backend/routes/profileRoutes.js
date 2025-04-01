// routes/profile.js
const express = require('express');
const router = express.Router();
const { ProfileController } = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Patient routes
router.get('/patient', ProfileController.getPatientProfile);
router.put('/patient', ProfileController.updatePatientProfile);

// Doctor routes
router.get('/doctor', ProfileController.getDoctorProfile);
router.put('/doctor', ProfileController.updateDoctorProfile);

// Admin routes
router.get('/admin', ProfileController.getAdminProfile);
router.put('/admin', ProfileController.updateAdminProfile);

// Common routes
router.post('/change-password', ProfileController.changePassword);

module.exports = router;