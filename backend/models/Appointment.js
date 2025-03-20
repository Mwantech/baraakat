
// models/Appointment.js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'specialist'],
    default: 'consultation'
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,
  symptoms: [String],
  isVirtual: {
    type: Boolean,
    default: false
  },
  meetingLink: String,
  reminders: [{
    type: Date,
    sent: Boolean
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'free'],
    default: 'pending'
  },
  paymentId: String
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;