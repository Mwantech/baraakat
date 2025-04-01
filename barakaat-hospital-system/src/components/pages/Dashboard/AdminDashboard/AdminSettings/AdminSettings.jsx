import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import styles from './AdminSettings.module.css';

const AdminSettings = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Populate form with current admin data when available
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        email: currentUser.email || '',
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate passwords match if a new password is provided
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Build payload (only include password if provided)
    const payload = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      setLoading(true);
      // Update current admin details via PUT /admin/admins/:adminId
      const response = await api.put(`/admin/admins/${currentUser._id}`, payload);
      setMessage(response.data.message || 'Settings updated successfully.');
      setLoading(false);
      // Optionally, you may want to refresh currentUser info in your AuthContext here.
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update settings.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <h2>Admin Settings</h2>
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
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
          <label htmlFor="firstName">First Name:</label>
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
          <label htmlFor="lastName">Last Name:</label>
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
          <label htmlFor="phone">Phone:</label>
          <input 
            type="text" 
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">New Password:</label>
          <input 
            type="password" 
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input 
            type="password" 
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Settings'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
