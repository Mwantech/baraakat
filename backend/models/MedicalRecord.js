// models/MedicalRecord.js
const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
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
  visitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  vitalSigns: {
    temperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['°C', '°F'],
        default: '°C'
      }
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lb'],
        default: 'kg'
      }
    },
    height: {
      value: Number,
      unit: {
        type: String,
        enum: ['cm', 'in'],
        default: 'cm'
      }
    },
    bmi: Number
  },
  symptoms: [String],
  diagnosis: [{
    name: String,
    icdCode: String,
    notes: String
  }],
  treatment: {
    medications: [{
      medicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
      },
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      notes: String
    }],
    procedures: [{
      name: String,
      description: String,
      date: Date,
      notes: String
    }],
    recommendedTests: [{
      name: String,
      description: String,
      isCompleted: {
        type: Boolean,
        default: false
      },
      results: String,
      date: Date
    }]
  },
  followUp: {
    required: Boolean,
    recommendedDate: Date,
    notes: String
  },
  attachments: [{
    name: String,
    fileType: String,
    fileURL: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  notes: {
    doctorNotes: String,
    nursingNotes: String,
    privateNotes: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Method to calculate BMI if weight and height are provided
MedicalRecordSchema.pre('save', function(next) {
  if (this.vitalSigns && this.vitalSigns.weight && this.vitalSigns.weight.value && 
      this.vitalSigns.height && this.vitalSigns.height.value) {
    
    let weight = this.vitalSigns.weight.value;
    let height = this.vitalSigns.height.value;

    // Convert to metric if needed
    if (this.vitalSigns.weight.unit === 'lb') {
      weight = weight * 0.453592; // lb to kg
    }
    if (this.vitalSigns.height.unit === 'in') {
      height = height * 2.54; // in to cm
    }

    // BMI = weight(kg) / (height(m))²
    const heightInMeters = height / 100;
    this.vitalSigns.bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  next();
});

const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
module.exports = MedicalRecord;