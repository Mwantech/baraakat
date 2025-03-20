// PaymentController.js
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice'); // Assuming there's an Invoice model

class PaymentController {
  static async getAll(req, res) {
    try {
      const payments = await Payment.find()
        .populate('patient')
        .populate('appointment');
      return res.json(payments);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('patient')
        .populate('appointment');
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      return res.json(payment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const payment = new Payment(req.body);
      await payment.save();
      return res.status(201).json(payment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      return res.json(payment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const payment = await Payment.findByIdAndDelete(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      return res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async processRefund(req, res) {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Update payment status
      payment.status = 'refunded';
      await payment.save();
      
      // Update appointment status if exists
      if (payment.appointment) {
        await Appointment.findByIdAndUpdate(payment.appointment, {
          paymentStatus: 'refunded'
        });
      }
      
      // Update invoice if exists
      if (payment.invoice) {
        await Invoice.findByIdAndUpdate(payment.invoice, {
          status: 'refunded'
        });
      }
      
      return res.json(payment);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  static async getPaymentStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      // Get total payments
      const totalPayments = await Payment.countDocuments(dateFilter);
      
      // Get total amount
      const paymentSums = await Payment.aggregate([
        { $match: dateFilter },
        { $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } }
          }
        }
      ]);
      
      const stats = {
        totalPayments,
        totalAmount: paymentSums.length > 0 ? paymentSums[0].totalAmount : 0,
        refundedAmount: paymentSums.length > 0 ? paymentSums[0].refundedAmount : 0,
        netAmount: paymentSums.length > 0 ? 
          paymentSums[0].totalAmount - paymentSums[0].refundedAmount : 0
      };
      
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = PaymentController;
