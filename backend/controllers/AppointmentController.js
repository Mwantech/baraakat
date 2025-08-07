// controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctors');
const User = require('../models/User');
const { MpesaTransaction } = require('../models/mpesaTransaction');
const nodemailer = require('nodemailer');

// Email configuration - replace with your SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS  // your email password or app password
  }
});

// Email templates
const emailTemplates = {
  appointmentConfirmation: (appointmentData, patientName, doctorName) => ({
    subject: 'Appointment Confirmation - Healthcare System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">Appointment Confirmed</h1>
          <div style="width: 50px; height: 3px; background-color: #3498db; margin: 0 auto;"></div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Dear ${patientName},</h2>
          <p style="color: #555; line-height: 1.6;">Your appointment has been successfully scheduled. Please find the details below:</p>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Doctor:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">Dr. ${doctorName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Date:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">${new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Time:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">${appointmentData.startTime} - ${appointmentData.endTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Fee:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">KSh ${appointmentData.fee}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #2c3e50;">Status:</td>
              <td style="padding: 10px 0; color: #27ae60; font-weight: bold;">Scheduled</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin-bottom: 20px;">
          <h4 style="color: #2c3e50; margin-top: 0;">Important Notes:</h4>
          <ul style="color: #555; line-height: 1.6; margin-bottom: 0;">
            <li>Please arrive 15 minutes before your scheduled time</li>
            <li>Bring a valid ID and insurance card (if applicable)</li>
            <li>If you need to reschedule or cancel, please contact us at least 24 hours in advance</li>
            <li>Payment is required before the consultation</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
          <p style="color: #777; margin-bottom: 10px;">Thank you for choosing our healthcare services!</p>
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  appointmentCancellation: (appointmentData, patientName, doctorName, reason) => ({
    subject: 'Appointment Cancelled - Healthcare System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin-bottom: 10px;">Appointment Cancelled</h1>
          <div style="width: 50px; height: 3px; background-color: #e74c3c; margin: 0 auto;"></div>
        </div>
        
        <div style="background-color: #fdf2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Dear ${patientName},</h2>
          <p style="color: #555; line-height: 1.6;">Your appointment has been cancelled. Details are provided below:</p>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Cancelled Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Doctor:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">Dr. ${doctorName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Date:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">${new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Time:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">${appointmentData.startTime} - ${appointmentData.endTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #2c3e50;">Reason:</td>
              <td style="padding: 10px 0; color: #e74c3c;">${reason || 'No reason provided'}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
          <p style="color: #777; margin-bottom: 10px;">We apologize for any inconvenience caused.</p>
          <p style="color: #777; margin-bottom: 10px;">Feel free to schedule a new appointment at your convenience.</p>
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  appointmentReminder: (appointmentData, patientName, doctorName) => ({
    subject: 'Appointment Reminder - Tomorrow - Healthcare System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f39c12; margin-bottom: 10px;">Appointment Reminder</h1>
          <div style="width: 50px; height: 3px; background-color: #f39c12; margin: 0 auto;"></div>
        </div>
        
        <div style="background-color: #fef9e7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Dear ${patientName},</h2>
          <p style="color: #555; line-height: 1.6;">This is a friendly reminder about your upcoming appointment tomorrow:</p>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Doctor:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">Dr. ${doctorName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #2c3e50;">Date:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #555;">${new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #2c3e50;">Time:</td>
              <td style="padding: 10px 0; color: #555;">${appointmentData.startTime} - ${appointmentData.endTime}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin-bottom: 20px;">
          <h4 style="color: #2c3e50; margin-top: 0;">Preparation Checklist:</h4>
          <ul style="color: #555; line-height: 1.6; margin-bottom: 0;">
            <li>Arrive 15 minutes early</li>
            <li>Bring your ID and insurance card</li>
            <li>Prepare your list of current medications</li>
            <li>Write down any questions you have for the doctor</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
          <p style="color: #777; margin-bottom: 10px;">We look forward to seeing you tomorrow!</p>
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  })
};

// Helper function to send emails
const sendEmail = async (to, template) => {
  try {
    const mailOptions = {
      from: `"Healthcare System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, startTime, endTime, symptoms, notes } = req.body;
    
    // Try to find patient directly by ID first
    let patient = await Patient.findById(patientId).populate('user', 'firstName lastName email');
    
    // If not found, try to find patient by user ID
    if (!patient) {
      patient = await Patient.findOne({ user: patientId }).populate('user', 'firstName lastName email');
    }
    
    // If still not found, return error
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Get the actual patient ID for consistency in the database
    const actualPatientId = patient._id;
    
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId).populate('user', 'firstName lastName email');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    // Check if the time slot is available (no conflicting appointments)
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
    
    // Handle symptoms - convert from array to string if needed
    let processedSymptoms = symptoms;
    if (Array.isArray(symptoms)) {
      processedSymptoms = symptoms.join(', ');
    }
    
    // Create the appointment with the actual patient ID
    const newAppointment = new Appointment({
      patient: actualPatientId,
      doctor: doctorId,
      appointmentDate,
      startTime,
      endTime,
      symptoms: processedSymptoms,
      notes,
      fee: doctor.fees,
      status: 'scheduled'
    });
    
    await newAppointment.save();
    
    // Send confirmation email to patient
    if (patient.user && patient.user.email) {
      const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
      const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;
      
      const emailTemplate = emailTemplates.appointmentConfirmation(newAppointment, patientName, doctorName);
      const emailResult = await sendEmail(patient.user.email, emailTemplate);
      
      if (!emailResult.success) {
        console.error('Failed to send confirmation email:', emailResult.error);
        // Don't fail the appointment creation if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Appointment scheduled successfully and confirmation email sent'
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
    const { status, includeUnpaid } = req.query;
    
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
    
    const filter = { 
      patient: actualPatientId
    };
    
    // Add payment filter only if we don't want to include unpaid appointments
    if (includeUnpaid !== 'true') {
      // Use $or to check both conditions since data might be inconsistent
      filter.$or = [
        { isPaid: true },
        { paymentStatus: 'paid' }
      ];
    }
    
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
    const { date, status, includeUnpaid } = req.query;
    
    const filter = { 
      doctor: doctorId
    };
    
    // Add payment filter only if we don't want to include unpaid appointments
    if (includeUnpaid !== 'true') {
      // Use $or to check both conditions since data might be inconsistent
      filter.$or = [
        { isPaid: true },
        { paymentStatus: 'paid' }
      ];
    }
    
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
    
    const appointment = await Appointment.findById(id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
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
    
    const appointment = await Appointment.findById(id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
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
    
    // Send cancellation email to patient
    if (appointment.patient && appointment.patient.user && appointment.patient.user.email) {
      const patientName = `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`;
      const doctorName = `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;
      
      const emailTemplate = emailTemplates.appointmentCancellation(appointment, patientName, doctorName, cancellationReason);
      const emailResult = await sendEmail(appointment.patient.user.email, emailTemplate);
      
      if (!emailResult.success) {
        console.error('Failed to send cancellation email:', emailResult.error);
      }
    }
    
    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully and notification email sent'
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

// Get doctors for appointments (removed availability checking)
exports.getAvailableDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    
    // Basic filter for doctors, no availability check
    const filter = {};
    
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
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
    
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
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

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
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
    const allSlots = generateTimeSlots(
      daySchedule.startTime, 
      daySchedule.endTime, 
      daySchedule.slotDuration || 30
    );

    // Format booked appointments times to ensure consistent comparison
    const bookedTimes = bookedAppointments.map(appt => ({
      startTime: formatTime(appt.startTime),
      endTime: formatTime(appt.endTime)
    }));

    // Filter out booked slots with more reliable comparison
    const availableSlots = allSlots.filter(slot => {
      return !bookedTimes.some(booked => 
        booked.startTime === slot.startTime && booked.endTime === slot.endTime
      );
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

// Helper function to ensure consistent time format
function formatTime(time) {
  if (!time) return null;
  
  // If time is already a string in HH:MM format, return it
  if (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time)) {
    // Ensure it's always in 2-digit format (09:00 instead of 9:00)
    const [hours, minutes] = time.split(':');
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  
  // If time is a Date object, convert to HH:MM string
  if (time instanceof Date) {
    return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  }
  
  // Handle other formats as needed
  return time;
}

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