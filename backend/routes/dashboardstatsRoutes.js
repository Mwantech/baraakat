// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/auth');

// Patient dashboard stats
router.get('/patient', authMiddleware, dashboardController.getPatientDashboardStats);

// Doctor dashboard stats
router.get('/doctor', authMiddleware, dashboardController.getDoctorDashboardStats);

// Admin dashboard stats
router.get('/admin', authMiddleware, dashboardController.getAdminDashboardStats);

// Admin detailed reports
router.get('/admin/reports', authMiddleware, dashboardController.getAdminReports);

module.exports = router;