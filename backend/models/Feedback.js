// models/Feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  review: String,
  categories: {
    bedside_manner: {
      type: Number,
      min: 1,
      max: 5
    },
    wait_time: {
      type: Number,
      min: 1,
      max: 5
    },
    explanation: {
      type: Number,
      min: 1,
      max: 5
    },
    effectiveness: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  responseFromDoctor: String
}, { timestamps: true });

FeedbackSchema.post('save', async function(doc) {
  // Update doctor's rating after new feedback is saved
  if (doc.doctor && doc.rating) {
    try {
      const Doctor = mongoose.model('Doctor');
      const doctor = await Doctor.findById(doc.doctor);
      
      // Calculate new average rating
      const newTotalRatings = doctor.totalRatings + 1;
      const currentRatingSum = doctor.rating * doctor.totalRatings;
      const newRating = (currentRatingSum + doc.rating) / newTotalRatings;
      
      // Update doctor document
      await Doctor.updateOne(
        { _id: doc.doctor },
        { 
          rating: newRating, 
          totalRatings: newTotalRatings 
        }
      );
    } catch (error) {
      console.error('Error updating doctor rating:', error);
    }
  }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);
module.exports = Feedback;
