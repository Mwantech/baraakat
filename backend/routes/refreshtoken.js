const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model
const auth = require('../middleware/auth'); // Your existing auth middleware

// Refresh Token Route
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.user.id;

    // Find the user in the database to ensure they exist
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new access token
    const accessToken = jwt.sign(
      { 
        id: user._id,
        // Include any other necessary payload data
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    // Optional: Create a refresh token if you want to implement refresh token rotation
    const refreshToken = jwt.sign(
      { 
        id: user._id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET, // Use a different secret for refresh tokens
      { expiresIn: '7d' } // Longer expiration for refresh token
    );

    res.json({
      accessToken,
      refreshToken, // Optional: only if implementing refresh token rotation
      user: {
        id: user._id,
        email: user.email,
        // Include other non-sensitive user info
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

module.exports = router;