// models/Disease.js
const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  symptoms: [{
    type: String
  }],
  causes: [{
    type: String
  }],
  riskFactors: [{
    type: String
  }],
  prevention: [{
    type: String
  }],
  treatments: [{
    type: String
  }],
  medications: [{
    name: String,
    description: String,
    sideEffects: [String]
  }],
  relatedDiseases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease'
  }],
  specialistTypes: [{
    type: String
  }],
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical', 'variable'],
    default: 'variable'
  },
  isContagious: {
    type: Boolean,
    default: false
  },
  isAiGenerated: {
    type: Boolean,
    default: false
  },
  aiGeneratedInfo: {
    generatedDate: Date,
    source: String,
    confidence: Number
  },
  references: [{
    title: String,
    url: String,
    description: String
  }]
}, { timestamps: true });

const Disease = mongoose.model('Disease', DiseaseSchema);
module.exports = Disease;
