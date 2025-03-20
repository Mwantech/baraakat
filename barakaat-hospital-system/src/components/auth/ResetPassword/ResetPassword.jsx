import React, { useState, useEffect } from 'react';
import styles from './ResetPassword.module.css';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('patient');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const roleParam = params.get('role');
    
    if (tokenParam) setToken(tokenParam);
    if (roleParam && ['patient', 'doctor', 'admin'].includes(roleParam)) {
      setUserRole(roleParam);
    }
  }, []);

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 3) {
      setMessage('Please choose a stronger password');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setMessage('Your password has been reset successfully. You can now login with your new password.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
    <Header/>
    <div className={styles.container}>
      <div className={`${styles.card} ${styles[userRole]}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>
            {userRole === 'patient' && 'Patient Portal'}
            {userRole === 'doctor' && 'Healthcare Provider Portal'}
            {userRole === 'admin' && 'Administration Portal'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className={styles.input}
              placeholder="Enter new password"
              required
            />
            {password && (
              <div className={styles.strengthMeter}>
                <div 
                  className={styles.strengthIndicator}
                  style={{ width: `${25 * passwordStrength}%` }}
                  data-strength={passwordStrength}
                />
                <span className={styles.strengthText}>
                  {passwordStrength === 0 && 'Very Weak'}
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Medium'}
                  {passwordStrength === 3 && 'Strong'}
                  {passwordStrength === 4 && 'Very Strong'}
                </span>
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Confirm new password"
              required
            />
          </div>
          
          <div className={styles.requirements}>
            <p className={styles.requirementTitle}>Password must contain:</p>
            <ul className={styles.requirementList}>
              <li className={password.length >= 8 ? styles.met : ''}>At least 8 characters</li>
              <li className={/[A-Z]/.test(password) ? styles.met : ''}>At least one uppercase letter</li>
              <li className={/[0-9]/.test(password) ? styles.met : ''}>At least one number</li>
              <li className={/[^A-Za-z0-9]/.test(password) ? styles.met : ''}>At least one special character</li>
            </ul>
          </div>
          
          {message && <div className={styles.message}>{message}</div>}
          
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? 'Updating...' : 'Set New Password'}
          </button>
          
          <div className={styles.links}>
            <a href="/login" className={styles.link}>Back to Login</a>
          </div>
        </form>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default ResetPassword;