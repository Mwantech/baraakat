import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import styles from './PatientProfile.module.css';

const PatientProfile = () => {
  const { currentUser, getUserRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  // Fetch patient profile
  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const response = await api.get('/profiles/patients-profile');
        setProfile(response.data);
        
        // Populate form data if profile exists
        if (response.data) {
          setFormData({
            dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
            gender: response.data.gender || '',
            bloodGroup: response.data.bloodGroup || '',
            address: response.data.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            },
            emergencyContact: response.data.emergencyContact || {
              name: '',
              relationship: '',
              phone: ''
            }
          });
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch patient profile');
        setLoading(false);
      }
    };

    // Only fetch if user is a patient
    if (getUserRole() === 'patient') {
      fetchPatientProfile();
    }
  }, [getUserRole]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address and emergency contact fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('emergencyContact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Submit profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/profiles/patients-profile', formData);
      setProfile(response.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return <div className={styles.loadingState}>Loading patient profile...</div>;
  }

  // Render error state
  if (error) {
    return <div className={styles.errorMessage}>Error: {error}</div>;
  }

  // Render profile view or edit form
  return (
    <div className={styles.patientProfileContainer}>
      <h1 className={styles.pageTitle}>Patient Profile</h1>
      
      {!isEditing ? (
        <div className={styles.profileView}>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Name:</span> 
            {currentUser?.firstName} {currentUser?.lastName}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Email:</span> 
            {currentUser?.email}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Date of Birth:</span> 
            {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Gender:</span> 
            {profile?.gender || 'Not set'}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Blood Group:</span> 
            {profile?.bloodGroup || 'Not set'}
          </div>
          
          {profile?.address && (
            <div className={styles.profileInfoItem}>
              <span className={styles.infoLabel}>Address:</span>
              <p>
                {profile.address.street}, 
                {profile.address.city}, 
                {profile.address.state} 
                {profile.address.zipCode}
                {profile.address.country}
              </p>
            </div>
          )}
          
          {profile?.emergencyContact && (
            <div className={styles.profileInfoItem}>
              <span className={styles.infoLabel}>Emergency Contact:</span>
              <p>
                {profile.emergencyContact.name} 
                ({profile.emergencyContact.relationship})
                {profile.emergencyContact.phone}
              </p>
            </div>
          )}
          
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.button} ${styles.editButton}`} 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.editProfileForm}>
          <div className={styles.formGroup}>
            <label>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Blood Group</label>
            <select
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
          
          <div className={styles.formGroup}>
            <label>Street</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>City</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>State</label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Zip Code</label>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Country</label>
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Emergency Contact Name</label>
            <input
              type="text"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Emergency Contact Relationship</label>
            <input
              type="text"
              name="emergencyContact.relationship"
              value={formData.emergencyContact.relationship}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Emergency Contact Phone</label>
            <input
              type="text"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              type="submit" 
              className={`${styles.button} ${styles.saveButton}`}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save Profile'}
            </button>
            <button 
              type="button" 
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientProfile;