import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './PatientAppointment.module.css';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaClock, 
  FaMapMarkerAlt,
  FaCheck,
  FaTimesCircle,
  FaHourglassHalf,
  FaCheckCircle
} from 'react-icons/fa';
import { useAuth, API_BASE_URL } from '../../../../../contexts/AuthContext';

const PatientAppointment = () => {
  const { getToken, currentUser } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const getUserId = () => {
      // First check if currentUser exists
      if (currentUser) {
        // Try to get id first (DoctorAppointment uses id instead of _id)
        if (currentUser.id) {
          return currentUser.id;
        }
        // Fall back to _id if id is not available
        if (currentUser._id) {
          return currentUser._id;
        }
      }
      
      // If currentUser doesn't have id or _id, try localStorage
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        return storedUser.id || storedUser._id || null;
      } catch (err) {
        console.error('Error parsing user data from localStorage:', err);
        return null;
      }
    };

    const userId = getUserId();
    
    if (!userId) {
      setError('User authentication failed. Please sign in again.');
      setLoading(false);
      return;
    }
    
    // We have the user ID, proceed with fetching appointments
    fetchAppointments(userId);
  }, [statusFilter, dateRange, currentUser]);

  const fetchAppointments = async (userId) => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        console.log('No auth token found');
        navigate('/signin');
        return;
      }

      console.log(`Fetching appointments for user ID: ${userId}`);
      
      // Using the correct API endpoint with the explicit userId parameter
      const response = await axios.get(`${API_BASE_URL}/appointments/patient/${userId}`, {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}` // Include both header formats to be safe
        },
        params: {
          status: statusFilter || undefined
        }
      });

      console.log('API response:', response.data);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch appointments');
      }

      let filteredAppointments = response.data.data || [];
      
      // Apply date range filter
      if (dateRange.startDate) {
        const startDate = new Date(dateRange.startDate);
        filteredAppointments = filteredAppointments.filter(app => 
          new Date(app.appointmentDate) >= startDate
        );
      }
      
      if (dateRange.endDate) {
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59);
        filteredAppointments = filteredAppointments.filter(app => 
          new Date(app.appointmentDate) <= endDate
        );
      }

      // Transform the data to match our UI format
      const formattedAppointments = filteredAppointments.map(app => {
        // Handle case where appointmentDate is missing or invalid
        let appointmentDate;
        try {
          appointmentDate = new Date(app.appointmentDate);
          // Check if date is valid
          if (isNaN(appointmentDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (err) {
          // Use current date as fallback
          appointmentDate = new Date();
          console.warn(`Invalid appointment date for appointment ${app._id}, using current date as fallback`);
        }
        
        // Handle case where doctor might be null or undefined
        const doctorName = app.doctor && app.doctor.user ? 
                          `${app.doctor.user.firstName} ${app.doctor.user.lastName}` : 
                          'Not assigned';
        
        return {
          id: app._id,
          day: appointmentDate.getDate().toString(),
          month: appointmentDate.toLocaleString('default', { month: 'short' }),
          title: app.symptoms ? `Appointment for ${app.symptoms.split(',')[0]}...` : 'Medical Appointment',
          doctor: doctorName,
          specialty: app.doctor ? app.doctor.specialization || app.doctor.department || 'General' : 'Not assigned',
          time: `${app.startTime || '00:00'} - ${app.endTime || '00:00'}`,
          location: 'Hospital', 
          reason: app.symptoms || 'No reason specified',
          status: app.status || 'scheduled',
          isVirtual: Boolean(app.meetingLink),
          meetingLink: app.meetingLink || null,
          appointmentDate: app.appointmentDate,
          fee: app.fee
        };
      });

      console.log('Formatted appointments:', formattedAppointments);
      setAppointments(formattedAppointments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(`Failed to load appointments: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/signin');
        return;
      }

      if (!window.confirm('Are you sure you want to cancel this appointment?')) {
        return;
      }

      // Using the correct endpoint from controller
      const response = await axios.put(
        `${API_BASE_URL}/appointments/${id}/cancel`,
        { cancellationReason: 'Cancelled by patient' },
        {
          headers: {
            'x-auth-token': token,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        // Update the local state
        setAppointments(prev => 
          prev.map(app => 
            app.id === id ? { ...app, status: 'cancelled' } : app
          )
        );
        
        // Show success message
        alert('Appointment cancelled successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(`Failed to cancel appointment: ${error.response?.data?.message || error.message}`);
    }
  };

  const rescheduleAppointment = (id) => {
    navigate(`/dashboard/patient/reschedule-appointment/${id}`);
  };

  const handleNewAppointment = () => {
    navigate('/dashboard/patient/booking-appointment');
  };
  
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleSignInClick = () => {
    navigate('/signin');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed':
        return <FaCheck />;
      case 'scheduled':
      case 'pending':
        return <FaHourglassHalf />;
      case 'completed':
        return <FaCheckCircle />;
      case 'cancelled':
      case 'no-show':
        return <FaTimesCircle />;
      default:
        return <FaHourglassHalf />;
    }
  };

  const renderMeetingLink = (appointment) => {
    if (appointment.isVirtual && appointment.meetingLink && 
       (appointment.status === 'confirmed' || appointment.status === 'scheduled')) {
      // Check if the appointment is happening soon (within the next hour)
      const appointmentTime = new Date(appointment.appointmentDate);
      const now = new Date();
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const isAppointmentSoon = timeDiff > 0 && timeDiff < 3600000; // 1 hour in milliseconds

      return (
        <a 
          href={appointment.meetingLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${styles.buttonPrimary} ${isAppointmentSoon ? styles.flashButton : ''}`}
        >
          Join Meeting
        </a>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading appointments...</div>
        <p className={styles.loadingSubtext}>Please wait while we fetch your appointments</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>{error}</div>
        {error.includes('sign in') ? (
          <button 
            className={styles.buttonPrimary}
            onClick={handleSignInClick}
          >
            Sign In
          </button>
        ) : (
          <button 
            className={styles.buttonPrimary}
            onClick={() => {
              setError(null);
              setLoading(true);
              
              // Get user ID using the same function as in useEffect
              const getUserId = () => {
                if (currentUser) {
                  return currentUser.id || currentUser._id;
                }
                
                try {
                  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                  return storedUser.id || storedUser._id || null;
                } catch (err) {
                  return null;
                }
              };
              
              const userId = getUserId();
              
              if (userId) {
                fetchAppointments(userId);
              } else {
                setError('User ID not found. Please sign in again.');
                setLoading(false);
              }
            }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>My Appointments</h2>
        <button 
          className={styles.buttonPrimary}
          onClick={handleNewAppointment}
        >
          <FaCalendarAlt style={{ marginRight: '5px' }} />
          New Appointment
        </button>
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <label htmlFor="statusFilter">Status</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={handleFilterChange}
            className={styles.select}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="startDate">From</label>
          <input 
            type="date" 
            id="startDate"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className={styles.dateInput}
          />
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="endDate">To</label>
          <input 
            type="date" 
            id="endDate"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className={styles.dateInput}
          />
        </div>
      </div>
      
      {appointments.length === 0 ? (
        <div className={styles.noAppointments}>
          <p>You don't have any appointments {statusFilter ? `with status "${statusFilter}"` : ''}</p>
          <button 
            className={styles.buttonPrimary}
            onClick={handleNewAppointment}
          >
            Book An Appointment
          </button>
        </div>
      ) : (
        appointments.map(appointment => (
          <div key={appointment.id} className={styles.appointmentItem}>
            <div className={styles.appointmentDate}>
              <span className={styles.appointmentDay}>{appointment.day}</span>
              <span className={styles.appointmentMonth}>{appointment.month}</span>
            </div>
            <div className={styles.appointmentInfo}>
              <h3 className={styles.appointmentTitle}>{appointment.title}</h3>
              <p className={styles.appointmentDoctor}>
                <FaUserMd style={{ marginRight: '5px' }} />
                {appointment.doctor} - {appointment.specialty}
              </p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <p className={styles.appointmentTime}>
                  <FaClock style={{ marginRight: '5px' }} />
                  {appointment.time}
                </p>
                <p className={styles.appointmentLocation}>
                  <FaMapMarkerAlt style={{ marginRight: '5px' }} />
                  {appointment.location}
                </p>
              </div>
              {appointment.reason && (
                <p className={styles.appointmentReason}>
                  <strong>Reason:</strong> {appointment.reason}
                </p>
              )}
              {appointment.fee && (
                <p className={styles.appointmentFee}>
                  <strong>Fee:</strong> ${appointment.fee}
                </p>
              )}
            </div>
            <div className={styles.appointmentActions}>
              <span className={`${styles.appointmentStatus} ${styles[`status${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}`]}`}>
                {getStatusIcon(appointment.status)}
                <span style={{ marginLeft: '5px' }}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
              </span>
              
              <div className={styles.actionButtons}>
                {renderMeetingLink(appointment)}
                
                {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                  <>
                    <button 
                      className={styles.buttonOutline}
                      onClick={() => rescheduleAppointment(appointment.id)}
                    >
                      Reschedule
                    </button>
                    <button 
                      className={styles.buttonOutline} 
                      style={{ color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => cancelAppointment(appointment.id)}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {appointment.status === 'completed' && (
                  <Link to={`/dashboard/patient/medical-records/${appointment.id}`} className={styles.buttonOutline}>
                    View Record
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PatientAppointment;