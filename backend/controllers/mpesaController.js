const axios = require('axios');
const moment = require('moment');
const Appointment = require('../models/Appointment');
const { MpesaTransaction } = require('../models/mpesaTransaction');

// Utility function to generate Base64 auth string
const getAuthToken = (consumerKey, consumerSecret) => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  return auth;
};

// Utility function to generate timestamp in required format
const getTimestamp = () => {
  return moment().format('YYYYMMDDHHmmss');
};

// Utility function to generate password for Safaricom API
const generatePassword = (shortcode, passkey, timestamp) => {
  const data = shortcode + passkey + timestamp;
  return Buffer.from(data).toString('base64');
};

// Environment variables (should be in your .env file)
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'; // 'sandbox' or 'production'

const BASE_URL = MPESA_ENV === 'production'
? 'https://api.safaricom.co.ke'
: 'https://sandbox.safaricom.co.ke';

// Controller functions
exports.initiateSTKPush = async (req, res) => {
  try {
    const { appointmentId, phoneNumber } = req.body;

    // Validate phone number format (should be 254XXXXXXXXX)
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Number should be in the format 254XXXXXXXXX'
      });
    }

    // Fetch appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'fees');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Get the fee amount
    const amount = appointment.fee || 0;
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false, 
        message: 'Invalid payment amount'
      });
    }

    // Get OAuth token
    const authResponse = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${getAuthToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET)}`
      }
    });

    const token = authResponse.data.access_token;
    const timestamp = getTimestamp();
    const password = generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);
    const callbackUrl = MPESA_CALLBACK_URL;

    // Prepare STK Push request
    const requestData = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: `MED_APT_${appointmentId}`,
      TransactionDesc: 'Medical Appointment Payment'
    };

    // Make request to Safaricom API
    const stkResponse = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Create transaction record
    const transaction = new MpesaTransaction({
      appointmentId,
      amount,
      phoneNumber,
      merchantRequestId: stkResponse.data.MerchantRequestID,
      checkoutRequestId: stkResponse.data.CheckoutRequestID,
      status: 'pending',
      responseDescription: stkResponse.data.ResponseDescription
    });

    await transaction.save();

    // Update appointment payment status to pending
    appointment.paymentStatus = 'pending';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        merchantRequestId: stkResponse.data.MerchantRequestID,
        checkoutRequestId: stkResponse.data.CheckoutRequestID,
        responseDescription: stkResponse.data.ResponseDescription
      }
    });

  } catch (error) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error initiating M-Pesa payment',
      error: error.response?.data || error.message
    });
  }
};

// Callback URL for M-Pesa to send payment results
exports.mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback Data:', JSON.stringify(callbackData));

    // Handle the callback data
    const resultCode = callbackData.Body.stkCallback.ResultCode;
    const merchantRequestId = callbackData.Body.stkCallback.MerchantRequestID;
    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;

    // Find the transaction record
    const transaction = await MpesaTransaction.findOne({ 
      checkoutRequestId: checkoutRequestId 
    });

    if (!transaction) {
      console.error('Transaction not found for checkout request ID:', checkoutRequestId);
      return res.status(200).json({ success: true });
    }

    if (resultCode === 0) {
      // Payment was successful
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata;
      const items = callbackMetadata.Item;
      
      // Extract payment details from callback data
      const amountItem = items.find(item => item.Name === 'Amount');
      const mpesaReceiptNumberItem = items.find(item => item.Name === 'MpesaReceiptNumber');
      const transactionDateItem = items.find(item => item.Name === 'TransactionDate');
      const phoneNumberItem = items.find(item => item.Name === 'PhoneNumber');

      // Update transaction record
      transaction.status = 'completed';
      transaction.mpesaReceiptNumber = mpesaReceiptNumberItem ? mpesaReceiptNumberItem.Value : null;
      transaction.transactionDate = transactionDateItem ? transactionDateItem.Value : null;
      transaction.resultDescription = callbackData.Body.stkCallback.ResultDesc;
      await transaction.save();

      // Update appointment payment status
      const appointment = await Appointment.findById(transaction.appointmentId);
      if (appointment) {
        appointment.paymentStatus = 'paid';
        appointment.paymentReference = mpesaReceiptNumberItem ? mpesaReceiptNumberItem.Value : null;
        await appointment.save();
      }
    } else {
      // Payment failed
      transaction.status = 'failed';
      transaction.resultDescription = callbackData.Body.stkCallback.ResultDesc;
      await transaction.save();

      // Update appointment payment status
      const appointment = await Appointment.findById(transaction.appointmentId);
      if (appointment) {
        appointment.paymentStatus = 'failed';
        await appointment.save();
      }
    }

    // Always return a success response to Safaricom
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    // Always return a success response to Safaricom even if we had an error processing
    res.status(200).json({ success: true });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const transaction = await MpesaTransaction.findOne({ 
      appointmentId,
      status: { $in: ['pending', 'completed', 'failed'] }
    }).sort({ createdAt: -1 });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No payment transaction found for this appointment'
      });
    }

    // If transaction is pending, check with Safaricom
    if (transaction.status === 'pending') {
      
      // Get OAuth token
      const authResponse = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${getAuthToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET)}`
        }
      });

      const token = authResponse.data.access_token;
      const timestamp = getTimestamp();
      const password = generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);

      // Query payment status from Safaricom
      const requestData = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: transaction.checkoutRequestId
      };

      const statusResponse = await axios.post(
        `${BASE_URL}/mpesa/stkpushquery/v1/query`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Status response:', statusResponse.data);

      // Check ResultCode from response
      if (statusResponse.data.ResultCode === 0 || statusResponse.data.ResultCode === '0') {
        // Payment was successful
        transaction.status = 'completed';
        transaction.resultDescription = statusResponse.data.ResultDesc;
        
        // Update appointment payment status
        const appointment = await Appointment.findById(transaction.appointmentId);
        if (appointment) {
          appointment.paymentStatus = 'paid';
          await appointment.save();
        }
      } else if (statusResponse.data.ResultCode === 1032 || statusResponse.data.ResultCode === '1032') {
        // Transaction canceled by user
        transaction.status = 'failed';
        transaction.resultDescription = 'Transaction canceled by user';
        
        // Update appointment payment status
        const appointment = await Appointment.findById(transaction.appointmentId);
        if (appointment) {
          appointment.paymentStatus = 'failed';
          await appointment.save();
        }
      }
      
      await transaction.save();
    }

    // Return current transaction status
    res.status(200).json({
      success: true,
      data: {
        status: transaction.status,
        description: transaction.resultDescription,
        receiptNumber: transaction.mpesaReceiptNumber,
        timestamp: transaction.transactionDate
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error checking payment status',
      error: error.response?.data || error.message
    });
  }
};
