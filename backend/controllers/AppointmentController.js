// controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctors');
const User = require('../models/User');

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, startTime, endTime, symptoms, notes } = req.body;
    
    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Validate doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    if (!doctor.isAvailable || !doctor.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor is not available for appointments' 
      });
    }
    
    // Check if the appointment time is valid for the doctor's schedule
    const appointmentDay = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const doctorSchedule = doctor.availableTime.find(time => time.day === appointmentDay);
    
    if (!doctorSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available on this day'
      });
    }
    
    // Check if the time slot is available
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { 
        $gte: new Date(new Date(appointmentDate).setHours(0, 0, 0)), 
        $lt: new Date(new Date(appointmentDate).setHours(23, 59, 59)) 
      },
      status: 'scheduled',
      startTime: startTime
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    // Create the appointment
    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      startTime,
      endTime,
      symptoms,
      notes,
      fee: doctor.fees
    });
    
    await newAppointment.save();
    
    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Appointment scheduled successfully'
    });
    
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling appointment',
      error: error.message
    });
  }
};

// Get appointments for a patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;
    
    const filter = { patient: patientId };
    
    // Filter by status if provided
    if (status) {
      filter.status = status;
    }
    
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'doctor',
        select: 'department specialization fees',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ appointmentDate: -1 });
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
    
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient appointments',
      error: error.message
    });
  }
};

// Get appointments for a doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, status } = req.query;
    
    const filter = { doctor: doctorId };
    
    // Filter by status if provided
    if (status) {
      filter.status = status;
    }
    
    // Filter by date if provided
    if (date) {
      const selectedDate = new Date(date);
      filter.appointmentDate = {
        $gte: new Date(selectedDate.setHours(0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59))
      };
    }
    
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patient',
        select: 'dateOfBirth gender bloodGroup allergies',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      })
      .sort({ appointmentDate: 1, startTime: 1 });
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
    
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor appointments',
      error: error.message
    });
  }
};

// Get appointment details
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: appointment
    });
    
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment details',
      error: error.message
    });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, diagnosis, prescription } = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Update fields
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (prescription) appointment.prescription = prescription;
    
    // If status is completed, add the completed time
    if (status === 'completed') {
      appointment.completedAt = new Date();
    }
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment can be cancelled (not completed or already cancelled)
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed appointments cannot be cancelled'
      });
    }
    
    appointment.status = 'cancelled';
    appointment.notes = appointment.notes ? 
      `${appointment.notes}\n\nCancellation reason: ${cancellationReason}` : 
      `Cancellation reason: ${cancellationReason}`;
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
};

// Get appointment history for a patient
exports.getPatientAppointmentHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const history = await Appointment.find({
      patient: patientId,
      status: { $in: ['completed', 'cancelled', 'no-show'] }
    })
    .populate({
      path: 'doctor',
      select: 'department specialization',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .sort({ appointmentDate: -1 });
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
    
  } catch (error) {
    console.error('Error fetching patient appointment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient appointment history',
      error: error.message
    });
  }
};
// controllers/doctorController.js
exports.getDashboardStats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Count total appointments
    const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
    
    // Count upcoming appointments
    const upcomingAppointments = await Appointment.countDocuments({ 
      doctor: doctorId,
      appointmentDate: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed', 'no-show'] }
    });
    
    // Count completed appointments
    const completedAppointments = await Appointment.countDocuments({ 
      doctor: doctorId,
      status: 'completed'
    });
    
    // Other stats as needed...
    
    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        // Add more stats as needed
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};