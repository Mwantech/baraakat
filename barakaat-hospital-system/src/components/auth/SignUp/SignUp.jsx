import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './SignUp.module.css';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Patient specific fields
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    // Doctor specific fields
    specialization: '',
    licenseNumber: '',
    qualification: '',
    experience: '',
    department: '',
    fees: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    // Check if role is selected
    if (!role) {
      setError('Please select a role');
      return false;
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Check password strength (at least 8 characters)
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check if required fields are filled
    if (!formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return false;
    }
    
    // Check if doctor-specific fields are filled if role is doctor
    if (role === 'doctor') {
      if (!formData.specialization) {
        setError('Please select a specialization');
        return false;
      }
      if (!formData.licenseNumber) {
        setError('Please enter your medical license number');
        return false;
      }
    }
    
    // Check if patient-specific required fields are filled if role is patient
    if (role === 'patient') {
      if (!formData.dateOfBirth) {
        setError('Please enter your date of birth');
        return false;
      }
      if (!formData.gender) {
        setError('Please select your gender');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await signUp(formData, role);
      
      if (result.success) {
        setSuccessMessage('Registration successful! Redirecting to dashboard...');
        
        // Show success message for a moment before redirecting
        setTimeout(() => {
          // Redirect to appropriate dashboard based on role
          if (role === 'patient') {
            navigate('/dashboard/patient');
          } else if (role === 'doctor') {
            navigate('/dashboard/doctor');
          } else if (role === 'admin') {
            navigate('/dashboard/admin');
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <Header />
      
      <main className={styles.mainContent}>
        <div className={styles.formContainer}>
          <h1>Create an Account</h1>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className={styles.successMessage}>
              {successMessage}
            </div>
          )}
          
          {!role ? (
            <div className={styles.roleSelection}>
              <h2>Select Your Role</h2>
              <div className={styles.roleOptions}>
                <div 
                  className={styles.roleCard}
                  onClick={() => handleRoleSelect('patient')}
                >
                  <div className={styles.roleIcon}>👤</div>
                  <h3>Patient</h3>
                  <p>Create an account to book appointments and access your medical records</p>
                </div>

                <div 
                  className={styles.roleCard}
                  onClick={() => handleRoleSelect('doctor')}
                >
                  <div className={styles.roleIcon}>👨‍⚕️</div>
                  <h3>Doctor</h3>
                  <p>Join our network of healthcare professionals</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.signupForm}>
              {/* Common fields for all users */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name*</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name*</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password">Password*</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                  />
                  <small className={styles.passwordHint}>
                    Password must be at least 8 characters long
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm Password*</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Patient-specific fields */}
              {role === 'patient' && (
                <>
                  <h3 className={styles.sectionTitle}>Patient Information</h3>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="dateOfBirth">Date of Birth*</label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="gender">Gender*</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bloodGroup">Blood Group</label>
                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </>
              )}

              {/* Doctor-specific fields */}
              {role === 'doctor' && (
                <>
                  <h3 className={styles.sectionTitle}>Professional Information</h3>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="specialization">Specialization*</label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Specialization</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="dermatology">Dermatology</option>
                        <option value="neurology">Neurology</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="psychiatry">Psychiatry</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="gynecology">Gynecology</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="licenseNumber">Medical License Number*</label>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="qualification">Qualifications</label>
                      <input
                        type="text"
                        id="qualification"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        placeholder="e.g., MD, PhD, MBBS"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="experience">Experience (years)</label>
                      <input
                        type="number"
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="fees">Consultation Fees</label>
                    <input
                      type="number"
                      id="fees"
                      name="fees"
                      value={formData.fees}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bio">Professional Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Tell patients about your professional background and approach"
                    ></textarea>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <button 
                type="button" 
                className={styles.backButton}
                onClick={() => setRole('')}
                disabled={loading}
              >
                Back to Role Selection
              </button>
            </form>
          )}

          <div className={styles.formFooter}>
            <p>Already have an account? <Link to="/signin">Sign In</Link></p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignUp;