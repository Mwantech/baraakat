// controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctors');
const User = require('../models/User');

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, startTime, endTime, symptoms, notes } = req.body;
    
    // Try to find patient directly by ID first
    let patient = await Patient.findById(patientId);
    
    // If not found, try to find patient by user ID
    if (!patient) {
      patient = await Patient.findOne({ user: patientId });
    }
    
    // If still not found, return error
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Get the actual patient ID for consistency in the database
    const actualPatientId = patient._id;
    
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
    
    // Check if doctor has any availability slots configured
    if (!doctor.availableTime || doctor.availableTime.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has no availability schedule configured'
      });
    }
    
    // More flexible day comparison
    const appointmentDay = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const doctorSchedule = doctor.availableTime.find(time => 
      time && time.day && time.day.toLowerCase() === appointmentDay
    );
    
    if (!doctorSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available on this day'
      });
    }
    
    // Check if the requested time is within the doctor's schedule for the day
    const [requestStartHour, requestStartMinute] = startTime.split(':').map(Number);
    const [requestEndHour, requestEndMinute] = endTime.split(':').map(Number);
    const [scheduleStartHour, scheduleStartMinute] = doctorSchedule.startTime.split(':').map(Number);
    const [scheduleEndHour, scheduleEndMinute] = doctorSchedule.endTime.split(':').map(Number);
    
    const requestStartMinutes = requestStartHour * 60 + requestStartMinute;
    const requestEndMinutes = requestEndHour * 60 + requestEndMinute;
    const scheduleStartMinutes = scheduleStartHour * 60 + scheduleStartMinute;
    const scheduleEndMinutes = scheduleEndHour * 60 + scheduleEndMinute;
    
    if (requestStartMinutes < scheduleStartMinutes || requestEndMinutes > scheduleEndMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Requested time is outside doctor\'s working hours'
      });
    }
    
    // Check if the time slot is available
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { 
        $gte: new Date(new Date(appointmentDate).setHours(0, 0, 0)), 
        $lt: new Date(new Date(appointmentDate).setHours(23, 59, 59)) 
      },
      status: { $in: ['scheduled', 'confirmed'] },
      startTime: startTime
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    // Create the appointment with the actual patient ID
    const newAppointment = new Appointment({
      patient: actualPatientId,
      doctor: doctorId,
      appointmentDate,
      startTime,
      endTime,
      symptoms,
      notes,
      fee: doctor.fees,
      status: 'scheduled'
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
    
    // Try to find patient directly first
    let patient = await Patient.findById(patientId);
    
    // If not found, try to find by user ID
    if (!patient) {
      patient = await Patient.findOne({ user: patientId });
    }
    
    // If still not found, return error
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Use the actual patient ID for querying appointments
    const actualPatientId = patient._id;
    
    const filter = { patient: actualPatientId };
    
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
    
    // Try to find patient directly first
    let patient = await Patient.findById(patientId);
    
    // If not found, try to find by user ID
    if (!patient) {
      patient = await Patient.findOne({ user: patientId });
    }
    
    // If still not found, return error
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Use the actual patient ID for querying appointments
    const actualPatientId = patient._id;
    
    const history = await Appointment.find({
      patient: actualPatientId,
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

// Get doctor dashboard stats
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

// Get doctors available for appointments
exports.getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, date } = req.query;
    
    // Basic filter for available and verified doctors
    const filter = { 
      isAvailable: true,
      isVerified: true
    };
    
    // Additional filter by specialization if provided
    if (specialization) {
      filter.specialization = specialization;
    }
    
    // Find doctors matching the filter criteria
    const doctors = await Doctor.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName email phone'
      })
      .select('specialization department qualification experience fees rating totalRatings availableTime profilePicture bio');
    
    // If date is provided, filter doctors by availability on that day
    let availableDoctors = doctors;
    if (date) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      availableDoctors = doctors.filter(doctor => {
        return doctor.availableTime.some(time => time.day === dayOfWeek);
      });
    }
    
    res.status(200).json({
      success: true,
      count: availableDoctors.length,
      data: availableDoctors
    });
    
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available doctors',
      error: error.message
    });
  }
};

// Get all unique specializations
exports.getSpecializations = async (req, res) => {
  try {
    // Fetch distinct specialization values from the Doctor collection
    const specializations = await Doctor.distinct('specialization');
    
    res.status(200).json({
      success: true,
      count: specializations.length,
      data: specializations
    });
    
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching specializations',
      error: error.message
    });
  }
};

// Get available time slots for a doctor on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
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

    // Check if doctor has any availability set
    if (!doctor.availableTime || doctor.availableTime.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Doctor has no availability schedule set'
      });
    }

    // Get the day of week (e.g., "monday", "tuesday")
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Find doctor's availability for this day
    const daySchedule = doctor.availableTime.find(time => time.day && time.day.toLowerCase() === dayOfWeek);
    
    if (!daySchedule) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Doctor is not available on this day'
      });
    }

    // Get all booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { 
        $gte: new Date(new Date(date).setHours(0, 0, 0)), 
        $lt: new Date(new Date(date).setHours(23, 59, 59)) 
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('startTime endTime');

    // Generate all possible slots based on doctor's availability
    // Use the slotDuration from the daySchedule instead of appointmentDuration
    const allSlots = generateTimeSlots(
      daySchedule.startTime, 
      daySchedule.endTime, 
      daySchedule.slotDuration || 30 // Use slotDuration from the schema
    );

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => {
      return !bookedAppointments.some(appt => {
        return appt.startTime === slot.startTime && appt.endTime === slot.endTime;
      });
    });

    res.status(200).json({
      success: true,
      data: availableSlots
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
};

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  
  // Ensure we have valid inputs
  if (!startTime || !endTime || !durationMinutes) {
    return slots; // Return empty array if missing parameters
  }
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // Validate time inputs
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    return slots; // Return empty array if invalid time format
  }
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (
    currentHour < endHour || 
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    // Calculate end time of current slot
    let endHourSlot = currentHour;
    let endMinuteSlot = currentMinute + durationMinutes;
    
    if (endMinuteSlot >= 60) {
      endHourSlot += Math.floor(endMinuteSlot / 60);
      endMinuteSlot = endMinuteSlot % 60;
    }
    
    // Format times to HH:MM
    const formattedStartTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const formattedEndTime = `${String(endHourSlot).padStart(2, '0')}:${String(endMinuteSlot).padStart(2, '0')}`;
    
    // Add slot if it doesn't go beyond end time
    if (endHourSlot < endHour || (endHourSlot === endHour && endMinuteSlot <= endMinute)) {
      slots.push({
        startTime: formattedStartTime,
        endTime: formattedEndTime
      });
    }
    
    // Move to next slot
    currentHour = endHourSlot;
    currentMinute = endMinuteSlot;
  }
  
  return slots;
}

// Helper function to get patient by ID or user ID
exports.getPatientByIdOrUserId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find patient directly first
    let patient = await Patient.findById(id);
    
    // If not found, try to find by user ID
    if (!patient) {
      patient = await Patient.findOne({ user: id });
    }
    
    // If still not found, return error
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
    
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
};

