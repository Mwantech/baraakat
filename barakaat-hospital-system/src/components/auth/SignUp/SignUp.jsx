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
    specialization: '',  // For doctors only
    licenseNumber: '',   // For doctors only
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
              <div className={styles.formGroup}>
                <label htmlFor="firstName">First Name</label>
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
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
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
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {role === 'doctor' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="specialization">Specialization</label>
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
                    <label htmlFor="licenseNumber">Medical License Number</label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                    />
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