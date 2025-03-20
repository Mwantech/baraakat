// models/Prescription.js
const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: String,
  instructions: String,
  sideEffects: [String],
  isActive: {
    type: Boolean,
    default: true
  }
});

const PrescriptionSchema = new mongoose.Schema({
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  diagnosis: {
    type: String,
    required: true
  },
  medications: [MedicationSchema],
  instructions: String,
  followUpDate: Date,
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  isAiGenerated: {
    type: Boolean,
    default: false
  },
  aiSuggestions: [String],
  notes: String
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', PrescriptionSchema);
module.exports = Prescription;