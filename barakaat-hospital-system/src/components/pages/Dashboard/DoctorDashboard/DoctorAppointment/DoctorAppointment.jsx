import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DoctorAppointment.module.css';
import { useAuth, API_BASE_URL } from '../../../../../contexts/AuthContext';

export const DoctorAppointment = () => {
  const { getToken, currentUser, getUserRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Use id instead of _id based on your currentUser structure
  const doctorId = currentUser?.id;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log("Current user:", currentUser);
        console.log("Current user role:", getUserRole());
        
        if (!doctorId) {
          throw new Error("Doctor ID not found. Please ensure you're logged in as a doctor.");
        }
        
        // Get token
        const token = getToken();
        if (!token) {
          throw new Error("Authentication token not found");
        }
        
        console.log("Fetching appointments for doctor ID:", doctorId);
        
        // Updated endpoint to match our controller
        const response = await axios.get(`${API_BASE_URL}/appointments/doctor/${doctorId}`, {
          headers: {
            'x-auth-token': token
          }
        });
  
        if (!response.data || !response.data.success) {
          throw new Error(`Error: ${response.status}`);
        }
  
        // Map the response data to match the component's expected structure
        const formattedAppointments = response.data.data.map(app => ({
          _id: app._id,
          patientName: app.patient?.user ? 
            `${app.patient.user.firstName} ${app.patient.user.lastName}` : 
            "Patient Name Not Available",
          appointmentDate: app.appointmentDate || app.scheduledDate,
          startTime: app.startTime,
          endTime: app.endTime,
          reason: app.reason,
          status: app.status,
          notes: app.notes,
          isVirtual: app.isVirtual,
          meetingLink: app.meetingLink,
          appointmentType: app.appointmentType,
          symptoms: app.symptoms
        }));
        
        setAppointments(formattedAppointments);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
        setLoading(false);
      }
    };
  
    // Only fetch appointments if we have a doctorId
    if (doctorId) {
      fetchAppointments();
    } else {
      console.error("Doctor ID not found. Current user:", currentUser);
      setError("Doctor ID not found. Please ensure you're logged in as a doctor.");
      setLoading(false);
    }
  }, [getToken, getUserRole, doctorId, currentUser]);

  const handleStatusUpdate = async (id, status) => {
    try {
      // Get token
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Updated to PATCH and match our controller endpoint
      const response = await axios.patch(`${API_BASE_URL}/appointments/${id}/status`, 
        { status },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update local state to reflect the change
      setAppointments(appointments.map(app => 
        app._id === id ? { ...app, status } : app
      ));
      
      // If we're viewing the appointment details, update that too
      if (selectedAppointment && selectedAppointment._id === id) {
        setSelectedAppointment({ ...selectedAppointment, status });
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.message);
    }
  };

  const handleAddNotes = async (id, notes) => {
    try {
      // Get token
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Updated to PATCH and match our controller endpoint
      const response = await axios.patch(`${API_BASE_URL}/appointments/${id}/notes`, 
        { notes },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update local state to reflect the change
      setAppointments(appointments.map(app => 
        app._id === id ? { ...app, notes } : app
      ));
      
      setSelectedAppointment(null); // Close detail view
    } catch (err) {
      console.error("Error adding notes:", err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className={styles.loading}>Loading appointments...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Doctor Appointments</h1>
      
      {selectedAppointment ? (
        <div className={styles.detailView}>
          <button 
            className={styles.backButton}
            onClick={() => setSelectedAppointment(null)}
          >
            Back to List
          </button>
          
          <div className={styles.appointmentDetail}>
            <h2>Appointment Details</h2>
            <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
            <p><strong>Date:</strong> {formatDate(selectedAppointment.appointmentDate)}</p>
            <p><strong>Time:</strong> {selectedAppointment.startTime} to {selectedAppointment.endTime}</p>
            <p><strong>Type:</strong> {selectedAppointment.appointmentType}</p>
            <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
            <p><strong>Status:</strong> {selectedAppointment.status}</p>
            
            {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
              <div>
                <h3>Reported Symptoms</h3>
                <ul>
                  {selectedAppointment.symptoms.map((symptom, index) => (
                    <li key={index}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className={styles.notesSection}>
              <h3>Notes</h3>
              <p>{selectedAppointment.notes || 'No notes yet'}</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const notes = e.target.notes.value;
                handleAddNotes(selectedAppointment._id, notes);
              }}>
                <textarea
                  name="notes"
                  className={styles.notesInput}
                  defaultValue={selectedAppointment.notes || ''}
                  rows={4}
                  placeholder="Add appointment notes..."
                />
                <button type="submit" className={styles.saveButton}>Save Notes</button>
              </form>
            </div>
            
            <div className={styles.statusActions}>
              <h3>Update Status</h3>
              <div className={styles.statusButtons}>
                <button 
                  onClick={() => handleStatusUpdate(selectedAppointment._id, 'confirmed')}
                  className={`${styles.statusButton} ${styles.confirmed}`}
                >
                  Confirm
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedAppointment._id, 'completed')}
                  className={`${styles.statusButton} ${styles.completed}`}
                >
                  Complete
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedAppointment._id, 'cancelled')}
                  className={`${styles.statusButton} ${styles.cancelled}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedAppointment._id, 'no-show')}
                  className={`${styles.statusButton} ${styles.noShow}`}
                >
                  No Show
                </button>
              </div>
            </div>
            
            {selectedAppointment.isVirtual && selectedAppointment.meetingLink && (
              <div className={styles.virtualMeeting}>
                <h3>Virtual Appointment</h3>
                <a 
                  href={selectedAppointment.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.meetingLink}
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {appointments.length === 0 ? (
            <div className={styles.noAppointments}>
              No appointments scheduled
            </div>
          ) : (
            <div className={styles.appointmentsList}>
              {appointments.map(appointment => (
                <div 
                  key={appointment._id} 
                  className={`${styles.appointmentCard} ${styles[appointment.status]}`}
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className={styles.patientInfo}>
                    <h3>{appointment.patientName}</h3>
                    <span className={styles.appointmentTime}>
                      {formatDate(appointment.appointmentDate)}
                    </span>
                  </div>
                  <div className={styles.appointmentStatus}>
                    <span className={styles.statusBadge}>{appointment.status}</span>
                    <span className={styles.reasonBadge}>{appointment.reason}</span>
                    {appointment.isVirtual && <span className={styles.virtualBadge}>Virtual</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorAppointment;