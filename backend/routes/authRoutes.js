// routes/auth.js
const express = require('express');
const router = express.Router();
const { AuthController } = require('../controllers/AuthController');
const doctorController = require('../controllers/DoctorController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register/patient', AuthController.registerPatient);
router.post('/register/doctor', AuthController.registerDoctor);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.post('/register/admin', authMiddleware, AuthController.registerAdmin);
router.get('/refresh-token', authMiddleware, AuthController.refreshToken);

// Route to fetch all doctors
router.get('/doctors/', doctorController.getDoctors);

// Route to fetch a single doctor by ID
router.get('/doctors/:doctorId', doctorController.getDoctorById);

module.exports = router;
