const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');

// Dashboard data: get doctors and totals
router.get('/dashboard', adminController.getDashboardData);

// Approve a doctor
router.put('/doctors/:doctorId/approve', adminController.approveDoctor);

// Get detailed doctor info
router.get('/doctors/:doctorId', adminController.getDoctorById);

// Delete a doctor
router.delete('/doctors/:doctorId', adminController.deleteDoctor);

// Add a new admin
router.post('/add', adminController.addAdmin);

// List all admins
router.get('/admins', adminController.getAllAdmins);

// Get an admin's details
router.get('/admins/:adminId', adminController.getAdminById);

// Update an admin
router.put('/admins/:adminId', adminController.updateAdmin);

// Delete an admin
router.delete('/admins/:adminId', adminController.deleteAdmin);

module.exports = router;
