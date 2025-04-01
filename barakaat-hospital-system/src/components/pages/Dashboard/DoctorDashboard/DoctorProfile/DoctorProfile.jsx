import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import styles from './DoctorProfile.module.css';

const DoctorProfile = () => {
  const { currentUser, getUserRole } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    specialization: '',
    qualification: [],
    licenseNumber: '',
    experience: 0,
    department: '',
    fees: 0,
    bio: '',
    availableTime: [],
    isAvailable: true
  });

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        // Updated API endpoint to match backend controller
        const response = await api.get('/profile/doctor');
        
        // The backend returns both user and doctor data
        if (response.data && response.data.doctor) {
          setProfile(response.data.doctor);
          
          // Populate form data with doctor profile
          setFormData({
            specialization: response.data.doctor.specialization || '',
            qualification: response.data.doctor.qualification || [],
            licenseNumber: response.data.doctor.licenseNumber || '',
            experience: response.data.doctor.experience || 0,
            department: response.data.doctor.department || '',
            fees: response.data.doctor.fees || 0,
            bio: response.data.doctor.bio || '',
            availableTime: response.data.doctor.availableTime || [],
            isAvailable: response.data.doctor.isAvailable ?? true
          });
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch doctor profile');
        setLoading(false);
      }
    };

    // Only fetch if user is a doctor
    if (currentUser && getUserRole() === 'doctor') {
      fetchDoctorProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser, getUserRole]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle special cases
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'qualification') {
      // Handle qualifications as an array
      setFormData(prev => ({
        ...prev,
        qualification: value.split(',').map(q => q.trim())
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle availability time changes
  const handleAvailabilityChange = (index, field, value) => {
    const updatedAvailableTime = [...formData.availableTime];
    updatedAvailableTime[index] = {
      ...updatedAvailableTime[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      availableTime: updatedAvailableTime
    }));
  };

  // Add new availability slot
  const addAvailabilitySlot = () => {
    setFormData(prev => ({
      ...prev,
      availableTime: [
        ...prev.availableTime,
        { 
          day: 'monday', 
          startTime: '09:00', 
          endTime: '17:00', 
          slotDuration: 30 
        }
      ]
    }));
  };

  // Remove availability slot
  const removeAvailabilitySlot = (index) => {
    const updatedAvailableTime = formData.availableTime.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      availableTime: updatedAvailableTime
    }));
  };

  // Submit profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Updated API endpoint to match backend controller
      const response = await api.put('/profile/doctor', formData);
      
      // The backend returns both user and doctor data
      if (response.data && response.data.doctor) {
        setProfile(response.data.doctor);
      }
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
    return <div className={styles.loadingMessage}>Loading doctor profile...</div>;
  }

  // Render error state
  if (error) {
    return <div className={styles.errorMessage}>Error: {error}</div>;
  }

  // Render profile view or edit form
  return (
    <div className={styles.doctorProfileContainer}>
      <h1 className={styles.pageTitle}>Doctor Profile</h1>
      
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
            <span className={styles.infoLabel}>Specialization:</span> 
            {profile?.specialization || 'Not set'}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Qualifications:</span> 
            {profile?.qualification?.join(', ') || 'Not set'}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>License Number:</span> 
            {profile?.licenseNumber || 'Not set'}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Experience:</span> 
            {profile?.experience || 0} years
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Department:</span> 
            {profile?.department || 'Not set'}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Consultation Fees:</span> 
            ${profile?.fees || 0}
          </div>
          <div className={styles.profileInfoItem}>
            <span className={styles.infoLabel}>Availability:</span> 
            {profile?.isAvailable ? 'Available' : 'Not Available'}
          </div>
          
          {profile?.bio && (
            <div className={styles.profileInfoItem}>
              <span className={styles.infoLabel}>Bio:</span>
              <p>{profile.bio}</p>
            </div>
          )}
          
          {profile?.availableTime && profile.availableTime.length > 0 && (
            <div className={styles.profileInfoItem}>
              <span className={styles.infoLabel}>Available Time Slots:</span>
              {profile.availableTime.map((slot, index) => (
                <div key={index} className={styles.timeSlot}>
                  {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}: {slot.startTime} - {slot.endTime} 
                  (Slot Duration: {slot.slotDuration} mins)
                </div>
              ))}
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
            <label>Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Qualifications (comma-separated)</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification.join(', ')}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Years of Experience</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Consultation Fees ($)</label>
            <input
              type="number"
              name="fees"
              value={formData.fees}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className={styles.bioTextarea}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
              />
              Currently Available
            </label>
          </div>
          
          <div className={styles.formGroup}>
            <h3>Available Time Slots</h3>
            {formData.availableTime.map((slot, index) => (
              <div key={index} className={styles.timeSlotForm}>
                <select
                  value={slot.day}
                  onChange={(e) => handleAvailabilityChange(index, 'day', e.target.value)}
                  className={styles.daySelect}
                >
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                    .map(day => (
                      <option key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))
                  }
                </select>
                
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                  className={styles.timeInput}
                />
                
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                  className={styles.timeInput}
                />
                
                <input
                  type="number"
                  placeholder="Slot Duration (mins)"
                  value={slot.slotDuration}
                  onChange={(e) => handleAvailabilityChange(index, 'slotDuration', e.target.value)}
                  className={styles.durationInput}
                />
                
                <button 
                  type="button" 
                  onClick={() => removeAvailabilitySlot(index)}
                  className={`${styles.button} ${styles.removeButton}`}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={addAvailabilitySlot}
              className={`${styles.button} ${styles.addButton}`}
            >
              Add Time Slot
            </button>
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

export default DoctorProfile;