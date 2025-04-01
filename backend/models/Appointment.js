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
  appointmentDate: {
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
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  symptoms: {
    type: String
  },
  followUp: {
    type: Boolean,
    default: false
  },
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  diagnosis: [String],
  fee: {
    type: Number
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;