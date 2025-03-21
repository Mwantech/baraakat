// routes/appointments.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Create a new appointment - Patient only
router.post(
  '/',
  auth,
  roleCheck(['patient']),
  appointmentController.createAppointment
);

// Get all appointments for logged-in patient
router.get(
  '/patient',
  auth,
  roleCheck(['patient']),
  appointmentController.getPatientAppointments
);

// Get all appointments for logged-in doctor
router.get(
  '/doctor',
  auth,
  roleCheck(['doctor']),
  appointmentController.getDoctorAppointments
);

// Get a single appointment by ID
router.get(
  '/:id',
  auth,
  roleCheck(['patient', 'doctor', 'admin']),
  appointmentController.getAppointmentById
);

// Update appointment status
router.patch(
  '/:id/status',
  auth,
  roleCheck(['patient', 'doctor', 'admin']),
  appointmentController.updateAppointmentStatus
);

// Update appointment payment status
router.patch(
  '/:id/payment',
  auth,
  roleCheck(['patient', 'admin']),
  appointmentController.updatePaymentStatus
);

// Update appointment notes
router.patch(
  '/:id/notes',
  auth,
  roleCheck(['doctor']),
  appointmentController.updateAppointmentNotes
);

// Get upcoming appointments
router.get(
  '/upcoming',
  auth,
  roleCheck(['patient', 'doctor']),
  appointmentController.getUpcomingAppointments
);

module.exports = router;