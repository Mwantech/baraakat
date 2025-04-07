import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import styles from './PatientmedicalRecords.module.css';

const MedicalRecords = () => {
  const { currentUser, userRole } = useAuth();
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [summary, setSummary] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);

  useEffect(() => {
    const fetchPatientId = async () => {
      if (userRole === 'patient') {
        try {
          // Fetch the patient profile to get the patient ID
          const response = await api.get('/profile/patient');
          if (response.data.patient) {
            setCurrentPatientId(response.data.patient._id);
          }
        } catch (err) {
          console.error('Error fetching patient profile:', err);
          setError(err.response?.data?.message || 'Failed to load patient profile');
        }
      }
    };
  
    fetchPatientId();
  }, [userRole]);

  // Determine the patient ID (use param or current patient's ID if patient)
  const effectivePatientId = patientId || currentPatientId;

  // Fetch records and summary when effectivePatientId is available
  useEffect(() => {
    const fetchData = async () => {
      if (!effectivePatientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [recordsResponse, summaryResponse] = await Promise.all([
          api.get(`/medical-records/patient/${effectivePatientId}`),
          api.get(`/medical-records/patient/${effectivePatientId}/summary`)
        ]);

        if (recordsResponse.data.success) {
          setRecords(recordsResponse.data.data);
        }
        
        if (summaryResponse.data.success) {
          setSummary(summaryResponse.data.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching medical records:', err);
        setError(err.response?.data?.message || 'Failed to load medical records');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [effectivePatientId]);

  // Handle record selection
  const handleSelectRecord = async (recordId) => {
    try {
      setLoading(true);
      const response = await api.get(`/medical-records/${recordId}`);
      if (response.data.success) {
        setSelectedRecord(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = dateRange;
      
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('query', searchQuery);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (diagnosisFilter) queryParams.append('diagnosis', diagnosisFilter);
      
      const response = await api.get(
        `/medical-records/patient/${effectivePatientId}/search?${queryParams.toString()}`
      );
      
      if (response.data.success) {
        setRecords(response.data.data);
        setSelectedRecord(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Reset search filters
  const resetFilters = async () => {
    setSearchQuery('');
    setDateRange({ startDate: '', endDate: '' });
    setDiagnosisFilter('');
    
    try {
      setLoading(true);
      const response = await api.get(`/medical-records/patient/${effectivePatientId}`);
      if (response.data.success) {
        setRecords(response.data.data);
        setSelectedRecord(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset records');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Helper function to format vital sign display properly
  const formatVitalSign = (vitalSign) => {
    if (vitalSign === null || vitalSign === undefined) return 'N/A';
    
    // If vitalSign is an object with value and unit properties
    if (typeof vitalSign === 'object' && vitalSign !== null) {
      if ('value' in vitalSign && 'unit' in vitalSign) {
        return `${vitalSign.value} ${vitalSign.unit}`;
      }
      // Return JSON string as fallback for other objects
      return JSON.stringify(vitalSign);
    }
    
    // Return the value directly if it's already a string or number
    return vitalSign;
  };

  // Show loading while we're determining the patient ID
  if (userRole === 'patient' && !currentPatientId && loading) {
    return <div className={styles.loading}>Loading patient information...</div>;
  }

  if (!effectivePatientId && !loading) {
    return <div className={styles.container}>No patient selected</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Medical Records</h1>
        {userRole === 'patient' && <p>Your medical history and records</p>}
        {userRole !== 'patient' && <p>Patient medical history and records</p>}
      </div>
      
      {error && <div className={styles.error}>{error}</div>}

      {/* Summary Section */}
      {summary && (
        <div className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <h3>Quick Summary</h3>
            <div className={styles.summaryData}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Records:</span>
                <span className={styles.summaryValue}>{summary.totalRecords}</span>
              </div>
              
              {summary.commonDiagnoses?.length > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Common Diagnoses:</span>
                  <div className={styles.diagnosisList}>
                    {summary.commonDiagnoses.map((diag, idx) => (
                      <span key={idx} className={styles.diagnosisTag}>
                        {diag.name} ({diag.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchInputGroup}>
          <input
            type="text"
            placeholder="Search symptoms, complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          
          <input
            type="date"
            placeholder="Start Date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className={styles.dateInput}
          />
          
          <input
            type="date"
            placeholder="End Date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className={styles.dateInput}
          />
          
          <input
            type="text"
            placeholder="Filter by diagnosis"
            value={diagnosisFilter}
            onChange={(e) => setDiagnosisFilter(e.target.value)}
            className={styles.searchInput}
          />
          
          <button onClick={handleSearch} className={styles.searchButton}>Search</button>
          <button onClick={resetFilters} className={styles.resetButton}>Reset</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading records...</div>
      ) : (
        <div className={styles.contentArea}>
          {/* Records List */}
          <div className={styles.recordsList}>
            <h2>Records ({records.length})</h2>
            
            {records.length === 0 ? (
              <div className={styles.noRecords}>No medical records found</div>
            ) : (
              <div className={styles.recordItems}>
                {records.map((record) => (
                  <div 
                    key={record._id}
                    className={`${styles.recordItem} ${selectedRecord?._id === record._id ? styles.selectedRecord : ''}`}
                    onClick={() => handleSelectRecord(record._id)}
                  >
                    <div className={styles.recordDate}>{formatDate(record.visitDate)}</div>
                    <div className={styles.recordTitle}>{record.chiefComplaint}</div>
                    {record.doctor && (
                      <div className={styles.recordDoctor}>
                        Dr. {record.doctor.firstName} {record.doctor.lastName}
                      </div>
                    )}
                    {record.diagnosis && record.diagnosis.length > 0 && (
                      <div className={styles.recordDiagnosis}>
                        {record.diagnosis.map((diag, idx) => (
                          <span key={idx} className={styles.diagnosisChip}>
                            {diag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Record Details */}
          <div className={styles.recordDetails}>
            {selectedRecord ? (
              <div className={styles.detailsCard}>
                <div className={styles.detailsHeader}>
                  <h2>{selectedRecord.chiefComplaint}</h2>
                  <span className={styles.detailsDate}>
                    {formatDate(selectedRecord.visitDate)}
                  </span>
                </div>
                
                {selectedRecord.doctor && (
                  <div className={styles.detailsDoctor}>
                    <span className={styles.detailsLabel}>Doctor:</span>
                    Dr. {selectedRecord.doctor.firstName} {selectedRecord.doctor.lastName}
                  </div>
                )}
                
                {selectedRecord.vitalSigns && (
                  <div className={styles.detailsSection}>
                    <h3>Vital Signs</h3>
                    <div className={styles.vitalsGrid}>
                      {selectedRecord.vitalSigns.temperature && (
                        <div className={styles.vitalItem}>
                          <span className={styles.vitalLabel}>Temperature:</span>
                          <span className={styles.vitalValue}>
                            {formatVitalSign(selectedRecord.vitalSigns.temperature)}
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitalSigns.heartRate && (
                        <div className={styles.vitalItem}>
                          <span className={styles.vitalLabel}>Heart Rate:</span>
                          <span className={styles.vitalValue}>
                            {formatVitalSign(selectedRecord.vitalSigns.heartRate)}
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitalSigns.bloodPressure && (
                        <div className={styles.vitalItem}>
                          <span className={styles.vitalLabel}>Blood Pressure:</span>
                          <span className={styles.vitalValue}>
                            {formatVitalSign(selectedRecord.vitalSigns.bloodPressure)}
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitalSigns.respiratoryRate && (
                        <div className={styles.vitalItem}>
                          <span className={styles.vitalLabel}>Respiratory Rate:</span>
                          <span className={styles.vitalValue}>
                            {formatVitalSign(selectedRecord.vitalSigns.respiratoryRate)}
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitalSigns.oxygenSaturation && (
                        <div className={styles.vitalItem}>
                          <span className={styles.vitalLabel}>O₂ Saturation:</span>
                          <span className={styles.vitalValue}>
                            {formatVitalSign(selectedRecord.vitalSigns.oxygenSaturation)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 && (
                  <div className={styles.detailsSection}>
                    <h3>Symptoms</h3>
                    <div className={styles.symptomsList}>
                      {selectedRecord.symptoms.map((symptom, idx) => (
                        <span key={idx} className={styles.symptomItem}>{symptom}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRecord.diagnosis && selectedRecord.diagnosis.length > 0 && (
                  <div className={styles.detailsSection}>
                    <h3>Diagnosis</h3>
                    <div className={styles.diagnosisList}>
                      {selectedRecord.diagnosis.map((diag, idx) => (
                        <div key={idx} className={styles.diagnosisItem}>
                          <span className={styles.diagnosisName}>{diag.name}</span>
                          {diag.notes && <p className={styles.diagnosisNotes}>{diag.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRecord.treatment && selectedRecord.treatment.length > 0 && (
                  <div className={styles.detailsSection}>
                    <h3>Treatment</h3>
                    <div className={styles.treatmentList}>
                      {selectedRecord.treatment.map((treatment, idx) => (
                        <div key={idx} className={styles.treatmentItem}>
                          <span className={styles.treatmentName}>{treatment.name}</span>
                          {treatment.dosage && (
                            <span className={styles.treatmentDosage}>Dosage: {treatment.dosage}</span>
                          )}
                          {treatment.duration && (
                            <span className={styles.treatmentDuration}>Duration: {treatment.duration}</span>
                          )}
                          {treatment.instructions && (
                            <p className={styles.treatmentInstructions}>{treatment.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRecord.followUp && (
                  <div className={styles.detailsSection}>
                    <h3>Follow Up</h3>
                    <p className={styles.followUpText}>{selectedRecord.followUp}</p>
                  </div>
                )}
                
                {selectedRecord.notes && (
                  <div className={styles.detailsSection}>
                    <h3>Notes</h3>
                    {selectedRecord.notes.doctorNotes && (
                      <div className={styles.noteItem}>
                        <div className={styles.noteLabel}>Doctor's Notes:</div>
                        <p className={styles.noteText}>{selectedRecord.notes.doctorNotes}</p>
                      </div>
                    )}
                    {selectedRecord.notes.patientNotes && (
                      <div className={styles.noteItem}>
                        <div className={styles.noteLabel}>Patient's Notes:</div>
                        <p className={styles.noteText}>{selectedRecord.notes.patientNotes}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div className={styles.detailsSection}>
                    <h3>Attachments</h3>
                    <div className={styles.attachmentList}>
                      {selectedRecord.attachments.map((attachment, idx) => (
                        <div key={idx} className={styles.attachmentItem}>
                          <span className={styles.attachmentName}>{attachment.name}</span>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noSelectedRecord}>
                <div className={styles.placeholder}>
                  <p>Select a record to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;