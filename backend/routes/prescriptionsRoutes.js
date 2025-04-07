// routes/prescriptionRoutes.js
const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/PrescriptionController');
const authMiddleware = require('../middleware/auth');

// Since your middleware exports a single function, we'll use it directly
// This will verify the token and set req.userId and req.userRole

// Routes that require authentication
router.use(authMiddleware);

// Now we need to create an authorize function inline since it's not in your middleware
const authorize = (role) => {
  return (req, res, next) => {
    if (req.userRole !== role) {
      return res.status(403).json({ 
        message: `User role ${req.userRole} is not authorized to access this route`
      });
    }
    next();
  };
};

// For multiple roles (like doctor or admin)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: `User role ${req.userRole} is not authorized to access this route`
      });
    }
    next();
  };
};

// Routes for both patients and doctors
router.get('/:id', prescriptionController.getPrescription);
router.get('/:id/download', authMiddleware, prescriptionController.generatePrescriptionPDF);

// Patient specific routes
router.get('/patient/list', authorize('patient'), prescriptionController.getPatientPrescriptions);
router.post('/:id/refill', authorize('patient'), prescriptionController.requestRefill);

// Doctor specific routes
router.post('/', authorize('doctor'), prescriptionController.createPrescription);
router.get('/doctor/list', authorize('doctor'), prescriptionController.getDoctorPrescriptions);
router.put('/:id', authorize('doctor'), prescriptionController.updatePrescription);
router.delete('/:id', authorizeRoles('doctor', 'admin'), prescriptionController.deletePrescription);
router.post('/refill/process', authorize('doctor'), prescriptionController.processRefillRequest);

module.exports = router;