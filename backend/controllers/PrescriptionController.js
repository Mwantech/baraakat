// controllers/prescriptionController.js
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctors');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a new prescription
// Create a new prescription
// Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, medications, refillable, refillsRemaining, pharmacy, notes, endDate } = req.body;
    
    // Get doctor ID from authenticated user ID (from middleware)
    const userId = req.userId; // This comes from your auth middleware
    
    // Find the doctor document using the userId
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    const doctorId = doctor._id;
    
    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Create new prescription
    const prescription = new Prescription({
      patient: patientId,
      doctor: doctorId,
      medications,
      startDate: new Date(),
      endDate: endDate || calculateEndDate(medications), // Use provided endDate or calculate based on medications
      refillable,
      refillsRemaining,
      pharmacy,
      notes,
      eSignature: {
        signed: req.body.signed || false,
        signedAt: req.body.signed ? new Date() : null
      }
    });
    
    await prescription.save();
    
    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
};

// Helper function to calculate end date based on medication duration
function calculateEndDate(medications) {
  // Default to 30 days if no medications with duration
  let maxDays = 30;
  
  // Find the medication with the longest duration
  medications.forEach(med => {
    if (med.duration) {
      // Extract the number of days from duration string
      const durationMatch = med.duration.match(/\d+/);
      if (durationMatch) {
        const days = parseInt(durationMatch[0]);
        if (!isNaN(days) && days > maxDays) {
          maxDays = days;
        }
      }
    }
  });
  
  // Calculate end date based on maxDays
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + maxDays);
  return endDate;
}

// Update your getPatientPrescriptions controller function
exports.getPatientPrescriptions = async (req, res) => {
  try {
    // Get patient ID from the authenticated user
    const userId = req.userId; // This comes from your auth middleware
    const userRole = req.userRole; // This comes from your auth middleware
    
    if (userRole !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only patients can view their prescriptions'
      });
    }
    
    // Find the patient document using the userId
    const patient = await Patient.findOne({ user: userId });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }
    
    // Get the prescriptions using the patient ID
    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate({
        path: 'doctor',
        select: 'user specialization',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ createdAt: -1 });
    
    // Update status if needed
    const updatedPrescriptions = prescriptions.map(prescription => {
      if (prescription.updateStatus()) {
        prescription.save();
      }
      return prescription;
    });
    
    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    console.error('Error getting patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prescriptions',
      error: error.message
    });
  }
};

// Get all prescriptions created by a doctor
// In prescriptionController.js
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const { patientId, status, startDate, endDate, medicationName } = req.query;
    
    // Find the doctor record using the authenticated userId
    const doctor = await Doctor.findOne({ user: req.userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found for this user'
      });
    }
    
    const doctorId = doctor._id;
    
    // Build query
    const query = { doctor: doctorId };
    
    // Add filters if provided
    if (patientId) query.patient = patientId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    if (medicationName) {
      query['medications.name'] = { $regex: medicationName, $options: 'i' };
    }
    
    // Find prescriptions and populate patient information
    const prescriptions = await Prescription.find(query)
      .populate({
        path: 'patient',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    console.error('Error getting doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prescriptions',
      error: error.message
    });
  }
};
// Get a single prescription by ID
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        select: 'user specialization',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'patient',
        select: 'user dateOfBirth gender',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Get user ID from auth middleware
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Check if user has permission to view this prescription
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient || prescription.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this prescription'
        });
      }
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (!doctor || prescription.doctor._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this prescription'
        });
      }
    }
    
    // Update status if needed
    if (prescription.updateStatus()) {
      await prescription.save();
    }
    
    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error getting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prescription',
      error: error.message
    });
  }
};

// Update a prescription
exports.updatePrescription = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Only doctors can update prescriptions
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update prescriptions'
      });
    }
    
    // Get doctor ID from the user ID
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check if doctor created this prescription
    if (prescription.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this prescription'
      });
    }
    
    // Only allow updates if prescription is active
    if (prescription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${prescription.status} prescription`
      });
    }
    
    // Fields that can be updated
    const { medications, refillable, refillsRemaining, status, pharmacy, notes, signed } = req.body;
    
    // Update prescription fields
    if (medications) prescription.medications = medications;
    if (refillable !== undefined) prescription.refillable = refillable;
    if (refillsRemaining !== undefined) prescription.refillsRemaining = refillsRemaining;
    if (status) prescription.status = status;
    if (pharmacy) prescription.pharmacy = pharmacy;
    if (notes) prescription.notes = notes;
    
    // Update e-signature if provided
    if (signed) {
      prescription.eSignature = {
        signed: true,
        signedAt: new Date()
      };
    }
    
    await prescription.save();
    
    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating prescription',
      error: error.message
    });
  }
};

// Delete a prescription
exports.deletePrescription = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Only doctors and admins can delete prescriptions
    if (!['doctor', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete prescriptions'
      });
    }
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check if doctor created this prescription or user is admin
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (!doctor || prescription.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this prescription'
        });
      }
    }
    
    await prescription.deleteOne(); // Using deleteOne instead of remove() as remove() is deprecated
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prescription',
      error: error.message
    });
  }
};

// Request a refill
exports.requestRefill = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check if patient is requesting refill for their own prescription
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient || prescription.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to request refill for this prescription'
        });
      }
    }
    
    // Check if prescription is refillable and has refills remaining
    if (!prescription.refillable) {
      return res.status(400).json({
        success: false,
        message: 'This prescription is not refillable'
      });
    }
    
    if (prescription.refillsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No refills remaining for this prescription'
      });
    }
    
    // Check if prescription is active
    if (prescription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot refill a ${prescription.status} prescription`
      });
    }
    
    // Check if there's already a pending refill request
    const pendingRefill = prescription.refillHistory.find(
      refill => refill.status === 'pending'
    );
    
    if (pendingRefill) {
      return res.status(400).json({
        success: false,
        message: 'A refill request is already pending'
      });
    }
    
    // Add refill request
    prescription.refillHistory.push({
      requestDate: new Date(),
      status: 'pending'
    });
    
    await prescription.save();
    
    res.status(200).json({
      success: true,
      message: 'Refill requested successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Error requesting refill:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting refill',
      error: error.message
    });
  }
};

// Process a refill request
exports.processRefillRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Only doctors can process refill requests
    if (userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can process refill requests'
      });
    }
    
    // Get doctor ID from the user ID
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }
    
    const { prescriptionId, refillId, status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }
    
    const prescription = await Prescription.findById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check if doctor created this prescription
    if (prescription.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refill for this prescription'
      });
    }
    
    // Find the refill request
    const refillRequest = prescription.refillHistory.id(refillId);
    
    if (!refillRequest) {
      return res.status(404).json({
        success: false,
        message: 'Refill request not found'
      });
    }
    
    if (refillRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This refill request has already been ${refillRequest.status}`
      });
    }
    
    // Update refill request
    refillRequest.status = status;
    refillRequest.approvedBy = doctor._id;
    refillRequest.processedDate = new Date();
    
    // If approved, decrease refills remaining
    if (status === 'approved') {
      prescription.refillsRemaining -= 1;
    }
    
    await prescription.save();
    
    res.status(200).json({
      success: true,
      message: `Refill request ${status}`,
      data: prescription
    });
  } catch (error) {
    console.error('Error processing refill request:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refill request',
      error: error.message
    });
  }
};

// Generate PDF for prescription
exports.generatePrescriptionPDF = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        select: 'user specialization',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'patient',
        select: 'user dateOfBirth gender',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check if user has permission to view this prescription
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient || prescription.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this prescription'
        });
      }
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (!doctor || prescription.doctor._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this prescription'
        });
      }
    }
    
    // Create a PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.pdf`);
    
    // Pipe the PDF directly to the response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Prescription', { align: 'center' });
    doc.moveDown();
    
    // Prescription details
    doc.fontSize(12).text(`Prescription ID: ${prescription._id}`);
    doc.moveDown();
    
    // Patient information
    doc.fontSize(14).text('Patient Information');
    doc.fontSize(12).text(`Name: ${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`);
    if (prescription.patient.dateOfBirth) {
      doc.text(`Date of Birth: ${new Date(prescription.patient.dateOfBirth).toLocaleDateString()}`);
    }
    if (prescription.patient.gender) {
      doc.text(`Gender: ${prescription.patient.gender}`);
    }
    doc.moveDown();
    
    // Doctor information
    doc.fontSize(14).text('Prescribing Doctor');
    doc.fontSize(12).text(`Name: Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`);
    doc.text(`Specialization: ${prescription.doctor.specialization}`);
    doc.moveDown();
    
    // Prescription details
    doc.fontSize(14).text('Medications');
    prescription.medications.forEach((medication, index) => {
      doc.fontSize(12).text(`${index + 1}. ${medication.name}`);
      doc.text(`   Dosage: ${medication.dosage}`);
      doc.text(`   Frequency: ${medication.frequency}`);
      doc.text(`   Duration: ${medication.duration} days`);
      if (medication.notes) {
        doc.text(`   Notes: ${medication.notes}`);
      }
      doc.moveDown(0.5);
    });
    doc.moveDown();
    
    // Dates and status
    doc.fontSize(14).text('Prescription Details');
    doc.fontSize(12).text(`Issue Date: ${new Date(prescription.startDate).toLocaleDateString()}`);
    doc.text(`Valid Until: ${new Date(prescription.endDate).toLocaleDateString()}`);
    doc.text(`Status: ${prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}`);
    
    if (prescription.refillable) {
      doc.text(`Refills Remaining: ${prescription.refillsRemaining}`);
    }
    doc.moveDown();
    
    // Pharmacy information if available
    if (prescription.pharmacy && Object.keys(prescription.pharmacy).length > 0) {
      doc.fontSize(14).text('Pharmacy Information');
      if (prescription.pharmacy.name) doc.fontSize(12).text(`Name: ${prescription.pharmacy.name}`);
      if (prescription.pharmacy.address) doc.text(`Address: ${prescription.pharmacy.address}`);
      if (prescription.pharmacy.phone) doc.text(`Phone: ${prescription.pharmacy.phone}`);
      doc.moveDown();
    }
    
    // Notes
    if (prescription.notes && Object.keys(prescription.notes).length > 0) {
      doc.fontSize(14).text('Notes');
      if (prescription.notes.patientNotes) {
        doc.fontSize(12).text(`For Patient: ${prescription.notes.patientNotes}`);
      }
      if (prescription.notes.pharmacistNotes) {
        doc.fontSize(12).text(`For Pharmacist: ${prescription.notes.pharmacistNotes}`);
      }
      doc.moveDown();
    }
    
    // Signature
    doc.fontSize(14).text('Doctor Signature');
    if (prescription.eSignature && prescription.eSignature.signed) {
      doc.fontSize(12).text(`Digitally signed by Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`);
      doc.text(`Date: ${new Date(prescription.eSignature.signedAt).toLocaleDateString()}`);
    } else {
      doc.fontSize(12).text('Not signed');
    }
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating prescription PDF',
      error: error.message
    });
  }
};