// components/AdminDoctors/AdminDoctors.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../../../contexts/AuthContext';
import styles from './AdminDoctors.module.css';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setDoctors(response.data.doctors);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Failed to fetch doctors');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const approveDoctor = async (doctorId) => {
    try {
      await api.put(`/admin/doctors/${doctorId}/approve`);
      setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc._id === doctorId ? { ...doc, isVerified: true } : doc
        )
      );
    } catch (err) {
      console.error('Failed to approve doctor:', err);
    }
  };

  const deleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await api.delete(`/admin/doctors/${doctorId}`);
      setDoctors((prevDoctors) =>
        prevDoctors.filter((doc) => doc._id !== doctorId)
      );
    } catch (err) {
      console.error('Failed to delete doctor:', err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading doctors...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Manage Doctors</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Department</th>
              <th>License Number</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length > 0 ? (
              doctors.map((doctor) => (
                <tr key={doctor._id}>
                  <td>
                    {doctor.user?.firstName} {doctor.user?.lastName}
                  </td>
                  <td>{doctor.specialization}</td>
                  <td>{doctor.department}</td>
                  <td>{doctor.licenseNumber}</td>
                  <td className={doctor.isVerified ? styles.verified : styles.unverified}>
                    {doctor.isVerified ? 'Yes' : 'No'}
                  </td>
                  <td className={styles.actions}>
                    {!doctor.isVerified && (
                      <button 
                        className={`${styles.button} ${styles.approve}`}
                        onClick={() => approveDoctor(doctor._id)}
                      >
                        Approve
                      </button>
                    )}
                    <Link 
                      className={`${styles.button} ${styles.view}`}
                      to={`/dashboard/admin/doctors/${doctor._id}`}
                    >
                      View
                    </Link>
                    <button 
                      className={`${styles.button} ${styles.delete}`}
                      onClick={() => deleteDoctor(doctor._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noDoctors}>No doctors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDoctors;