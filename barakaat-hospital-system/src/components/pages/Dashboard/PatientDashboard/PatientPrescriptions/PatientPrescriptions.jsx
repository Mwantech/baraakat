import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import { AlertCircle, FileText, RefreshCw, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import styles from './PatientPrescriptions.module.css';

const PatientPrescriptions = () => {
  const { currentUser, getToken } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRefillDialogOpen, setIsRefillDialogOpen] = useState(false);
  const [refillMessage, setRefillMessage] = useState('');
  const [refillStatus, setRefillStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchPrescriptions();
  }, [currentUser]);

  // In PatientPrescriptions.jsx - Update fetchPrescriptions function
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken(); // You're already importing getToken from useAuth
      const response = await api.get('/prescriptions/patient/list', {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'x-auth-token': token // Include both formats to be safe
        }
      });
      setPrescriptions(response.data.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = async (prescriptionId) => {
    try {
      setLoading(true);
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      setSelectedPrescription(response.data.data);
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error('Error fetching prescription details:', err);
      setError('Failed to load prescription details. Please try again later.');
    } finally {
      setLoading(false);
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

  const handleRequestRefill = async (prescriptionId) => {
    try {
      const response = await api.post(`/prescriptions/${prescriptionId}/refill`);
      setRefillStatus('success');
      setRefillMessage('Refill request submitted successfully!');
      
      // Refresh prescriptions list to update status
      fetchPrescriptions();
    } catch (err) {
      console.error('Error requesting refill:', err);
      setRefillStatus('error');
      setRefillMessage(err.response?.data?.message || 'Failed to request refill. Please try again later.');
    } finally {
      setIsRefillDialogOpen(false);
    }
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

  // Filter prescriptions based on active tab
  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (activeTab === 'all') return true;
    return prescription.status === activeTab;
  });

  if (loading && prescriptions.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>My Prescriptions</h1>
      
      {error && (
        <div className={`${styles.alert} ${styles.alertDestructive}`}>
          <AlertCircle className={styles.alertIcon} />
          <span>{error}</span>
        </div>
      )}
      
      {refillStatus && (
        <div className={`${styles.alert} ${refillStatus === 'success' ? styles.alertSuccess : styles.alertDestructive}`}>
          {refillStatus === 'success' ? 
            <CheckCircle className={styles.alertIcon} /> : 
            <AlertCircle className={styles.alertIcon} />}
          <span>{refillMessage}</span>
        </div>
      )}
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'completed' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'expired' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('expired')}
        >
          Expired
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>
      
      {filteredPrescriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No prescriptions found in this category.</p>
        </div>
      ) : (
        <div className={styles.prescriptionsGrid}>
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleContainer}>
                  <h3 className={styles.cardTitle}>
                    {prescription.medications[0]?.name}
                    {prescription.medications.length > 1 && ` +${prescription.medications.length - 1} more`}
                  </h3>
                  {getStatusBadge(prescription.status)}
                </div>
                <p className={styles.cardDescription}>
                  Prescribed by: Dr. {prescription.doctor?.user?.firstName} {prescription.doctor?.user?.lastName}
                </p>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Start Date:</span>
                    <span>{formatDate(prescription.startDate)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>End Date:</span>
                    <span>{formatDate(prescription.endDate)}</span>
                  </div>
                  {prescription.refillable && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Refills Remaining:</span>
                      <span>{prescription.refillsRemaining}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <button 
                  className={styles.buttonOutline} 
                  onClick={() => handleViewPrescription(prescription._id)}
                >
                  <FileText className={styles.buttonIcon} /> View
                </button>
                <button 
                  className={styles.buttonOutline}
                  onClick={() => handleDownloadPDF(prescription._id)}
                >
                  <Download className={styles.buttonIcon} /> PDF
                </button>
                {prescription.status === 'active' && prescription.refillable && prescription.refillsRemaining > 0 && (
                  <button 
                    className={styles.buttonOutline}
                    onClick={() => {
                      setSelectedPrescription(prescription);
                      setIsRefillDialogOpen(true);
                    }}
                    disabled={prescription.refillHistory?.some(refill => refill.status === 'pending')}
                  >
                    <RefreshCw className={styles.buttonIcon} /> 
                    {prescription.refillHistory?.some(refill => refill.status === 'pending') 
                      ? 'Pending' 
                      : 'Refill'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* View Prescription Dialog */}
      {isViewDialogOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsViewDialogOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Prescription Details</h2>
              <button className={styles.closeButton} onClick={() => setIsViewDialogOpen(false)}>×</button>
            </div>
            
            {selectedPrescription && (
              <div className={styles.modalBody}>
                <div className={styles.sectionDivider}>
                  <h3 className={styles.sectionTitle}>Prescribed By</h3>
                  <p className={styles.sectionText}>
                    Dr. {selectedPrescription.doctor?.user?.firstName} {selectedPrescription.doctor?.user?.lastName}
                    {selectedPrescription.doctor?.specialization && ` (${selectedPrescription.doctor.specialization})`}
                  </p>
                </div>
                
                <div className={styles.sectionDivider}>
                  <h3 className={styles.sectionTitle}>Medications</h3>
                  <ul className={styles.medicationList}>
                    {selectedPrescription.medications.map((med, index) => (
                      <li key={index} className={styles.medicationItem}>
                        <div className={styles.medicationName}>{med.name}</div>
                        <div className={styles.medicationDetails}>
                          <div>Dosage: {med.dosage}</div>
                          <div>Frequency: {med.frequency}</div>
                          <div>Duration: {med.duration} days</div>
                          {med.notes && <div className={styles.medicationNote}>Note: {med.notes}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.sectionDivider}>
                  <div className={styles.detailsGrid}>
                    <div>
                      <span className={styles.detailLabel}>Start Date:</span>
                      <div>{formatDate(selectedPrescription.startDate)}</div>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>End Date:</span>
                      <div>{formatDate(selectedPrescription.endDate)}</div>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Status:</span>
                      <div>{getStatusBadge(selectedPrescription.status)}</div>
                    </div>
                    {selectedPrescription.refillable && (
                      <div>
                        <span className={styles.detailLabel}>Refills:</span>
                        <div>{selectedPrescription.refillsRemaining} remaining</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedPrescription.pharmacy && Object.keys(selectedPrescription.pharmacy).length > 0 && (
                  <div className={styles.sectionDivider}>
                    <h3 className={styles.sectionTitle}>Pharmacy</h3>
                    <div className={styles.pharmacyDetails}>
                      {selectedPrescription.pharmacy.name && <div>{selectedPrescription.pharmacy.name}</div>}
                      {selectedPrescription.pharmacy.address && <div>{selectedPrescription.pharmacy.address}</div>}
                      {selectedPrescription.pharmacy.phone && <div>Phone: {selectedPrescription.pharmacy.phone}</div>}
                    </div>
                  </div>
                )}
                
                {selectedPrescription.notes && (
                  <div className={styles.sectionDivider}>
                    <h3 className={styles.sectionTitle}>Notes</h3>
                    <div className={styles.notesSection}>
                      {selectedPrescription.notes.patientNotes && (
                        <div className={styles.patientNote}>{selectedPrescription.notes.patientNotes}</div>
                      )}
                      {selectedPrescription.notes.pharmacistNotes && (
                        <div className={styles.pharmacistNote}>For pharmacist: {selectedPrescription.notes.pharmacistNotes}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedPrescription.refillHistory && selectedPrescription.refillHistory.length > 0 && (
                  <div className={styles.sectionDivider}>
                    <h3 className={styles.sectionTitle}>Refill History</h3>
                    <ul className={styles.refillHistory}>
                      {selectedPrescription.refillHistory.map((refill, index) => (
                        <li key={index} className={styles.refillItem}>
                          {refill.status === 'pending' && <Clock className={styles.statusIconYellow} />}
                          {refill.status === 'approved' && <CheckCircle className={styles.statusIconGreen} />}
                          {refill.status === 'rejected' && <XCircle className={styles.statusIconRed} />}
                          <span>
                            {formatDate(refill.requestDate)} - {refill.status.charAt(0).toUpperCase() + refill.status.slice(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.modalFooter}>
              <button
                className={styles.buttonOutline}
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={() => handleDownloadPDF(selectedPrescription?._id)}
              >
                <Download className={styles.buttonIcon} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Refill Request Dialog */}
      {isRefillDialogOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsRefillDialogOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Request Prescription Refill</h2>
              <button className={styles.closeButton} onClick={() => setIsRefillDialogOpen(false)}>×</button>
            </div>
            
            {selectedPrescription && (
              <div className={styles.modalBody}>
                <p>
                  Are you sure you want to request a refill for:
                </p>
                <div className={styles.refillInfoBox}>
                  <div className={styles.medicationName}>
                    {selectedPrescription.medications[0]?.name}
                    {selectedPrescription.medications.length > 1 && ` +${selectedPrescription.medications.length - 1} more`}
                  </div>
                  <div className={styles.prescribedBy}>
                    Prescribed by Dr. {selectedPrescription.doctor?.user?.firstName} {selectedPrescription.doctor?.user?.lastName}
                  </div>
                  <div className={styles.refillsCount}>
                    Refills remaining: {selectedPrescription.refillsRemaining}
                  </div>
                </div>
                
                <p className={styles.refillDisclaimer}>
                  Your refill request will be sent to your doctor for approval. You will be notified once it's processed.
                </p>
              </div>
            )}
            
            <div className={styles.modalFooter}>
              <button
                className={styles.buttonOutline}
                onClick={() => setIsRefillDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={() => handleRequestRefill(selectedPrescription?._id)}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;