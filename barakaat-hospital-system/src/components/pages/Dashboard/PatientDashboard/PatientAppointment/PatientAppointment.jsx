import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const PatientAppointment = () => {
  // Sample data for appointments
  const [appointments, setAppointments] = useState([
    { 
      id: 1, 
      day: '15', 
      month: 'Mar', 
      title: 'General Checkup', 
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Family Medicine',
      time: '10:00 AM',
      location: 'Main Hospital, Room 203',
      status: 'confirmed'
    },
    { 
      id: 2, 
      day: '22', 
      month: 'Mar', 
      title: 'Dental Appointment', 
      doctor: 'Dr. Michael Chen',
      specialty: 'Dentistry',
      time: '2:00 PM',
      location: 'Dental Clinic, Floor 2',
      status: 'pending'
    },
    { 
      id: 3, 
      day: '05', 
      month: 'Feb', 
      title: 'Physical Therapy', 
      doctor: 'Dr. Lisa Rodriguez',
      specialty: 'Physical Therapy',
      time: '11:30 AM',
      location: 'Rehabilitation Center',
      status: 'completed'
    },
    { 
      id: 4, 
      day: '18', 
      month: 'Jan', 
      title: 'Eye Examination', 
      doctor: 'Dr. James Wilson',
      specialty: 'Ophthalmology',
      time: '9:15 AM',
      location: 'Eye Care Center',
      status: 'cancelled'
    }
  ]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed':
        return <FaCheck />;
      case 'pending':
        return <FaHourglassHalf />;
      case 'completed':
        return <FaCheckCircle />;
      case 'cancelled':
        return <FaTimesCircle />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>My Appointments</h2>
        <button className={styles.buttonPrimary}>
          <FaCalendarAlt style={{ marginRight: '5px' }} />
          New Appointment
        </button>
      </div>
      
      {appointments.map(appointment => (
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
              <p className={styles.appointmentTime}>
                <FaMapMarkerAlt style={{ marginRight: '5px' }} />
                {appointment.location}
              </p>
            </div>
          </div>
          <div>
            <span className={`${styles.appointmentStatus} ${styles[`status${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}`]}`}>
              {getStatusIcon(appointment.status)}
              <span style={{ marginLeft: '5px' }}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
            </span>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  <button className={styles.buttonOutline}>Reschedule</button>
                  <button className={styles.buttonOutline} style={{ color: '#ef4444', borderColor: '#ef4444' }}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientAppointment;