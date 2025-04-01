import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './BookAppointment.module.css';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaClock, 
  FaMapMarkerAlt,
  FaVideo,
  FaClinicMedical,
  FaChevronRight,
  FaCheckCircle
} from 'react-icons/fa';
import { useAuth, API_BASE_URL } from '../../../../../contexts/AuthContext';

const AppointmentBooking = () => {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [appointmentData, setAppointmentData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    appointmentType: 'General Checkup',
    symptoms: [],
    notes: '',
    isVirtual: false,
    reason: ''
  });
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDoctors();
    // Set patientId from authenticated user if available
    if (user && user._id) {
      setAppointmentData(prevData => ({
        ...prevData,
        patientId: user._id
      }));
    }
  }, [user]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/doctors/`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch doctors');
      }

      setDoctors(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors. Please try again later.');
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/availability/${doctorId}?date=${date}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch available slots');
      }

      setAvailableSlots(response.data.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Failed to load available time slots. Please try again later.');
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentData({
      ...appointmentData,
      doctorId: doctor._id
    });
    setCurrentStep(2);
  };

  const handleDateSelect = (date) => {
    setAppointmentData({
      ...appointmentData,
      appointmentDate: date // Changed from scheduledDate to appointmentDate
    });
    fetchAvailableSlots(appointmentData.doctorId, date);
    setCurrentStep(3);
  };

  const handleTimeSelect = (startTime, endTime) => {
    setAppointmentData({
      ...appointmentData,
      startTime,
      endTime
    });
    setCurrentStep(4);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppointmentData({
      ...appointmentData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddSymptom = () => {
    if (symptomInput.trim() !== '') {
      setAppointmentData({
        ...appointmentData,
        symptoms: [...appointmentData.symptoms, symptomInput.trim()]
      });
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (index) => {
    const updatedSymptoms = [...appointmentData.symptoms];
    updatedSymptoms.splice(index, 1);
    setAppointmentData({
      ...appointmentData,
      symptoms: updatedSymptoms
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Prepare submission data to match controller expectations
      const submissionData = {
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        symptoms: appointmentData.symptoms,
        notes: appointmentData.notes + (appointmentData.isVirtual ? "\nVirtual Appointment" : "\nIn-person Appointment") +
              (appointmentData.reason ? `\nReason: ${appointmentData.reason}` : "")
      };

      const response = await axios.post(
        `${API_BASE_URL}/appointments`,
        submissionData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error('Failed to create appointment');
      }

      setSuccessMessage('Appointment booked successfully!');
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
      setSubmitting(false);
    }
  };

  const renderDoctorSelection = () => {
    return (
      <div className={styles.selectionContainer}>
        <h3 className={styles.stepTitle}>Select a Doctor</h3>
        <div className={styles.doctorGrid}>
          {doctors.map(doctor => (
            <div 
              key={doctor._id} 
              className={styles.doctorCard}
              onClick={() => handleDoctorSelect(doctor)}
            >
              <div className={styles.doctorAvatar}>
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt={`Dr. ${doctor.lastName}`} />
                ) : (
                  <FaUserMd size={40} />
                )}
              </div>
              <div className={styles.doctorInfo}>
                <h4>Dr. {doctor.firstName} {doctor.lastName}</h4>
                <p>{doctor.specialty || doctor.specialization || 'General Practitioner'}</p>
                <p className={styles.experience}>{doctor.experience || '5+ years'} experience</p>
                {doctor.fees && <p className={styles.fees}>Fee: ${doctor.fees}</p>}
              </div>
              <div className={styles.selectDoctor}>
                <FaChevronRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDateSelection = () => {
    // Generate dates for the next 30 days
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return (
      <div className={styles.selectionContainer}>
        <h3 className={styles.stepTitle}>Select a Date</h3>
        <div className={styles.calendarGrid}>
          {dates.map(date => {
            const formattedDate = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div 
                key={formattedDate}
                className={`${styles.dateCard} ${isWeekend ? styles.weekend : ''}`}
                onClick={() => !isWeekend && handleDateSelect(formattedDate)}
              >
                <div className={styles.dayOfWeek}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={styles.dayOfMonth}>
                  {date.getDate()}
                </div>
                <div className={styles.month}>
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
        <button 
          className={styles.buttonSecondary}
          onClick={() => setCurrentStep(1)}
        >
          Back to Doctor Selection
        </button>
      </div>
    );
  };

  const renderTimeSelection = () => {
    // Simulate available time slots if API doesn't return any
    const slots = availableSlots.length > 0 ? availableSlots : [
      { startTime: '09:00 AM', endTime: '09:30 AM' },
      { startTime: '10:00 AM', endTime: '10:30 AM' },
      { startTime: '11:00 AM', endTime: '11:30 AM' },
      { startTime: '02:00 PM', endTime: '02:30 PM' },
      { startTime: '03:00 PM', endTime: '03:30 PM' },
      { startTime: '04:00 PM', endTime: '04:30 PM' }
    ];

    return (
      <div className={styles.selectionContainer}>
        <h3 className={styles.stepTitle}>Select a Time</h3>
        <p className={styles.dateSelected}>
          <FaCalendarAlt style={{ marginRight: '5px' }} />
          {new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <div className={styles.timeGrid}>
          {slots.map((slot, index) => (
            <div 
              key={index}
              className={styles.timeCard}
              onClick={() => handleTimeSelect(slot.startTime, slot.endTime)}
            >
              <FaClock style={{ marginRight: '5px' }} />
              {slot.startTime} - {slot.endTime}
            </div>
          ))}
        </div>
        <button 
          className={styles.buttonSecondary}
          onClick={() => setCurrentStep(2)}
        >
          Back to Date Selection
        </button>
      </div>
    );
  };

  const renderAppointmentDetails = () => {
    const appointmentTypes = [
      'General Checkup',
      'Follow-up',
      'Consultation',
      'Vaccination',
      'Specialist Referral',
      'Lab Results Review',
      'Mental Health',
      'Other'
    ];

    return (
      <div className={styles.selectionContainer}>
        <h3 className={styles.stepTitle}>Appointment Details</h3>
        
        <div className={styles.appointmentSummary}>
          <div className={styles.summaryItem}>
            <FaUserMd style={{ marginRight: '5px' }} />
            <span>
              Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} - {selectedDoctor.specialty || selectedDoctor.specialization || 'General Practitioner'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <FaCalendarAlt style={{ marginRight: '5px' }} />
            <span>
              {new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <FaClock style={{ marginRight: '5px' }} />
            <span>
              {appointmentData.startTime} - {appointmentData.endTime}
            </span>
          </div>
          {selectedDoctor.fees && (
            <div className={styles.summaryItem}>
              <span className={styles.fees}>
                Fee: ${selectedDoctor.fees}
              </span>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className={styles.appointmentForm}>
          <div className={styles.formGroup}>
            <label htmlFor="appointmentType">Appointment Type</label>
            <select
              id="appointmentType"
              name="appointmentType"
              value={appointmentData.appointmentType}
              onChange={handleInputChange}
              className={styles.select}
              required
            >
              {appointmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="reason">Reason for Visit</label>
            <textarea
              id="reason"
              name="reason"
              value={appointmentData.reason}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Please describe the reason for your appointment"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Symptoms (Optional)</label>
            <div className={styles.symptomInput}>
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="Add a symptom"
                className={styles.input}
              />
              <button
                type="button"
                onClick={handleAddSymptom}
                className={styles.addButton}
              >
                Add
              </button>
            </div>
            {appointmentData.symptoms.length > 0 && (
              <div className={styles.symptomsList}>
                {appointmentData.symptoms.map((symptom, index) => (
                  <div key={index} className={styles.symptomTag}>
                    <span>{symptom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(index)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="isVirtual" className={styles.checkboxLabel}>
              <input
                type="checkbox"
                id="isVirtual"
                name="isVirtual"
                checked={appointmentData.isVirtual}
                onChange={handleInputChange}
                className={styles.checkbox}
              />
              Virtual Appointment
            </label>
            <div className={styles.appointmentTypeInfo}>
              {appointmentData.isVirtual ? (
                <div className={styles.typeInfo}>
                  <FaVideo style={{ marginRight: '5px', color: '#4f46e5' }} />
                  <span>Video consultation - You'll receive a link to join the meeting</span>
                </div>
              ) : (
                <div className={styles.typeInfo}>
                  <FaClinicMedical style={{ marginRight: '5px', color: '#4f46e5' }} />
                  <span>In-person visit at {selectedDoctor.location || 'Main Hospital'}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notes">Additional Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={appointmentData.notes}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Any additional information you'd like to share"
            />
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => setCurrentStep(3)}
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error && !successMessage) {
    return <div className={styles.error}>{error}</div>;
  }

  if (successMessage) {
    return (
      <div className={styles.success}>
        <FaCheckCircle size={50} className={styles.successIcon} />
        <h2>{successMessage}</h2>
        <p>Redirecting to your appointments...</p>
      </div>
    );
  }

  return (
    <div className={styles.bookingContainer}>
      <div className={styles.bookingHeader}>
        <h2>Book an Appointment</h2>
        <div className={styles.steps}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Doctor</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Date</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Time</div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${currentStep >= 4 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepLabel}>Details</div>
          </div>
        </div>
      </div>

      <div className={styles.bookingContent}>
        {currentStep === 1 && renderDoctorSelection()}
        {currentStep === 2 && renderDateSelection()}
        {currentStep === 3 && renderTimeSelection()}
        {currentStep === 4 && renderAppointmentDetails()}
      </div>
    </div>
  );
};

export default AppointmentBooking;