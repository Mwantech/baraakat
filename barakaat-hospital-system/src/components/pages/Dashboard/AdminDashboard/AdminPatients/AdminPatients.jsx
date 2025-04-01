import React, { useState, useEffect } from 'react';
import { api } from '../../../../../contexts/AuthContext';
import styles from './AdminPatients.module.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [viewAdmin, setViewAdmin] = useState(null);

  // Fetch list of admins from the backend
  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/admins');
      // assuming response.data.admins returns an array of admin users
      setAdmins(response.data.admins);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admins');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin((prev) => ({ ...prev, [name]: value }));
  };

  // Add a new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/add', newAdmin);
      const addedAdmin = response.data.admin;
      setAdmins((prev) => [...prev, addedAdmin]);
      // Reset the form
      setNewAdmin({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add admin');
    }
  };

  // Delete an admin
  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await api.delete(`/admin/admins/${adminId}`);
      setAdmins((prev) => prev.filter((admin) => admin._id !== adminId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete admin');
    }
  };

  // View admin details (opens a modal)
  const handleViewAdmin = async (adminId) => {
    try {
      const response = await api.get(`/admin/admins/${adminId}`);
      setViewAdmin(response.data.admin);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch admin details');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Manage Admins</h2>
      <div className={styles.content}>
        {/* Admins List */}
        <div className={styles.adminList}>
          <h3>Admins List</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.firstName} {admin.lastName}</td>
                    <td>{admin.email}</td>
                    <td>{admin.phone}</td>
                    <td>
                      <button onClick={() => handleViewAdmin(admin._id)}>View</button>
                      <button onClick={() => handleDeleteAdmin(admin._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Admin Form */}
        <div className={styles.addAdmin}>
          <h3>Add Admin</h3>
          <form onSubmit={handleAddAdmin} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={newAdmin.email} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={newAdmin.password} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input 
                type="text" 
                name="firstName" 
                value={newAdmin.firstName} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input 
                type="text" 
                name="lastName" 
                value={newAdmin.lastName} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phone</label>
              <input 
                type="text" 
                name="phone" 
                value={newAdmin.phone} 
                onChange={handleInputChange} 
              />
            </div>
            <button type="submit">Add Admin</button>
          </form>
        </div>
      </div>

      {/* Admin Details Modal */}
      {viewAdmin && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Admin Details</h3>
            <p>
              <strong>Name:</strong> {viewAdmin.firstName} {viewAdmin.lastName}
            </p>
            <p>
              <strong>Email:</strong> {viewAdmin.email}
            </p>
            <p>
              <strong>Phone:</strong> {viewAdmin.phone}
            </p>
            <button onClick={() => setViewAdmin(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
