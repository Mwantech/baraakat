const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const mpesaController = require('../controllers/mpesaController');

// Initiate STK Push
router.post('/mpesa/initiate', authMiddleware, mpesaController.initiateSTKPush);

// M-Pesa callback URL (no authentication required as it's called by Safaricom)
router.post('/mpesa/callback', mpesaController.mpesaCallback);

// Check payment status
router.get('/mpesa/status/:appointmentId', authMiddleware, mpesaController.checkPaymentStatus);



module.exports = router;