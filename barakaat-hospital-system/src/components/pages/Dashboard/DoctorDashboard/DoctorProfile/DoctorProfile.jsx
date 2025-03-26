import React, { useState, useEffect } from 'react';
import { useAuth, api} from '../../../../../contexts/AuthContext';
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
        const response = await api.get('/profiles/doctors-profile');
        setProfile(response.data);
        
        // Populate form data if profile exists
        if (response.data) {
          setFormData({
            specialization: response.data.specialization || '',
            qualification: response.data.qualification || [],
            licenseNumber: response.data.licenseNumber || '',
            experience: response.data.experience || 0,
            department: response.data.department || '',
            fees: response.data.fees || 0,
            bio: response.data.bio || '',
            availableTime: response.data.availableTime || [],
            isAvailable: response.data.isAvailable ?? true
          });
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch doctor profile');
        setLoading(false);
      }
    };

    // Only fetch if user is a doctor
    if (getUserRole() === 'doctor') {
      fetchDoctorProfile();
    }
  }, [getUserRole]);

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
      const response = await api.put('/profiles/doctors-profile', formData);
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
    return <div className={styles.loadingMessage}>Loading doctor profile...</div>;
  }

  // Render error state
  if (error) {
    return <div className={styles.errorMessage}>Error: {error}</div>;
  }

  // Render profile view or edit form
  return (
    <div className="doctor-profile-container">
      <h1>Doctor Profile</h1>
      
      {!isEditing ? (
        <div className="profile-view">
          <div>
            <strong>Name:</strong> {currentUser?.firstName} {currentUser?.lastName}
          </div>
          <div>
            <strong>Email:</strong> {currentUser?.email}
          </div>
          <div>
            <strong>Specialization:</strong> {profile?.specialization || 'Not set'}
          </div>
          <div>
            <strong>Qualifications:</strong> {profile?.qualification?.join(', ') || 'Not set'}
          </div>
          <div>
            <strong>License Number:</strong> {profile?.licenseNumber || 'Not set'}
          </div>
          <div>
            <strong>Experience:</strong> {profile?.experience || 0} years
          </div>
          <div>
            <strong>Department:</strong> {profile?.department || 'Not set'}
          </div>
          <div>
            <strong>Consultation Fees:</strong> ${profile?.fees || 0}
          </div>
          <div>
            <strong>Availability:</strong> {profile?.isAvailable ? 'Available' : 'Not Available'}
          </div>
          
          {profile?.bio && (
            <div>
              <strong>Bio:</strong>
              <p>{profile.bio}</p>
            </div>
          )}
          
          {profile?.availableTime && profile.availableTime.length > 0 && (
            <div>
              <strong>Available Time Slots:</strong>
              {profile.availableTime.map((slot, index) => (
                <div key={index}>
                  {slot.day}: {slot.startTime} - {slot.endTime} 
                  (Slot Duration: {slot.slotDuration} mins)
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>Qualifications (comma-separated)</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification.join(', ')}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label>License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>Years of Experience</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>Consultation Fees ($)</label>
            <input
              type="number"
              name="fees"
              value={formData.fees}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label>
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
              />
              Currently Available
            </label>
          </div>
          
          <div>
            <h3>Available Time Slots</h3>
            {formData.availableTime.map((slot, index) => (
              <div key={index}>
                <select
                  value={slot.day}
                  onChange={(e) => handleAvailabilityChange(index, 'day', e.target.value)}
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
                />
                
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                />
                
                <input
                  type="number"
                  placeholder="Slot Duration (mins)"
                  value={slot.slotDuration}
                  onChange={(e) => handleAvailabilityChange(index, 'slotDuration', e.target.value)}
                />
                
                <button type="button" onClick={() => removeAvailabilitySlot(index)}>
                  Remove
                </button>
              </div>
            ))}
            
            <button type="button" onClick={addAvailabilitySlot}>
              Add Time Slot
            </button>
          </div>
          
          <div>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Save Profile'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DoctorProfile;