// models/Admin.js
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: String,
    required: true
  },
  department: String,
  adminLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_doctors', 'manage_patients', 'manage_appointments', 
           'view_reports', 'manage_billing', 'system_settings', 'full_access']
  }]
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin;