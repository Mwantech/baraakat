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
  recordType: {
    type: String,
    enum: ['consultation', 'lab_result', 'imaging', 'surgery', 'vaccination', 'allergy', 'chronic_condition'],
    required: true
  },
  diagnosis: [{
    condition: String,
    notes: String,
    isChronic: Boolean
  }],
  symptoms: [String],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  labResults: [{
    testName: String,
    testDate: Date,
    result: String,
    normalRange: String,
    interpretation: String,
    attachments: [String] // File URLs
  }],
  medications: [{
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    notes: String
  }],
  treatments: [{
    name: String,
    description: String,
    startDate: Date,
    endDate: Date,
    outcome: String
  }],
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  notes: String,
  aiAnalysis: {
    suggestions: [String],
    riskFactors: [String],
    similarCases: [String]
  }
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
module.exports = MedicalRecord;