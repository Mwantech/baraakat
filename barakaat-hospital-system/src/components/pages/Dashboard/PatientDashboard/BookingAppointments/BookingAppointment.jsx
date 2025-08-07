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
  FaCheckCircle,
  FaFilter,
  FaMoneyBillWave,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaStar,
  FaCircle
} from 'react-icons/fa';
import { useAuth, API_BASE_URL } from '../../../../../contexts/AuthContext';
import MpesaPayment from './MpesaPayment';

// Reusable Components
const LoadingSpinner = ({ message }) => (
  <div className={styles.loadingWithMessage}>
    <FaSpinner className={styles.spinner} />
    <p>{message}</p>
  </div>
);

const StepInstructions = ({ step, total, instruction }) => (
  <div className={styles.stepInstructions}>
    <FaInfoCircle className={styles.infoIcon} />
    <p>Step {step} of {total}: {instruction}</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className={styles.errorContainer}>
    <FaExclamationTriangle className={styles.errorIcon} />
    <div className={styles.errorContent}>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={styles.retryButton}>
          Try Again
        </button>
      )}
    </div>
  </div>
);

const HelpText = ({ children, type = 'info' }) => (
  <div className={`${styles.helpText} ${styles[`helpText--${type}`]}`}>
    <FaInfoCircle className={styles.helpIcon} />
    <span>{children}</span>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, appointmentData, doctor }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmationModal}>
        <div className={styles.modalHeader}>
          <h3>Confirm Your Appointment</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.confirmationSummary}>
            <div className={styles.summaryRow}>
              <FaUserMd />
              <span>Dr. {doctor.user.firstName} {doctor.user.lastName}</span>
            </div>
            <div className={styles.summaryRow}>
              <FaCalendarAlt />
              <span>{new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className={styles.summaryRow}>
              <FaClock />
              <span>{appointmentData.startTime} - {appointmentData.endTime}</span>
            </div>
            <div className={styles.summaryRow}>
              {appointmentData.isVirtual ? <FaVideo /> : <FaClinicMedical />}
              <span>{appointmentData.isVirtual ? 'Virtual Appointment' : 'In-person Visit'}</span>
            </div>
            {doctor.fees && (
              <div className={styles.summaryRow}>
                <FaMoneyBillWave />
                <span className={styles.feeAmount}>Fee: ${doctor.fees}</span>
              </div>
            )}
          </div>
          
          <div className={styles.termsSection}>
            <p className={styles.termsText}>
              By confirming, you agree to our terms and conditions. 
              Cancellation must be made at least 24 hours in advance.
            </p>
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            Confirm & Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const AppointmentBooking = () => {
  const { getToken, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
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
  
  const [filters, setFilters] = useState({
    specialization: '',
    date: ''
  });
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [userId, setUserId] = useState('');
  const [createdAppointmentId, setCreatedAppointmentId] = useState(null);

  const APPOINTMENT_TYPES = [
    'General Checkup',
    'Follow-up',
    'Consultation',
    'Vaccination',
    'Specialist Referral',
    'Lab Results Review',
    'Mental Health',
    'Other'
  ];

  const STEP_INSTRUCTIONS = {
    1: "Choose your preferred doctor based on specialization and availability",
    2: "Select your preferred appointment date",
    3: "Pick a convenient time slot",
    4: "Provide appointment details and reason for visit",
    5: "Complete payment to confirm your appointment"
  };

  // Custom hook for user ID extraction
  const extractUserId = () => {
    const storedUserString = localStorage.getItem('user');
    let storedUser = null;
    
    if (storedUserString) {
      try {
        storedUser = JSON.parse(storedUserString);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }
    
    return (currentUser && currentUser._id) || 
           (currentUser && currentUser.id) || 
           (currentUser && currentUser.userId) ||
           (storedUser && storedUser._id) ||
           (storedUser && storedUser.id) ||
           (storedUser && storedUser.userId) ||
           null;
  };

  useEffect(() => {
    const patientId = extractUserId();
    if (patientId) {
      setUserId(patientId);
      setAppointmentData(prevData => ({
        ...prevData,
        patientId: patientId
      }));
    }
    
    fetchDoctors();
    fetchSpecializations();
  }, [currentUser]);

  const fetchSpecializations = async () => {
    try {
      setLoadingMessage('Loading specializations...');
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/appointments/specializations`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data && response.data.success) {
        setSpecializations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchDoctors = async (filterParams = {}) => {
    try {
      setLoading(true);
      setLoadingMessage('Finding available doctors...');
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const queryParams = new URLSearchParams();
      if (filterParams.specialization) {
        queryParams.append('specialization', filterParams.specialization);
      }
      if (filterParams.date) {
        queryParams.append('date', filterParams.date);
      }

      const response = await axios.get(
        `${API_BASE_URL}/appointments/available?${queryParams.toString()}`, 
        {
          headers: { 'x-auth-token': token }
        }
      );

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
      setLoadingMessage('Loading available time slots...');
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/appointments/availability/${doctorId}?date=${date}`,
        {
          headers: { 'x-auth-token': token }
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

  const validateForm = () => {
    const errors = {};
    
    if (!appointmentData.reason.trim()) {
      errors.reason = 'Please provide a reason for your visit';
    }
    
    if (appointmentData.reason.trim().length < 10) {
      errors.reason = 'Please provide more details about your visit (minimum 10 characters)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
      appointmentDate: date
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
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    fetchDoctors(filters);
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);
      setShowConfirmation(false);
      setLoadingMessage('Creating your appointment...');
      
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const patientId = userId || appointmentData.patientId;
      
      if (!patientId) {
        setError('User ID not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      const submissionData = {
        patientId: patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        symptoms: appointmentData.symptoms,
        notes: appointmentData.notes + (appointmentData.isVirtual ? "\nVirtual Appointment" : "\nIn-person Appointment") +
              (appointmentData.reason ? `\nReason: ${appointmentData.reason}` : "") +
              `\nAppointment Type: ${appointmentData.appointmentType}`
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

      setCreatedAppointmentId(response.data.data._id);
      setCurrentStep(5);
      setSubmitting(false);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(`Failed to book appointment: ${error.response?.data?.message || error.message}`);
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccessMessage('Appointment booked and payment successful!');
    setTimeout(() => {
      navigate('/dashboard/patient/appointments');
    }, 2000);
  };

  const renderStepProgress = () => {
    const steps = [
      { number: 1, label: 'Doctor', completed: currentStep > 1 },
      { number: 2, label: 'Date', completed: currentStep > 2 },
      { number: 3, label: 'Time', completed: currentStep > 3 },
      { number: 4, label: 'Details', completed: currentStep > 4 },
      { number: 5, label: 'Payment', completed: false }
    ];

    return (
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className={`${styles.step} ${currentStep >= step.number ? styles.activeStep : ''} ${step.completed ? styles.completedStep : ''}`}>
              <div className={styles.stepNumber}>
                {step.completed ? <FaCheck /> : step.number}
              </div>
              <div className={styles.stepLabel}>{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`${styles.stepConnector} ${currentStep > step.number ? styles.completedConnector : ''}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderDoctorSelection = () => {
    return (
      <div className={styles.selectionContainer}>
        <StepInstructions 
          step={1} 
          total={5} 
          instruction={STEP_INSTRUCTIONS[1]} 
        />
        
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="specialization">Specialization:</label>
            <select
              id="specialization"
              name="specialization"
              value={filters.specialization}
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              <option value="">All Specializations</option>
              {specializations.map((spec, index) => (
                <option key={index} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="date">Available Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className={styles.filterInput}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <button className={styles.filterButton} onClick={applyFilters}>
            <FaFilter style={{ marginRight: '5px' }} />
            Apply Filters
          </button>
        </div>
        
        {doctors.length === 0 ? (
          <div className={styles.noResults}>
            <p>No doctors match your search criteria. Please try different filters.</p>
          </div>
        ) : (
          <div className={styles.doctorGrid}>
            {doctors.map(doctor => (
              <div 
                key={doctor._id} 
                className={styles.doctorCard}
                onClick={() => handleDoctorSelect(doctor)}
              >
                <div className={styles.doctorHeader}>
                  <div className={styles.doctorAvatar}>
                    {doctor.profilePicture ? (
                      <img src={doctor.profilePicture} alt={`Dr. ${doctor.user.lastName}`} />
                    ) : (
                      <FaUserMd size={40} />
                    )}
                  </div>
                  <div className={styles.availabilityIndicator}>
                    <FaCircle className={styles.availableIcon} />
                    <span>Available Today</span>
                  </div>
                </div>
                
                <div className={styles.doctorInfo}>
                  <h4>Dr. {doctor.user.firstName} {doctor.user.lastName}</h4>
                  <p className={styles.specialization}>{doctor.specialization || 'General Practitioner'}</p>
                  <p className={styles.experience}>{doctor.experience || '5+'} years experience</p>
                  
                  {doctor.rating > 0 && (
                    <div className={styles.rating}>
                      <div className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.floor(doctor.rating) ? styles.starFilled : styles.starEmpty} 
                          />
                        ))}
                      </div>
                      <span className={styles.ratingText}>
                        {doctor.rating.toFixed(1)} ({doctor.totalRatings} reviews)
                      </span>
                    </div>
                  )}
                  
                  {doctor.fees && (
                    <div className={styles.feeInfo}>
                      <FaMoneyBillWave />
                      <span>Consultation Fee: ${doctor.fees}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.bookNowButton}>
                  <span>Book Now</span>
                  <FaChevronRight />
                </div>
              </div>
            ))}
          </div>
        )}

        <HelpText>
          All listed doctors are verified and available for appointments. 
          Virtual consultations are available for most specializations.
        </HelpText>
      </div>
    );
  };

  const renderDateSelection = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return (
      <div className={styles.selectionContainer}>
        <StepInstructions 
          step={2} 
          total={5} 
          instruction={STEP_INSTRUCTIONS[2]} 
        />
        
        <div className={styles.selectedDoctorInfo}>
          <FaUserMd />
          <span>Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}</span>
        </div>
        
        <div className={styles.calendarGrid}>
          {dates.map(date => {
            const formattedDate = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = date.toDateString() === today.toDateString();
            
            return (
              <div 
                key={formattedDate}
                className={`${styles.dateCard} ${isWeekend ? styles.weekend : ''} ${isToday ? styles.today : ''}`}
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
                {isToday && <div className={styles.todayLabel}>Today</div>}
              </div>
            );
          })}
        </div>
        
        <HelpText>
          Weekend appointments may be available for urgent consultations. 
          Contact support for special scheduling requests.
        </HelpText>
        
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
        <StepInstructions 
          step={3} 
          total={5} 
          instruction={STEP_INSTRUCTIONS[3]} 
        />
        
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
              <span>{slot.startTime} - {slot.endTime}</span>
              <div className={styles.slotInfo}>Available</div>
            </div>
          ))}
        </div>
        
        <HelpText>
          All times shown are in your local timezone. 
          Please arrive 15 minutes early for in-person appointments.
        </HelpText>
        
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
    return (
      <div className={styles.selectionContainer}>
        <StepInstructions 
          step={4} 
          total={5} 
          instruction={STEP_INSTRUCTIONS[4]} 
        />
        
        <div className={styles.appointmentSummary}>
          <h4>Appointment Summary</h4>
          <div className={styles.summaryItem}>
            <FaUserMd />
            <span>Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName} - {selectedDoctor.specialization || 'General Practitioner'}</span>
          </div>
          <div className={styles.summaryItem}>
            <FaCalendarAlt />
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
            <FaClock />
            <span>{appointmentData.startTime} - {appointmentData.endTime}</span>
          </div>
          {selectedDoctor.fees && (
            <div className={styles.summaryItem}>
              <FaMoneyBillWave />
              <span className={styles.fees}>Consultation Fee: ${selectedDoctor.fees}</span>
            </div>
          )}
        </div>
        
        <form onSubmit={handleFormSubmit} className={styles.appointmentForm}>
          <div className={styles.formGroup}>
            <label htmlFor="appointmentType">Appointment Type *</label>
            <select
              id="appointmentType"
              name="appointmentType"
              value={appointmentData.appointmentType}
              onChange={handleInputChange}
              className={styles.select}
              required
            >
              {APPOINTMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="reason">Reason for Visit *</label>
            <textarea
              id="reason"
              name="reason"
              value={appointmentData.reason}
              onChange={handleInputChange}
              className={`${styles.textarea} ${validationErrors.reason ? styles.inputError : ''}`}
              placeholder="Please describe the reason for your appointment (minimum 10 characters)"
              required
            />
            {validationErrors.reason && (
              <div className={styles.errorText}>
                <FaExclamationTriangle />
                {validationErrors.reason}
              </div>
            )}
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
                      <FaTimes />
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
                  <FaVideo />
                  <span>Video consultation - You'll receive a secure meeting link via email</span>
                </div>
              ) : (
                <div className={styles.typeInfo}>
                  <FaClinicMedical />
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
              placeholder="Any additional information you'd like to share with the doctor"
            />
          </div>
          
          <HelpText type="warning">
            Please ensure all information is accurate. 
            Changes may require rescheduling and additional fees.
          </HelpText>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => setCurrentStep(3)}
            >
              Back to Time Selection
            </button>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={submitting}
            >
              {submitting ? <><FaSpinner className={styles.buttonSpinner} /> Processing...</> : 'Review & Book Appointment'}
            </button>
          </div>
        </form>
      </div>

    );
  };

  // renderPayment function - corrected and complete
  const renderPayment = () => {
    return (
      <div className={styles.selectionContainer}>
        <StepInstructions 
          step={5} 
          total={5} 
          instruction={STEP_INSTRUCTIONS[5]} 
        />
        
        <div className={styles.appointmentSummary}>
          <h4>Final Appointment Summary</h4>
          <div className={styles.summaryItem}>
            <FaUserMd />
            <span>Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName} - {selectedDoctor.specialization || 'General Practitioner'}</span>
          </div>
          <div className={styles.summaryItem}>
            <FaCalendarAlt />
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
            <FaClock />
            <span>{appointmentData.startTime} - {appointmentData.endTime}</span>
          </div>
          <div className={styles.summaryItem}>
            {appointmentData.isVirtual ? <FaVideo /> : <FaClinicMedical />}
            <span>{appointmentData.isVirtual ? 'Virtual Appointment' : 'In-person Visit'}</span>
          </div>
          {selectedDoctor.fees && (
            <div className={styles.summaryItem}>
              <FaMoneyBillWave />
              <span className={styles.fees}>Total Amount: ${selectedDoctor.fees}</span>
            </div>
          )}
        </div>

        <div className={styles.paymentSection}>
          <h4>
            <FaMoneyBillWave style={{ marginRight: '10px' }} />
            Complete Payment
          </h4>
          
          <MpesaPayment 
            appointmentId={createdAppointmentId} 
            appointmentDetails={{
              fee: selectedDoctor.fees || 0,
              doctor: `Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`,
              date: new Date(appointmentData.appointmentDate).toLocaleDateString(),
              time: `${appointmentData.startTime} - ${appointmentData.endTime}`
            }}
            onSuccess={handlePaymentSuccess}
            onBack={() => setCurrentStep(4)}
          />
        </div>
      </div>
    );
  };

  // Main render logic
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          setError(null);
          if (currentStep === 1) {
            fetchDoctors();
          } else if (currentStep === 3) {
            fetchAvailableSlots(appointmentData.doctorId, appointmentData.appointmentDate);
          }
        }} 
      />
    );
  }

  if (successMessage) {
    return (
      <div className={styles.successContainer}>
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
        {renderStepProgress()}
      </div>

      <div className={styles.bookingContent}>
        {submitting && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner message={loadingMessage} />
          </div>
        )}
        
        {currentStep === 1 && renderDoctorSelection()}
        {currentStep === 2 && renderDateSelection()}
        {currentStep === 3 && renderTimeSelection()}
        {currentStep === 4 && renderAppointmentDetails()}
        {currentStep === 5 && renderPayment()}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmBooking}
        appointmentData={appointmentData}
        doctor={selectedDoctor}
      />
    </div>
  );
};

export default AppointmentBooking;