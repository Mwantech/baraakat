import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './SignIn.module.css';

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check if password is entered
    if (!formData.password) {
      setError('Please enter your password');
      return false;
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
    
    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        // Get user role from the result
        const userRole = result.user?.role || localStorage.getItem('userRole');
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'patient') {
          navigate('/dashboard/patient');
        } else if (userRole === 'doctor') {
          navigate('/dashboard/doctor');
        } else if (userRole === 'admin') {
          navigate('/dashboard/admin');
        } else {
          // Default fallback
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signinContainer}>
      <Header />
      
      <main className={styles.mainContent}>
        <div className={styles.formContainer}>
          <h1>Sign In</h1>
          
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
                </div>

                <div 
                  className={styles.roleCard}
                  onClick={() => handleRoleSelect('doctor')}
                >
                  <div className={styles.roleIcon}>👨‍⚕️</div>
                  <h3>Doctor</h3>
                </div>

                <div 
                  className={styles.roleCard}
                  onClick={() => handleRoleSelect('admin')}
                >
                  <div className={styles.roleIcon}>👨‍💼</div>
                  <h3>Admin</h3>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.signinForm}>
              <div className={styles.selectedRole}>
                <p>Signing in as: <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong></p>
                <button 
                  type="button" 
                  className={styles.changeRoleButton}
                  onClick={() => setRole('')}
                  disabled={loading}
                >
                  Change
                </button>
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className={styles.forgotPassword}>
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          <div className={styles.formFooter}>
            <p>Don't have an account? <Link to="/signup">Create Account</Link></p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignIn;