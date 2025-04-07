// models/Prescription.js
const mongoose = require('mongoose');

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
  medications: [{
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
    duration: {
      type: Number, // in days
      required: true
    },
    notes: String
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  refillable: {
    type: Boolean,
    default: false
  },
  refillsRemaining: {
    type: Number,
    default: 0
  },
  refillHistory: [{
    requestDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    processedDate: Date
  }],
  pharmacy: {
    name: String,
    address: String,
    phone: String,
    email: String
  },
  notes: {
    pharmacistNotes: String,
    patientNotes: String
  },
  eSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date
  }
}, { timestamps: true });

// Add a pre-save hook to set endDate based on startDate and duration of longest medication
PrescriptionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('medications') || this.isModified('startDate')) {
    // Find the medication with the longest duration
    const longestDuration = Math.max(...this.medications.map(med => med.duration));
    
    // Set the endDate based on startDate + longest duration
    const startDate = new Date(this.startDate);
    this.endDate = new Date(startDate.setDate(startDate.getDate() + longestDuration));
    
    // Update status if necessary
    const currentDate = new Date();
    if (currentDate > this.endDate) {
      this.status = 'expired';
    }
  }
  next();
});

// Method to check if prescription is expired and update status if needed
PrescriptionSchema.methods.updateStatus = function() {
  const currentDate = new Date();
  if (currentDate > this.endDate && this.status !== 'completed') {
    this.status = 'expired';
    return true; // Status was updated
  }
  return false; // No change needed
};

const Prescription = mongoose.model('Prescription', PrescriptionSchema);
module.exports = Prescription;