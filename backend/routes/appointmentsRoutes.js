const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth'); // Import the auth middleware

// Create a new appointment
// POST /api/appointments
router.post(
  '/',
  appointmentController.createAppointment
);

// Get patient's appointments
// GET /api/appointments/patient/:patientId
router.get(
  '/patient/:patientId',
  auth,
  appointmentController.getPatientAppointments
);

// Get doctor's appointments
// GET /api/appointments/doctor/:doctorId
router.get(
  '/doctor/:doctorId',
  auth,
  appointmentController.getDoctorAppointments
);


router.get('/available', auth, appointmentController.getAvailableDoctors);

router.get('/specializations', auth, appointmentController.getSpecializations);


// Get appointment by ID
// GET /api/appointments/:id
router.get(
  '/:id',
  auth,
  appointmentController.getAppointmentById
);

// Update appointment status
// PUT /api/appointments/:id
router.put(
  '/:id',
  auth,
  appointmentController.updateAppointmentStatus
);

// Cancel appointment
// PUT /api/appointments/:id/cancel
router.put(
  '/:id/cancel',
  auth,
  appointmentController.cancelAppointment
);

// Get patient's appointment history
// GET /api/appointments/history/patient/:patientId
router.get(
  '/history/patient/:patientId',
  auth,
  appointmentController.getPatientAppointmentHistory
);

router.get(
  '/dashboard/stats/:doctorId',
  auth,
  appointmentController.getDashboardStats
);


router.get(
  '/availability/:doctorId',
  auth,
  appointmentController.getAvailableSlots
);


module.exports = router;