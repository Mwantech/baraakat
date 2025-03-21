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
  const { getToken } = useAuth();
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
    fetchAppointments();
  }, [statusFilter, dateRange]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/signin');
        return;
      }

      // Use the correct endpoint from our controller
      const response = await axios.get(`${API_BASE_URL}/appointments/patient`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch appointments');
      }

      let filteredAppointments = response.data.data;
      
      // Apply status filter
      if (statusFilter) {
        filteredAppointments = filteredAppointments.filter(app => app.status === statusFilter);
      }
      
      // Apply date range filter
      if (dateRange.startDate) {
        const startDate = new Date(dateRange.startDate);
        filteredAppointments = filteredAppointments.filter(app => 
          new Date(app.scheduledDate) >= startDate
        );
      }
      
      if (dateRange.endDate) {
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59); // Set to end of day
        filteredAppointments = filteredAppointments.filter(app => 
          new Date(app.scheduledDate) <= endDate
        );
      }

      // Transform the data to match our UI format
      const formattedAppointments = filteredAppointments.map(app => {
        const appointmentDate = new Date(app.scheduledDate);
        
        return {
          id: app._id,
          day: appointmentDate.getDate().toString(),
          month: appointmentDate.toLocaleString('default', { month: 'short' }),
          title: app.appointmentType,
          doctor: `${app.doctor.firstName} ${app.doctor.lastName}`,
          specialty: app.doctor.specialty || 'General',
          time: `${app.startTime} - ${app.endTime}`,
          location: app.isVirtual ? 'Virtual' : (app.doctor.location || 'Main Hospital'),
          reason: app.reason,
          status: app.status,
          isVirtual: app.isVirtual,
          meetingLink: app.meetingLink,
          appointmentDate: app.scheduledDate
        };
      });

      setAppointments(formattedAppointments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again later.');
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

      // Updated to match our controller's endpoint
      await axios.patch(
        `${API_BASE_URL}/appointments/${id}/status`,
        { status: 'cancelled' },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the local state
      setAppointments(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status: 'cancelled' } : app
        )
      );

      // Show success message or toast notification
      alert('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const rescheduleAppointment = async (id) => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Navigate to dedicated reschedule page with appointment ID
      navigate(`/reschedule-appointment/${id}`);
    } catch (error) {
      console.error('Error preparing to reschedule:', error);
      alert('Failed to prepare for rescheduling. Please try again.');
    }
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
        return null;
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
    return <div className={styles.loading}>Loading appointments...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
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
                  <Link to={`/medical-records/${appointment.id}`} className={styles.buttonOutline}>
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