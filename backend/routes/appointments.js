// routes/appointments.js - Appointment scheduling routes
const express = require('express');
const router = express.Router();
const { Appointment, Doctor, Patient, User, Notification } = require('../models/Appointment');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all appointments (admin only)
router.get('/all', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { status, date, doctorId, patientId } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (doctorId) filter.doctor = doctorId;
    if (patientId) filter.patient = patientId;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user appointments (based on role)
router.get('/', auth, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Add role-specific filters
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      filter.doctor = doctor._id;
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      filter.patient = patient._id;
    }
    
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to view this appointment
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this appointment' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this appointment' });
      }
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, appointmentDate, reason, type } = req.body;
    
    // Validate required fields
    if (!doctorId || !appointmentDate || !reason || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Get patient ID
    let patientId;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      patientId = patient._id;
    } else if (req.body.patientId && (req.user.role === 'admin' || req.user.role === 'doctor')) {
      patientId = req.body.patientId;
    } else {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if appointment slot is available
    const appointmentDateTime = new Date(appointmentDate);
    
    // Check if the appointment falls within doctor's availability
    const dayOfWeek = appointmentDateTime.getDay();
    const hours = appointmentDateTime.getHours();
    const minutes = appointmentDateTime.getMinutes();
    
    const isAvailable = doctor.availability.some(slot => {
      return (
        slot.day === dayOfWeek &&
        hours >= slot.startHour &&
        (hours < slot.endHour || (hours === slot.endHour && minutes === 0))
      );
    });
    
    if (!isAvailable) {
      return res.status(400).json({ message: 'Doctor is not available at the selected time' });
    }
    
    // Check if there's already an appointment at this time
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDateTime.getTime() - 30 * 60000), // 30 minutes before
        $lte: new Date(appointmentDateTime.getTime() + 30 * 60000)  // 30 minutes after
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }
    
    // Create appointment
    const newAppointment = new Appointment({
      doctor: doctorId,
      patient: patientId,
      appointmentDate,
      reason,
      type,
      status: 'pending'
    });
    
    await newAppointment.save();
    
    // Create notification for doctor
    const doctorUser = await User.findById(doctor.user);
    
    const notification = new Notification({
      recipient: doctor.user,
      type: 'new_appointment',
      title: 'New Appointment Request',
      message: `You have a new appointment request on ${new Date(appointmentDate).toLocaleDateString()}`,
      relatedId: newAppointment._id
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Appointment scheduled successfully',
      appointment: newAppointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    // Validate status
    if (!['pending', 'confirmed', 'completed', 'cancelled', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to update this appointment
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this appointment' });
      }
      
      // Patients can only cancel their appointments
      if (status !== 'cancelled') {
        return res.status(400).json({ message: 'Patients can only cancel appointments' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      
      if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this appointment' });
      }
      
      // Doctors cannot set status to cancelled (only patients can cancel)
      if (status === 'cancelled') {
        return res.status(400).json({ message: 'Doctors cannot cancel appointments' });
      }
    }
    
    // Update appointment
    appointment.status = status;
    if (remarks) appointment.remarks = remarks;
    
    await appointment.save();
    
    // Create notification for the other party
    let recipientId;
    let title;
    let message;
    
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(appointment.patient);
      recipientId = patient.user;
      
      if (status === 'confirmed') {
        title = 'Appointment Confirmed';
        message = `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been confirmed`;
      } else if (status === 'rejected') {
        title = 'Appointment Rejected';
        message = `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} was rejected`;
      } else if (status === 'completed') {
        title = 'Appointment Completed';
        message = `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been marked as completed`;
      }
    } else if (req.user.role === 'patient') {
      const doctor = await Doctor.findById(appointment.doctor);
      recipientId = doctor.user;
      
      if (status === 'cancelled') {
        title = 'Appointment Cancelled';
        message = `The appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been cancelled by the patient`;
      }
    }
    
    if (recipientId && title && message) {
      const notification = new Notification({
        recipient: recipientId,
        type: `appointment_${status}`,
        title,
        message,
        relatedId: appointment._id
      });
      
      await notification.save();
    }
    
    res.json({
      message: `Appointment ${status} successfully`,
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reschedule appointment
router.put('/:id/reschedule', auth, async (req, res) => {
  try {
    const { appointmentDate } = req.body;
    
    if (!appointmentDate) {
      return res.status(400).json({ message: 'New appointment date is required' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to reschedule this appointment
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
      }
      
      // Patients can only reschedule pending or confirmed appointments
      if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
        return res.status(400).json({ message: 'Only pending or confirmed appointments can be rescheduled' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      
      if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
      }
    }
    
    // Check if the new time is available
    const newAppointmentDateTime = new Date(appointmentDate);
    
    // Check if the appointment falls within doctor's availability
    const doctor = await Doctor.findById(appointment.doctor);
    const dayOfWeek = newAppointmentDateTime.getDay();
    const hours = newAppointmentDateTime.getHours();
    const minutes = newAppointmentDateTime.getMinutes();
    
    const isAvailable = doctor.availability.some(slot => {
      return (
        slot.day === dayOfWeek &&
        hours >= slot.startHour &&
        (hours < slot.endHour || (hours === slot.endHour && minutes === 0))
      );
    });
    
    if (!isAvailable) {
      return res.status(400).json({ message: 'Doctor is not available at the selected time' });
    }
    
    // Check if there's already an appointment at this time
    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: req.params.id }, // Exclude current appointment
      doctor: appointment.doctor,
      appointmentDate: {
        $gte: new Date(newAppointmentDateTime.getTime() - 30 * 60000), // 30 minutes before
        $lte: new Date(newAppointmentDateTime.getTime() + 30 * 60000)  // 30 minutes after
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }
    
    // Update appointment
    appointment.appointmentDate = appointmentDate;
    appointment.status = 'pending'; // Reset status to pending when rescheduled
    appointment.rescheduled = true;
    
    await appointment.save();
    
    // Create notification for the other party
    let recipientId;
    
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(appointment.patient);
      recipientId = patient.user;
    } else if (req.user.role === 'patient') {
      recipientId = doctor.user;
    }
    
    if (recipientId) {
      const notification = new Notification({
        recipient: recipientId,
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `The appointment has been rescheduled to ${new Date(appointmentDate).toLocaleDateString()} at ${new Date(appointmentDate).toLocaleTimeString()}`,
        relatedId: appointment._id
      });
      
      await notification.save();
    }
    
    res.json({
      message: 'Appointment rescheduled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;