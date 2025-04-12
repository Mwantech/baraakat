const mongoose = require('mongoose');

const mpesaTransactionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  merchantRequestId: {
    type: String,
    required: true
  },
  checkoutRequestId: {
    type: String,
    required: true
  },
  mpesaReceiptNumber: {
    type: String
  },
  transactionDate: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  responseDescription: {
    type: String
  },
  resultDescription: {
    type: String
  }
}, { timestamps: true });

// Create index for efficient lookups
mpesaTransactionSchema.index({ checkoutRequestId: 1 });
mpesaTransactionSchema.index({ appointmentId: 1 });

const MpesaTransaction = mongoose.model('MpesaTransaction', mpesaTransactionSchema);

module.exports = { MpesaTransaction };