import React, { useState } from 'react';
import styles from './ForgotPassword.module.css';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('patient');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setMessage('Password reset instructions have been sent to your email.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
    <Header />
    <div className={styles.container}>
      <div className={`${styles.card} ${styles[userRole]}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Forgot Password</h1>
          <p className={styles.subtitle}>
            {userRole === 'patient' && 'Patient Portal'}
            {userRole === 'doctor' && 'Healthcare Provider Portal'}
            {userRole === 'admin' && 'Administration Portal'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.roleSelector}>
            <label className={styles.label}>Select your role:</label>
            <div className={styles.roleButtons}>
              <button 
                type="button" 
                className={`${styles.roleButton} ${userRole === 'patient' ? styles.activeRole : ''}`}
                onClick={() => setUserRole('patient')}
              >
                Patient
              </button>
              <button 
                type="button" 
                className={`${styles.roleButton} ${userRole === 'doctor' ? styles.activeRole : ''}`}
                onClick={() => setUserRole('doctor')}
              >
                Doctor
              </button>
              <button 
                type="button" 
                className={`${styles.roleButton} ${userRole === 'admin' ? styles.activeRole : ''}`}
                onClick={() => setUserRole('admin')}
              >
                Admin
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Enter your registered email"
              required
            />
          </div>
          
          {message && <div className={styles.message}>{message}</div>}
          
          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Reset Password'}
          </button>
          
          <div className={styles.links}>
            <a href="/SignIn" className={styles.link}>Back to Login</a>
          </div>
        </form>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default ForgotPassword;