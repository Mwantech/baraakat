import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './DoctorPrescriptions.module.css';

const DoctorPrescription = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const { prescriptionId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [medications, setMedications] = useState([{ 
    name: '', 
    dosage: '', 
    frequency: '', 
    duration: '', 
    notes: ''
  }]);
  const [pharmacy, setPharmacy] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [notes, setNotes] = useState({
    patientNotes: '',
    pharmacistNotes: ''
  });
  const [refillable, setRefillable] = useState(false);
  const [refillsRemaining, setRefillsRemaining] = useState(0);
  const [signed, setSigned] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ type: '', message: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    patientId: '',
    status: '',
    startDate: '',
    endDate: '',
    medicationName: ''
  });
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isProcessRefillDialogOpen, setIsProcessRefillDialogOpen] = useState(false);
  const [refillRequestToProcess, setRefillRequestToProcess] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    patientName: '',
    status: '',
    startDate: '',
    endDate: '',
    medicationName: ''
  });

  useEffect(() => {
    // Check if user is authenticated and is a doctor
    if (!currentUser || userRole !== 'doctor') {
      navigate('/login');
      return;
    }

    // Fetch patients
    fetchPatients();
    
    // Fetch doctor's prescriptions
    fetchPrescriptions();
    
    // If editing existing prescription
    if (prescriptionId) {
      setIsEditMode(true);
      fetchPrescriptionDetails(prescriptionId);
    }
  }, [currentUser, userRole, navigate, prescriptionId]);

  // Filter patients based on search term
  useEffect(() => {
    if (patientSearchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.user.firstName} ${patient.user.lastName}`.toLowerCase();
        return fullName.includes(patientSearchTerm.toLowerCase());
      });
      setFilteredPatients(filtered);
    }
  }, [patientSearchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/patients/');
      setPatients(response.data.data);
      setFilteredPatients(response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setAlertMessage({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to fetch patients' 
      });
      setIsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/prescriptions/doctor/list');
      setPrescriptions(response.data.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrescriptionDetails = async (id) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/prescriptions/${id}`);
      const prescription = response.data.data;
      
      // Set all form state based on the prescription
      setSelectedPatient(prescription.patient._id);
      setMedications(prescription.medications);
      setPharmacy(prescription.pharmacy || { name: '', address: '', phone: '' });
      setNotes(prescription.notes || { patientNotes: '', pharmacistNotes: '' });
      setRefillable(prescription.refillable || false);
      setRefillsRemaining(prescription.refillsRemaining || 0);
      setSigned(prescription.signed || false);
      
    } catch (err) {
      console.error('Error fetching prescription details:', err);
      setAlertMessage({
        type: 'error',
        message: 'Failed to load prescription details. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPrescription = async (prescriptionId) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      setSelectedPrescription(response.data.data);
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error('Error fetching prescription details:', err);
      setError('Failed to load prescription details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token'); // Or use getToken() consistently
      
      const response = await fetch(`${api.defaults.baseURL}/prescriptions/${prescriptionId}/download`, {
        headers: {
          'x-auth-token': token, // Changed from 'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download prescription. Please try again later.');
    }
  };

  const handleProcessRefill = async (prescriptionId, refillId, status) => {
    try {
      await api.post('/prescriptions/refill/process', {
        prescriptionId,
        refillId,
        status
      });
      
      setIsProcessRefillDialogOpen(false);
      fetchPrescriptions(); // Refresh data
      
      // Update the current selected prescription if still open
      if (isViewDialogOpen && selectedPrescription) {
        const updatedPrescription = await api.get(`/prescriptions/${selectedPrescription._id}`);
        setSelectedPrescription(updatedPrescription.data.data);
      }
    } catch (err) {
      console.error('Error processing refill:', err);
      setError('Failed to process refill request. Please try again later.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setAlertMessage({ type: 'error', message: 'Please select a patient' });
      return;
    }
    
    // Validate at least one medication is entered properly
    if (!medications[0].name || !medications[0].dosage || !medications[0].frequency) {
      setAlertMessage({ type: 'error', message: 'Please enter medication details' });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Calculate end date based on the medication with the longest duration
      let maxDuration = 30; // Default to 30 days if no duration specified
      medications.forEach(med => {
        if (med.duration) {
          // Extract days from duration (assuming format like "7 days", "2 weeks", etc.)
          const durationMatch = med.duration.match(/\d+/);
          if (durationMatch) {
            const days = parseInt(durationMatch[0]);
            // Convert weeks to days if duration contains "week"
            const multiplier = med.duration.toLowerCase().includes('week') ? 7 : 1;
            const totalDays = days * multiplier;
            
            if (totalDays > maxDuration) {
              maxDuration = totalDays;
            }
          }
        }
      });
      
      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + maxDuration);
      
      const prescriptionData = {
        patientId: selectedPatient,
        medications,
        pharmacy,
        notes,
        refillable,
        refillsRemaining: refillable ? refillsRemaining : 0,
        signed,
        endDate: endDate // Add the calculated end date
      };
      
      let response;
      if (isEditMode) {
        response = await api.put(`/prescriptions/${prescriptionId}`, prescriptionData);
      } else {
        response = await api.post('/prescriptions', prescriptionData);
      }
      
      setAlertMessage({
        type: 'success',
        message: isEditMode ? 'Prescription updated successfully' : 'Prescription created successfully'
      });
      
      // Reset form or redirect
      if (!isEditMode) {
        resetForm();
      }
      
      // Refresh prescription list
      fetchPrescriptions();
      
    } catch (error) {
      console.error('Error saving prescription:', error);
      setAlertMessage({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save prescription'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setMedications([{
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    }]);
    setPharmacy({
      name: '',
      address: '',
      phone: ''
    });
    setNotes({
      patientNotes: '',
      pharmacistNotes: ''
    });
    setRefillable(false);
    setRefillsRemaining(0);
    setSigned(false);
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveMedication = (index) => {
    if (medications.length > 1) {
      const updatedMedications = [...medications];
      updatedMedications.splice(index, 1);
      setMedications(updatedMedications);
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setMedications(updatedMedications);
  };

  const handlePharmacyChange = (field, value) => {
    setPharmacy({
      ...pharmacy,
      [field]: value
    });
  };

  const handleNotesChange = (field, value) => {
    setNotes({
      ...notes,
      [field]: value
    });
  };

  const handleFilterChange = (field, value) => {
    setFilterOptions({
      ...filterOptions,
      [field]: value
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    // Apply filters logic here
    // This could update a separate state or directly filter the prescriptions
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilterOptions({
      patientId: '',
      status: '',
      startDate: '',
      endDate: '',
      medicationName: ''
    });
  };

  const handleGeneratePDF = (id) => {
    handleDownloadPDF(id);
  };

  const getStatusBadge = (status) => {
    let badgeClass;
    switch (status) {
      case 'active':
        badgeClass = styles.badgeGreen;
        break;
      case 'completed':
        badgeClass = styles.badgeBlue;
        break;
      case 'expired':
        badgeClass = styles.badgeGray;
        break;
      default:
        badgeClass = styles.badge;
    }
    
    return <span className={`${styles.badge} ${badgeClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Apply filters and search
  const filteredPrescriptions = prescriptions.filter(prescription => {
    // Filter by tab first
    if (activeTab !== 'all' && prescription.status !== activeTab) {
      return false;
    }
    
    // Search functionality - search in patient name and medication names
    if (searchTerm) {
      const patientName = `${prescription.patient?.user?.firstName} ${prescription.patient?.user?.lastName}`.toLowerCase();
      const medicationNames = prescription.medications.map(med => med.name.toLowerCase()).join(' ');
      const searchLower = searchTerm.toLowerCase();
      
      if (!patientName.includes(searchLower) && !medicationNames.includes(searchLower)) {
        return false;
      }
    }
    
    // Apply advanced filters
    if (filters.patientName) {
      const patientName = `${prescription.patient?.user?.firstName} ${prescription.patient?.user?.lastName}`.toLowerCase();
      if (!patientName.includes(filters.patientName.toLowerCase())) {
        return false;
      }
    }
    
    if (filters.medicationName) {
      const hasMedication = prescription.medications.some(med => 
        med.name.toLowerCase().includes(filters.medicationName.toLowerCase())
      );
      if (!hasMedication) {
        return false;
      }
    }
    
    if (filters.status && prescription.status !== filters.status) {
      return false;
    }
    
    if (filters.startDate) {
      const prescriptionDate = new Date(prescription.startDate);
      const filterDate = new Date(filters.startDate);
      if (prescriptionDate < filterDate) {
        return false;
      }
    }
    
    if (filters.endDate) {
      const prescriptionDate = new Date(prescription.startDate);
      const filterDate = new Date(filters.endDate);
      if (prescriptionDate > filterDate) {
        return false;
      }
    }
    
    return true;
  });

  // Check for pending refill requests
  const getPendingRefillCount = () => {
    return prescriptions.reduce((count, prescription) => {
      const pendingRefills = prescription.refillHistory?.filter(refill => refill.status === 'pending') || [];
      return count + pendingRefills.length;
    }, 0);
  };

  const pendingRefillCount = getPendingRefillCount();

  const resetFilters = () => {
    setFilters({
      patientName: '',
      status: '',
      startDate: '',
      endDate: '',
      medicationName: ''
    });
    setIsFilterOpen(false);
  };

  if (isLoading && prescriptions.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>
        {isEditMode ? 'Edit Prescription' : 'Create New Prescription'}
      </h1>
      
      {alertMessage.message && (
        <div className={`${styles.alert} ${styles[alertMessage.type]}`}>
          {alertMessage.message}
          <button 
            className={styles.closeBtn} 
            onClick={() => setAlertMessage({ type: '', message: '' })}
          >
            &times;
          </button>
        </div>
      )}
      
      <div className={styles.contentWrapper}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit} className={styles.prescriptionForm}>
            <div className={styles.formGroup}>
              <label htmlFor="patient">Patient</label>
              <div className={styles.searchPatientContainer}>
                <input
                  type="text"
                  placeholder="Search patient by name..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <div className={patientSearchTerm ? styles.patientDropdown : styles.hidden}>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <div 
                        key={patient._id} 
                        className={styles.patientOption}
                        onClick={() => {
                          setSelectedPatient(patient._id);
                          setPatientSearchTerm(`${patient.user.firstName} ${patient.user.lastName}`);
                        }}
                      >
                        {patient.user.firstName} {patient.user.lastName}
                      </div>
                    ))
                  ) : (
                    <div className={styles.noResults}>No patients found</div>
                  )}
                </div>
              </div>
              {selectedPatient && (
                <div className={styles.selectedPatientBadge}>
                  {patients.find(p => p._id === selectedPatient)?.user.firstName} {patients.find(p => p._id === selectedPatient)?.user.lastName}
                  <button
                    type="button"
                    className={styles.removePatientBtn}
                    onClick={() => {
                      setSelectedPatient('');
                      setPatientSearchTerm('');
                    }}
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
            
            <h3>Medications</h3>
            {medications.map((medication, index) => (
              <div key={index} className={styles.medicationCard}>
                <div className={styles.medicationHeader}>
                  <h4>Medication {index + 1}</h4>
                  {medications.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveMedication(index)}
                      className={styles.removeBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className={styles.medicationFields}>
                  <div className={styles.formGroup}>
                    <label htmlFor={`med-name-${index}`}>Name</label>
                    <input
                      type="text"
                      id={`med-name-${index}`}
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className={styles.formControl}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor={`med-dosage-${index}`}>Dosage</label>
                    <input
                      type="text"
                      id={`med-dosage-${index}`}
                      value={medication.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className={styles.formControl}
                      required
                      placeholder="e.g., 10mg"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor={`med-frequency-${index}`}>Frequency</label>
                    <input
                      type="text"
                      id={`med-frequency-${index}`}
                      value={medication.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      className={styles.formControl}
                      required
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor={`med-duration-${index}`}>Duration (days)</label>
                    <input
                      type="number"
                      id={`med-duration-${index}`}
                      value={medication.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      className={styles.formControl}
                      min="1"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor={`med-notes-${index}`}>Special Instructions</label>
                    <textarea
                      id={`med-notes-${index}`}
                      value={medication.notes}
                      onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
                      className={styles.formControl}
                      rows="2"
                      placeholder="Take with food, etc."
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={handleAddMedication} 
              className={styles.addBtn}
            >
              + Add Another Medication
            </button>
            
            <div className={styles.sectionDivider}></div>
            
            <h3>Pharmacy Information</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="pharmacy-name">Pharmacy Name</label>
                <input
                  type="text"
                  id="pharmacy-name"
                  value={pharmacy.name}
                  onChange={(e) => handlePharmacyChange('name', e.target.value)}
                  className={styles.formControl}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="pharmacy-phone">Pharmacy Phone</label>
                <input
                  type="text"
                  id="pharmacy-phone"
                  value={pharmacy.phone}
                  onChange={(e) => handlePharmacyChange('phone', e.target.value)}
                  className={styles.formControl}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="pharmacy-address">Pharmacy Address</label>
              <input
                type="text"
                id="pharmacy-address"
                value={pharmacy.address}
                onChange={(e) => handlePharmacyChange('address', e.target.value)}
                className={styles.formControl}
              />
            </div>
            
            <div className={styles.sectionDivider}></div>
            
            <h3>Additional Notes</h3>
            <div className={styles.formGroup}>
              <label htmlFor="patient-notes">Notes for Patient</label>
              <textarea
                id="patient-notes"
                value={notes.patientNotes}
                onChange={(e) => handleNotesChange('patientNotes', e.target.value)}
                className={styles.formControl}
                rows="3"
              ></textarea>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="pharmacist-notes">Notes for Pharmacist</label>
              <textarea
                id="pharmacist-notes"
                value={notes.pharmacistNotes}
                onChange={(e) => handleNotesChange('pharmacistNotes', e.target.value)}
                className={styles.formControl}
                rows="3"
              ></textarea>
            </div>
            
            <div className={styles.sectionDivider}></div>
            
            <h3>Refill Information</h3>
            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="refillable"
                  checked={refillable}
                  onChange={(e) => setRefillable(e.target.checked)}
                />
                <label htmlFor="refillable">Refillable</label>
              </div>
            </div>
            
            {refillable && (
              <div className={styles.formGroup}>
                <label htmlFor="refills">Number of Refills</label>
                <input
                  type="number"
                  id="refills"
                  value={refillsRemaining}
                  onChange={(e) => setRefillsRemaining(parseInt(e.target.value))}
                  className={styles.formControl}
                  min="0"
                  max="12"
                />
              </div>
            )}
            
            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="signed"
                  checked={signed}
                  onChange={(e) => setSigned(e.target.checked)}
                />
                <label htmlFor="signed">Digitally Sign Prescription</label>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                onClick={() => navigate('/prescriptions')}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')} Prescription
              </button>
            </div>
          </form>
        </div>
        
        <div className={styles.listSection}>
          <h2>My Prescriptions</h2>
          
          <div className={styles.filterCard}>
            <h3>Filter Prescriptions</h3>
            <form onSubmit={handleApplyFilters} className={styles.filterForm}>
              <div className={styles.filterRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="filter-patient">Patient</label>
                  <select
                    id="filter-patient"
                    value={filterOptions.patientId}
                    onChange={(e) => handleFilterChange('patientId', e.target.value)}
                    className={styles.formControl}
                  >
                    <option value="">All Patients</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.user.firstName} {patient.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="filter-status">Status</label>
                  <select
                    id="filter-status"
                    value={filterOptions.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={styles.formControl}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.filterRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="filter-start-date">Start Date</label>
                  <input
                    type="date"
                    id="filter-start-date"
                    value={filterOptions.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className={styles.formControl}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="filter-end-date">End Date</label>
                  <input
                    type="date"
                    id="filter-end-date"
                    value={filterOptions.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className={styles.formControl}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="filter-medication">Medication Name</label>
                <input
                  type="text"
                  id="filter-medication"
                  value={filterOptions.medicationName}
                  onChange={(e) => handleFilterChange('medicationName', e.target.value)}
                  className={styles.formControl}
                  placeholder="Search by medication name"
                />
              </div>
              
              <div className={styles.filterActions}>
                <button type="button" onClick={handleResetFilters} className={styles.resetBtn}>
                  Reset
                </button>
                <button type="submit" className={styles.applyBtn}>
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
          
          {isLoading ? (
            <div className={styles.loadingState}>Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className={styles.emptyState}>No prescriptions found</div>
          ) : (
            <div className={styles.prescriptionsList}>
              {prescriptions.map((prescription) => (
                <div key={prescription._id} className={styles.prescriptionCard}>
                  <div className={styles.prescriptionHeader}>
                    <h3>
                      {prescription.patient.user.firstName} {prescription.patient.user.lastName}
                    </h3>
                    <span className={`${styles.statusBadge} ${styles[prescription.status]}`}>
                      {prescription.status}
                    </span>
                  </div>
                  
                  <div className={styles.prescriptionMeds}>
                    <strong>Medications:</strong>
                    <ul>
                      {prescription.medications.map((med, index) => (
                        <li key={index}>
                          {med.name} - {med.dosage} ({med.frequency})
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.prescriptionDetails}>
                    <div>
                      <strong>Date:</strong> {new Date(prescription.startDate).toLocaleDateString()}
                    </div>
                    {prescription.refillable && (
                      <div>
                        <strong>Refills:</strong> {prescription.refillsRemaining} remaining
                      </div>
                    )}
                  </div>
                  
                  {prescription.refillHistory && prescription.refillHistory.some(refill => refill.status === 'pending') && (
                    <div className={styles.refillRequest}>
                      <div className={styles.refillAlert}>Refill Request Pending</div>
                      {prescription.refillHistory
                        .filter(refill => refill.status === 'pending')
                        .map((refill, index) => (
                          <div key={index} className={styles.refillActions}>
                            <span>Requested: {new Date(refill.requestDate).toLocaleDateString()}</span>
                            <div>
                              <button
                                onClick={() => handleProcessRefill(prescription._id, refill._id, 'approved')}
                                className={styles.approveBtn}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessRefill(prescription._id, refill._id, 'rejected')}
                                className={styles.rejectBtn}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  
                  <div className={styles.prescriptionActions}>
                    <button
                      onClick={() => navigate(`/prescriptions/edit/${prescription._id}`)}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleGeneratePDF(prescription._id)}
                      className={styles.pdfBtn}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescription;