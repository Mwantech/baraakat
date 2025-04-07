// routes/profile.js
const express = require('express');
const router = express.Router();
const { ProfileController } = require('../controllers/ProfileController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Patient routes
router.get('/patient', ProfileController.getPatientProfile);
router.put('/patient', ProfileController.updatePatientProfile);

// Doctor routes
router.get('/doctor', ProfileController.getDoctorProfile);
router.put('/doctor', ProfileController.updateDoctorProfile);

// Admin routes
router.get('/admin', ProfileController.getAdminProfile);
router.put('/admin', ProfileController.updateAdminProfile);

// Common routes
router.post('/change-password', ProfileController.changePassword);


// Example code to update doctor availability (use in your admin route or doctor profile update)
async function updateDoctorAvailability(doctorId) {
  try {
    const result = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        $set: {
          availableTime: [
            {
              day: "monday",
              startTime: "09:00",
              endTime: "17:00",
              slotDuration: 30
            },
            {
              day: "wednesday",
              startTime: "10:00", 
              endTime: "16:00",
              slotDuration: 30
            },
            {
              day: "friday",
              startTime: "09:00",
              endTime: "15:00",
              slotDuration: 30
            }
          ]
        }
      },
      { new: true }
    );
    
    console.log("Doctor availability updated:", result);
    return result;
  } catch (error) {
    console.error("Failed to update doctor availability:", error);
    throw error;
  }
}

module.exports = router;