// controllers/medicalRecordsController.js
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const mongoose = require('mongoose');

// Helper function to check if ObjectId is valid
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to automatically generate medical record from patient data and prescriptions
// Exported so it can be called directly from routes
const generateMedicalRecord = async (patientId, doctorId, appointmentId = null) => {
  try {
    // Get patient profile data
    const patient = await Patient.findById(patientId)
      .populate('user', 'firstName lastName');
    
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    // Get active prescriptions for this patient
    const activePrescriptions = await Prescription.find({
      patient: patientId,
      status: 'active'
    }).populate('doctor', 'firstName lastName');
    
    // Create a basic medical record using patient profile data
    const newRecord = new MedicalRecord({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId,
      visitDate: Date.now(),
      chiefComplaint: "Routine checkup",
      vitalSigns: {
        temperature: {
          value: 98.6,
          unit: "°F"
        },
        bloodPressure: {
          value: "120/80",
          unit: "mmHg"
        },
        heartRate: 72,
        respiratoryRate: 16
      },
      symptoms: [],
      diagnosis: [],
      treatment: "To be determined during consultation",
      followUp: null,
      notes: {
        doctorNotes: `Initial record generated automatically based on patient profile. `
      }
    });
    
    // If patient has medical history, add it to the record
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      newRecord.notes.doctorNotes += `Patient has history of: ${patient.medicalHistory.join(', ')}. `;
      
      // If there are chronic conditions in medical history, add them to diagnosis
      const chronicConditions = patient.medicalHistory.filter(condition => 
        /chronic|diabetes|hypertension|asthma|arthritis|copd|cancer/i.test(condition)
      );
      
      if (chronicConditions.length > 0) {
        chronicConditions.forEach(condition => {
          newRecord.diagnosis.push({
            name: condition,
            icd10Code: '', // Would require a mapping service in production
            type: 'chronic'
          });
        });
      }
    }
    
    // If patient has allergies, add them to the record
    if (patient.allergies && patient.allergies.length > 0) {
      newRecord.notes.doctorNotes += `Patient allergies: ${patient.allergies.join(', ')}. `;
    }
    
    // Add prescription information to the record
    if (activePrescriptions.length > 0) {
      newRecord.notes.doctorNotes += `Current medications: `;
      
      activePrescriptions.forEach((prescription, index) => {
        // Add medication details to the notes
        newRecord.notes.doctorNotes += `${prescription.medication} (${prescription.dosage}, ${prescription.frequency})`;
        
        // Add comma separator except for the last item
        if (index < activePrescriptions.length - 1) {
          newRecord.notes.doctorNotes += ', ';
        }
        
        // Enhance treatment field with prescription details
        if (newRecord.treatment === "To be determined during consultation") {
          newRecord.treatment = "Continue current medication regimen: ";
        } else {
          newRecord.treatment += ", continue with: ";
        }
        
        newRecord.treatment += `${prescription.medication} as prescribed`;
      });
      
      newRecord.notes.doctorNotes += '. ';
    }
    
    await newRecord.save();
    return newRecord;
  } catch (error) {
    console.error('Error generating medical record:', error);
    throw error;
  }
};

// Function to update medical records when patient model or prescriptions change
const updateMedicalRecordsOnModelChange = async (patientId) => {
  try {
    // Find the most recent medical record for this patient
    const latestRecord = await MedicalRecord.findOne({
      patient: patientId,
      isDeleted: false
    }).sort({ visitDate: -1 });
    
    if (!latestRecord) {
      // If no record exists, no need to update
      return null;
    }
    
    // Get latest patient data
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    // Get current prescriptions
    const activePrescriptions = await Prescription.find({
      patient: patientId,
      status: 'active'
    });
    
    // Check if medical record needs updating
    let needsUpdate = false;
    let updatedNotes = latestRecord.notes.doctorNotes;
    
    // Check for medical history changes
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      const currentHistoryNote = `Patient has history of: ${patient.medicalHistory.join(', ')}`;
      
      if (!updatedNotes.includes('Patient has history of:')) {
        // Add medical history if it doesn't exist
        updatedNotes += `${currentHistoryNote}. `;
        needsUpdate = true;
      } else {
        // Update existing medical history note
        const historyRegex = /Patient has history of: ([^.]+)\./;
        const match = updatedNotes.match(historyRegex);
        
        if (match && match[1] !== patient.medicalHistory.join(', ')) {
          updatedNotes = updatedNotes.replace(
            historyRegex,
            `Patient has history of: ${patient.medicalHistory.join(', ')}.`
          );
          needsUpdate = true;
        }
      }
    }
    
    // Check for allergies changes
    if (patient.allergies && patient.allergies.length > 0) {
      const currentAllergiesNote = `Patient allergies: ${patient.allergies.join(', ')}`;
      
      if (!updatedNotes.includes('Patient allergies:')) {
        // Add allergies if they don't exist
        updatedNotes += `${currentAllergiesNote}. `;
        needsUpdate = true;
      } else {
        // Update existing allergies note
        const allergiesRegex = /Patient allergies: ([^.]+)\./;
        const match = updatedNotes.match(allergiesRegex);
        
        if (match && match[1] !== patient.allergies.join(', ')) {
          updatedNotes = updatedNotes.replace(
            allergiesRegex,
            `Patient allergies: ${patient.allergies.join(', ')}.`
          );
          needsUpdate = true;
        }
      }
    }
    
    // Check for prescription changes
    const currentMedications = activePrescriptions.map(p => 
      `${p.medication} (${p.dosage}, ${p.frequency})`
    ).join(', ');
    
    if (activePrescriptions.length > 0) {
      if (!updatedNotes.includes('Current medications:')) {
        // Add medications if they don't exist
        updatedNotes += `Current medications: ${currentMedications}. `;
        needsUpdate = true;
      } else {
        // Update existing medications note
        const medicationsRegex = /Current medications: ([^.]+)\./;
        const match = updatedNotes.match(medicationsRegex);
        
        if (match && match[1] !== currentMedications) {
          updatedNotes = updatedNotes.replace(
            medicationsRegex,
            `Current medications: ${currentMedications}.`
          );
          needsUpdate = true;
        }
      }
    }
    
    // Update the record if needed
    if (needsUpdate) {
      latestRecord.notes.doctorNotes = updatedNotes;
      await latestRecord.save();
      return latestRecord;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating medical records on model change:', error);
    throw error;
  }
};

const medicalRecordsController = {
  // Export the generate function so it can be used directly from routes
  generateMedicalRecord,
  
  // Export the update function for use when models change
  updateMedicalRecordsOnModelChange,
  
  // Get all medical records for a specific patient
  getPatientRecords: async (req, res) => {
    try {
      const { patientId } = req.params;
      
      if (!isValidObjectId(patientId)) {
        return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
      }

      // Check if patient exists
      const patientExists = await Patient.exists({ _id: patientId });
      if (!patientExists) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      
      // For patient users, they should only see their own records
      if (req.userRole === 'patient') {
        const patient = await Patient.findOne({ user: req.userId });
        if (!patient || patient._id.toString() !== patientId) {
          return res.status(403).json({ success: false, message: 'Access denied to these medical records' });
        }
      }

      const medicalRecords = await MedicalRecord.find({ 
        patient: patientId,
        isDeleted: false
      })
      .populate('doctor', 'firstName lastName')
      .populate('appointment', 'appointmentDate startTime')
      .sort({ visitDate: -1 });

      // If records exist, check if we need to update the latest record based on model changes
      if (medicalRecords.length > 0) {
        try {
          const updatedRecord = await updateMedicalRecordsOnModelChange(patientId);
          if (updatedRecord) {
            // If a record was updated, refresh the records list
            const refreshedRecords = await MedicalRecord.find({ 
              patient: patientId,
              isDeleted: false
            })
            .populate('doctor', 'firstName lastName')
            .populate('appointment', 'appointmentDate startTime')
            .sort({ visitDate: -1 });
            
            return res.json({ 
              success: true, 
              data: refreshedRecords,
              message: 'Medical records retrieved. Latest record was updated with new patient information.'
            });
          }
        } catch (updateError) {
          console.error('Error updating records based on model changes:', updateError);
          // Continue with existing records even if update fails
        }
      }
      
      // If no records found, generate one automatically
      // This happens regardless of user role to ensure records always exist
      if (medicalRecords.length === 0) {
        try {
          // Use the doctor ID from request or a default admin doctor ID
          const doctorId = req.doctorId || req.userId;
          const newRecord = await generateMedicalRecord(patientId, doctorId);
          return res.json({ 
            success: true, 
            data: [newRecord],
            message: 'No existing records found. A basic record has been generated.' 
          });
        } catch (genError) {
          console.error('Error in auto-generation:', genError);
          // If auto-generation fails, still return empty array
          return res.json({ success: true, data: [], message: 'No records found and auto-generation failed.' });
        }
      }

      res.json({ success: true, data: medicalRecords });
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching medical records' });
    }
  },

  // Get a specific medical record by ID
  getRecordById: async (req, res) => {
    try {
      const { recordId } = req.params;
      
      if (!isValidObjectId(recordId)) {
        return res.status(400).json({ success: false, message: 'Invalid record ID format' });
      }

      const medicalRecord = await MedicalRecord.findOne({
        _id: recordId,
        isDeleted: false
      })
      .populate('doctor', 'firstName lastName')
      .populate('patient', 'user')
      .populate('appointment', 'appointmentDate startTime endTime');

      if (!medicalRecord) {
        return res.status(404).json({ success: false, message: 'Medical record not found' });
      }

      // If user is patient, check if they own this record
      if (req.userRole === 'patient') {
        const patient = await Patient.findOne({ user: req.userId });
        if (!patient || medicalRecord.patient._id.toString() !== patient._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied to this medical record' });
        }
      }

      res.json({ success: true, data: medicalRecord });
    } catch (error) {
      console.error('Error fetching medical record:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching medical record' });
    }
  },

  // Update an existing medical record
  updateRecord: async (req, res) => {
    try {
      const { recordId } = req.params;
      const updateData = req.body;
      
      if (!isValidObjectId(recordId)) {
        return res.status(400).json({ success: false, message: 'Invalid record ID format' });
      }

      const medicalRecord = await MedicalRecord.findById(recordId);
      if (!medicalRecord) {
        return res.status(404).json({ success: false, message: 'Medical record not found' });
      }

      // For patient users, they should only update their own records and only the attachments field
      if (req.userRole === 'patient') {
        const patient = await Patient.findOne({ user: req.userId });
        if (!patient || medicalRecord.patient.toString() !== patient._id.toString()) {
          return res.status(403).json({ success: false, message: 'Not authorized to update this record' });
        }

        // Patients can only add attachments to their records
        if (updateData.attachments) {
          // Add new attachments to the existing array
          medicalRecord.attachments = [...(medicalRecord.attachments || []), ...updateData.attachments];
        } else {
          return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }
      } else if (req.userRole === 'doctor' || req.userRole === 'admin') {
        // Doctors can update most fields
        const allowedFields = [
          'chiefComplaint', 'vitalSigns', 'symptoms', 'diagnosis', 
          'treatment', 'followUp', 'notes', 'attachments'
        ];
        
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            medicalRecord[field] = updateData[field];
          }
        });
      }

      await medicalRecord.save();
      res.json({ success: true, data: medicalRecord, message: 'Medical record updated successfully' });
    } catch (error) {
      console.error('Error updating medical record:', error);
      res.status(500).json({ success: false, message: 'Server error while updating medical record' });
    }
  },

  // Soft delete a medical record (mark as deleted)
  deleteRecord: async (req, res) => {
    try {
      const { recordId } = req.params;
      
      if (!isValidObjectId(recordId)) {
        return res.status(400).json({ success: false, message: 'Invalid record ID format' });
      }

      const medicalRecord = await MedicalRecord.findById(recordId);
      if (!medicalRecord) {
        return res.status(404).json({ success: false, message: 'Medical record not found' });
      }

      // Only doctors and admins can delete records
      if (!['doctor', 'admin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete medical records' });
      }

      // Soft delete
      medicalRecord.isDeleted = true;
      await medicalRecord.save();

      res.json({ success: true, message: 'Medical record deleted successfully' });
    } catch (error) {
      console.error('Error deleting medical record:', error);
      res.status(500).json({ success: false, message: 'Server error while deleting medical record' });
    }
  },

  // Get medical records summary for patient dashboard
  getPatientRecordsSummary: async (req, res) => {
    try {
      let patientId = req.params.patientId || null;
      
      if (!patientId && req.userRole === 'patient') {
        // Find patient ID from user ID if not provided
        const patient = await Patient.findOne({ user: req.userId });
        if (!patient) {
          return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        patientId = patient._id;
      }
      
      if (!isValidObjectId(patientId)) {
        return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
      }

      // For patient users, they should only see their own records
      if (req.userRole === 'patient') {
        const patient = await Patient.findOne({ user: req.userId });
        if (!patient || patient._id.toString() !== patientId) {
          return res.status(403).json({ success: false, message: 'Access denied to these medical records' });
        }
      }

      // First check if records exist, if not generate one
      const recordCount = await MedicalRecord.countDocuments({
        patient: patientId,
        isDeleted: false
      });
      
      // Auto-generate a record if none exist
      if (recordCount === 0) {
        try {
          const doctorId = req.doctorId || req.userId;
          await generateMedicalRecord(patientId, doctorId);
        } catch (genError) {
          console.error('Error auto-generating record in summary:', genError);
          // Continue with summary even if generation fails
        }
      } else {
        // If records exist, check if we need to update based on model changes
        try {
          await updateMedicalRecordsOnModelChange(patientId);
        } catch (updateError) {
          console.error('Error updating records based on model changes:', updateError);
          // Continue with summary even if update fails
        }
      }

      // Get last 5 records
      const recentRecords = await MedicalRecord.find({ 
        patient: patientId, 
        isDeleted: false 
      })
      .sort({ visitDate: -1 })
      .limit(5)
      .select('visitDate chiefComplaint diagnosis')
      .populate('doctor', 'firstName lastName');

      // Get active prescriptions
      const activePrescriptions = await Prescription.find({
        patient: patientId,
        status: 'active'
      })
      .populate('doctor', 'firstName lastName')
      .sort({ startDate: -1 });

      // Get diagnosis frequency
      const allRecords = await MedicalRecord.find({ 
        patient: patientId, 
        isDeleted: false 
      });
      
      const diagnosisCounts = {};
      allRecords.forEach(record => {
        if (record.diagnosis && record.diagnosis.length) {
          record.diagnosis.forEach(diag => {
            if (diag.name) {
              diagnosisCounts[diag.name] = (diagnosisCounts[diag.name] || 0) + 1;
            }
          });
        }
      });

      // Sort by frequency
      const commonDiagnoses = Object.entries(diagnosisCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      res.json({ 
        success: true, 
        data: {
          recentRecords,
          activePrescriptions,
          commonDiagnoses,
          totalRecords: allRecords.length
        } 
      });
    } catch (error) {
      console.error('Error fetching patient records summary:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching patient records summary' });
    }
  },

  // Search patient records
  searchPatientRecords: async (req, res) => {
    try {
      const { patientId } = req.params;
      const { query, startDate, endDate, diagnosis } = req.query;
      
      if (!isValidObjectId(patientId)) {
        return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
      }

      // For patient users, they should only search their own records
      if (req.userRole === 'patient') {
        const patient = await Patient.findOne({ user: req.userId });
        if (!patient || patient._id.toString() !== patientId) {
          return res.status(403).json({ success: false, message: 'Access denied to these medical records' });
        }
      }

      // Build search criteria
      const searchCriteria = { patient: patientId, isDeleted: false };
      
      // Add date range if provided
      if (startDate || endDate) {
        searchCriteria.visitDate = {};
        if (startDate) searchCriteria.visitDate.$gte = new Date(startDate);
        if (endDate) searchCriteria.visitDate.$lte = new Date(endDate);
      }

      // Add text search if provided
      if (query) {
        searchCriteria.$or = [
          { chiefComplaint: { $regex: query, $options: 'i' } },
          { symptoms: { $in: [new RegExp(query, 'i')] } },
          { 'notes.doctorNotes': { $regex: query, $options: 'i' } }
        ];
      }

      // Add diagnosis search if provided
      if (diagnosis) {
        searchCriteria['diagnosis.name'] = { $regex: diagnosis, $options: 'i' };
      }

      const records = await MedicalRecord.find(searchCriteria)
        .populate('doctor', 'firstName lastName')
        .sort({ visitDate: -1 });

      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Error searching patient records:', error);
      res.status(500).json({ success: false, message: 'Server error while searching patient records' });
    }
  }
};

module.exports = medicalRecordsController;