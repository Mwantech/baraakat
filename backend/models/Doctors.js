// models/Doctor.js
const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  qualification: [String],
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    required: true
  },
  availableTime: {
    type: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // e.g., '09:00'
      endTime: String,   // e.g., '17:00'
      slotDuration: {
        type: Number,
        default: 30 // in minutes
      }
    }],
    default: () => ([
      { day: 'monday', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      { day: 'wednesday', startTime: '10:00', endTime: '16:00', slotDuration: 30 },
      { day: 'friday', startTime: '09:00', endTime: '15:00', slotDuration: 30 }
    ])
  },
  fees: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  bio: {
    type: String
  },
  profilePicture: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Doctor = mongoose.model('Doctor', DoctorSchema);
module.exports = Doctor;
