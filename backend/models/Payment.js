// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'insurance'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partial'],
    default: 'pending'
  },
  transactionId: String,
  invoiceNumber: String,
  paymentDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  description: String,
  receiptUrl: String,
  refundReason: String,
  isInsuranceClaim: {
    type: Boolean,
    default: false
  },
  insuranceDetails: {
    provider: String,
    policyNumber: String,
    claimId: String,
    coveragePercentage: Number,
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'partial']
    }
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;
