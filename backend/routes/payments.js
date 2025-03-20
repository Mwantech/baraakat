// routes/payments.js - Payment processing routes
const express = require('express');
const router = express.Router();
const { Payment, Appointment, Invoice, Patient, Doctor, User } = require('../models/Payment');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get all payments (admin only)
router.get('/all', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { status, startDate, endDate, patientId, doctorId, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (patientId) filter.patient = patientId;
    if (doctorId) filter.doctor = doctorId;
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get payments with pagination
    const payments = await Payment.find(filter)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('appointment')
      .populate('invoice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Payment.countDocuments(filter);
    
    // Calculate statistics
    const stats = {
      totalAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0
    };
    
    const allPayments = await Payment.find(filter);
    
    allPayments.forEach(payment => {
      stats.totalAmount += payment.amount;
      
      if (payment.status === 'completed') {
        stats.completedAmount += payment.amount;
      } else if (payment.status === 'pending') {
        stats.pendingAmount += payment.amount;
      } else if (payment.status === 'failed') {
        stats.failedAmount += payment.amount;
      }
    });
    
    res.json({
      payments,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user payments
router.get('/', auth, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }
    
    // Add role-specific filters
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      filter.patient = patient._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      filter.doctor = doctor._id;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get payments with pagination
    const payments = await Payment.find(filter)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('appointment')
      .populate('invoice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Payment.countDocuments(filter);
    
    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('appointment')
      .populate('invoice');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check authorization
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || payment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this payment' });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || payment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this payment' });
      }
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create payment intent (for frontend to handle payment)
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { appointmentId, invoiceId, amount } = req.body;
    
    if ((!appointmentId && !invoiceId) || !amount) {
      return res.status(400).json({ message: 'Appointment/Invoice ID and amount are required' });
    }
    
    // Verify the amount is correct based on appointment or invoice
    let verifiedAmount = 0;
    let doctorId, patientId;
    
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId).populate('doctor');
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Get consultation fee from doctor
      verifiedAmount = appointment.doctor.consultationFee;
      doctorId = appointment.doctor._id;
      patientId = appointment.patient;
      
      // Check if user is authorized
      if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient || appointment.patient.toString() !== patient._id.toString()) {
          return res.status(403).json({ message: 'Not authorized for this appointment' });
        }
      }
    } else if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      verifiedAmount = invoice.amount;
      doctorId = invoice.doctor;
      patientId = invoice.patient;
      
      // Check if user is authorized
      if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient || invoice.patient.toString() !== patient._id.toString()) {
          return res.status(403).json({ message: 'Not authorized for this invoice' });
        }
      }
    }
    
    // Verify amount to prevent manipulation
    if (Math.abs(verifiedAmount - amount) > 0.01) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    // Create payment in database as pending
    const payment = new Payment({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      invoice: invoiceId || null,
      amount: verifiedAmount,
      status: 'pending',
      method: 'card',
      details: {
        currency: 'usd'
      }
    });
    
    await payment.save();
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(verifiedAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        paymentId: payment._id.toString(),
        appointmentId: appointmentId || 'none',
        invoiceId: invoiceId || 'none'
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Webhook for Stripe to update payment status
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata.paymentId;
      
      await updatePaymentStatus(paymentId, 'completed', {
        transactionId: paymentIntent.id,
        receiptUrl: null // Stripe doesn't provide receipt URL in payment intent
      });
    }
    
    // Handle failed payment
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata.paymentId;
      
      await updatePaymentStatus(paymentId, 'failed', {
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed'
      });
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create cash payment (admin/doctor only)
router.post('/cash', auth, roleCheck(['admin', 'doctor']), async (req, res) => {
  try {
    const { appointmentId, invoiceId, amount, patientId } = req.body;
    
    if ((!appointmentId && !invoiceId) || !amount || !patientId) {
      return res.status(400).json({ message: 'Appointment/Invoice ID, patient ID, and amount are required' });
    }
    
    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Get doctor ID based on user role
    let doctorId;
    
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      doctorId = doctor._id;
    } else {
      // Admin needs to provide doctor ID
      if (!req.body.doctorId) {
        return res.status(400).json({ message: 'Doctor ID is required' });
      }
      
      const doctor = await Doctor.findById(req.body.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      doctorId = doctor._id;
    }
    
    // Create payment record
    const payment = new Payment({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      invoice: invoiceId || null,
      amount,
      status: 'completed',
      method: 'cash',
      details: {
        currency: 'usd',
        receivedBy: req.user.id,
        notes: req.body.notes || 'Cash payment'
      }
    });
    
    await payment.save();
    
    // Update appointment or invoice status if needed
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { 
        paymentStatus: 'paid',
        payment: payment._id
      });
    } else if (invoiceId) {
      await Invoice.findByIdAndUpdate(invoiceId, { 
        status: 'paid',
        payment: payment._id
      });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status (internal function)
async function updatePaymentStatus(paymentId, status, details = {}) {
  try {
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    payment.status = status;
    payment.details = { ...payment.details, ...details };
    payment.updatedAt = new Date();
    
    await payment.save();
    
    // Update related documents
    if (status === 'completed') {
      if (payment.appointment) {
        await Appointment.findByIdAndUpdate(payment.appointment, { 
          paymentStatus: 'paid',
          payment: payment._id
        });
      }
      
      if (payment.invoice) {
        await Invoice.findByIdAndUpdate(payment.invoice, { 
          status: 'paid',
          payment: payment._id
        });
      }
    }
    
    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

// Refund payment (admin only)
router.post('/:id/refund', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }
    
    if (payment.isRefunded) {
      return res.status(400).json({ message: 'Payment already refunded' });
    }
    
    // Process refund based on payment method
    if (payment.method === 'card') {
      // Refund through Stripe
      if (!payment.details.transactionId) {
        return res.status(400).json({ message: 'Cannot refund: missing transaction ID' });
      }
      
      const refund = await stripe.refunds.create({
        payment_intent: payment.details.transactionId,
        reason: req.body.reason || 'requested_by_customer'
      });
      
      payment.isRefunded = true;
      payment.refundDetails = {
        refundId: refund.id,
        reason: req.body.reason || 'requested_by_customer',
        amount: payment.amount,
        refundedBy: req.user.id,
        refundedAt: new Date()
      };
    } else if (payment.method === 'cash') {
      // Manual refund
      payment.isRefunded = true;
      payment.refundDetails = {
        reason: req.body.reason || 'requested_by_customer',
        amount: payment.amount,
        refundedBy: req.user.id,
        refundedAt: new Date(),
        notes: req.body.notes || 'Cash refund processed'
      };
    }
    
    await payment.save();
    
    // Update related documents
    if (payment.appointment) {
      await Appointment.findByIdAndUpdate(payment.appointment, { 
        paymentStatus: 'refunded'
      });
    }
    
    if (payment.invoice) {
      await Invoice.findByIdAndUpdate(payment.invoice, { 
        status: 'refunded'
      });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment statistics (admin only)
router.get('/stats/overview', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.createdAt = { $lte: new Date(endDate) };
    }
    
    // Get payments with date filter
    const payments = await Payment.find(dateFilter);
    
    // Calculate statistics
    const stats = {
      totalAmount: 0,
      totalCount: payments.length,
      completedAmount: 0,
      completedCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      failedAmount: 0,
      failedCount: 0,
      refundedAmount: 0,
      refundedCount: 0,
      byMethod: {
        card: { amount: 0, count: 0 },
        cash: { amount: 0, count: 0 }
      }
    };
    
    payments.forEach(payment => {
      stats.totalAmount += payment.amount;
      
      // By status
      if (payment.status === 'completed') {
        if (payment.isRefunded) {
          stats.refundedAmount += payment.amount;
          stats.refundedCount += 1;
        } else {
          stats.completedAmount += payment.amount;
          stats.completedCount += 1;
        }
      } else if (payment.status === 'pending') {
        stats.pendingAmount += payment.amount;
        stats.pendingCount += 1;
      } else if (payment.status === 'failed') {
        stats.failedAmount += payment.amount;
        stats.failedCount += 1;
      }
      
      // By method
      if (payment.method === 'card') {
        stats.byMethod.card.amount += payment.amount;
        stats.byMethod.card.count += 1;
      } else if (payment.method === 'cash') {
        stats.byMethod.cash.amount += payment.amount;
        stats.byMethod.cash.count += 1;
      }
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;