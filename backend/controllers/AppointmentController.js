// controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new appointment (Patient)
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      scheduledDate,
      startTime,
      endTime,
      appointmentType,
      reason,
      notes,
      symptoms,
      isVirtual
    } = req.body;

    // Check if the doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found or inactive' });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: req.user.id,
      doctor: doctorId,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      appointmentType,
      reason,
      notes,
      symptoms: symptoms || [],
      isVirtual,
      meetingLink: isVirtual ? `https://meet.healthapp.com/${Date.now()}` : null,
      reminders: [
        { type: new Date(new Date(scheduledDate).setHours(new Date(scheduledDate).getHours() - 24)), sent: false },
        { type: new Date(new Date(scheduledDate).setHours(new Date(scheduledDate).getHours() - 1)), sent: false }
      ]
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get all appointments for the logged-in patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'firstName lastName email phone')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get all appointments for the logged-in doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'firstName lastName email phone')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get a single appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify that the user requesting is either the patient, doctor, or admin
    if (
      req.user.role !== 'admin' &&
      req.user.id !== appointment.patient._id.toString() &&
      req.user.id !== appointment.doctor._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization - doctors can update to any status, patients can only cancel
    if (req.user.role === 'patient' && 
        req.user.id === appointment.patient.toString() && 
        status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Patients can only cancel appointments'
      });
    }
    
    // Doctors can only update their own appointments
    if (req.user.role === 'doctor' && 
        req.user.id !== appointment.doctor.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update appointment payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const allowedStatuses = ['pending', 'completed', 'refunded', 'free'];
    
    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Payment status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Only patient who owns the appointment or admin can update payment
    if (req.user.role === 'patient' && 
        req.user.id !== appointment.patient.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    appointment.paymentStatus = paymentStatus;
    if (paymentId) {
      appointment.paymentId = paymentId;
    }
    
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Add or update notes to an appointment
exports.updateAppointmentNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Only the doctor assigned to the appointment can add notes
    if (req.user.role === 'doctor' && 
        req.user.id !== appointment.doctor.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update notes for this appointment'
      });
    }

    appointment.notes = notes;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment notes:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get upcoming appointments for a doctor or patient
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const now = new Date();
    let query = { 
      scheduledDate: { $gte: now },
      status: { $in: ['scheduled', 'confirmed'] }
    };

    // Add user role-specific filtering
    if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    } else if (req.user.role === 'patient') {
      query.patient = req.user.id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};