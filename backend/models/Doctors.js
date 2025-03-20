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
    type: Number, // years
    default: 0
  },
  department: {
    type: String,
    required: true
  },
  availableTime: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String,
    slotDuration: {
      type: Number,
      default: 30 // minutes
    }
  }],
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
  bio: String,
  profilePicture: String,
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', DoctorSchema);
module.exports = Doctor;