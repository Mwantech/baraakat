import React, { useState, useEffect } from 'react';
import { api } from '../../../../../contexts/AuthContext';
import styles from './AdminManagement.module.css';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch list of admins from the backend
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/admins');
      // assuming response.data.admins returns an array of admin users
      setAdmins(response.data.admins || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to fetch admins. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cleanup function to handle component unmounting
    let isMounted = true;
    
    const getAdmins = async () => {
      try {
        const response = await api.get('/admin/admins');
        if (isMounted) {
          setAdmins(response.data.admins || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching admins:', err);
          setError('Failed to fetch admins. Please try again later.');
          setLoading(false);
        }
      }
    };

    getAdmins();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
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
      
      // Update the admins list
      setAdmins((prev) => [...prev, addedAdmin]);
      
      // Reset the form
      setNewAdmin({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: ''
      });

      alert('Admin added successfully!');
    } catch (err) {
      console.error('Error adding admin:', err);
      alert(`Failed to add admin: ${err.response?.data?.message || 'Unknown error'}`);
    }
  };

  // Delete an admin
  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      await api.delete(`/admin/admins/${adminId}`);
      setAdmins((prev) => prev.filter((admin) => admin._id !== adminId));
      alert('Admin deleted successfully');
    } catch (err) {
      console.error('Error deleting admin:', err);
      alert(`Failed to delete admin: ${err.response?.data?.message || 'Unknown error'}`);
    }
  };

  // View admin details (opens a modal)
  const handleViewAdmin = async (adminId) => {
    try {
      const response = await api.get(`/admin/admins/${adminId}`);
      setViewAdmin(response.data.admin);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching admin details:', err);
      alert('Failed to fetch admin details. Please try again later.');
    }
  };

  // Close the modal
  const closeModal = () => {
    setViewAdmin(null);
    setIsModalOpen(false);
  };

  // Refresh admin list
  const refreshAdminList = () => {
    fetchAdmins();
  };

  return (
    <div className={styles.adminManagementContainer}>
      <h2>Manage Admins</h2>
      
      <div className={styles.refreshButton}>
        <button onClick={refreshAdminList}>Refresh List</button>
      </div>
      
      <div className={styles.content}>
        {/* Admins List */}
        <div className={styles.adminList}>
          <h3>Admins List</h3>
          {loading ? (
            <p>Loading admins...</p>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={refreshAdminList}>Try Again</button>
            </div>
          ) : admins.length === 0 ? (
            <p>No admins found. Add your first admin using the form.</p>
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
                    <td>{admin.phone || 'N/A'}</td>
                    <td className={styles.actionButtons}>
                      <button 
                        className={styles.viewButton} 
                        onClick={() => handleViewAdmin(admin._id)}
                      >
                        View
                      </button>
                      <button 
                        className={styles.deleteButton} 
                        onClick={() => handleDeleteAdmin(admin._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Admin Form */}
        <div className={styles.addAdmin}>
          <h3>Add New Admin</h3>
          <form onSubmit={handleAddAdmin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                name="email" 
                value={newAdmin.email} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password"
                name="password" 
                value={newAdmin.password} 
                onChange={handleInputChange} 
                required 
                minLength="6"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName"
                name="firstName" 
                value={newAdmin.firstName} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName"
                name="lastName" 
                value={newAdmin.lastName} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone</label>
              <input 
                type="tel" 
                id="phone"
                name="phone" 
                value={newAdmin.phone} 
                onChange={handleInputChange} 
              />
            </div>
            <button type="submit" className={styles.submitButton}>Add Admin</button>
          </form>
        </div>
      </div>

      {/* Admin Details Modal */}
      {isModalOpen && viewAdmin && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <span className={styles.closeButton} onClick={closeModal}>&times;</span>
            <h3>Admin Details</h3>
            <div className={styles.adminDetails}>
              <p>
                <strong>Name:</strong> {viewAdmin.firstName} {viewAdmin.lastName}
              </p>
              <p>
                <strong>Email:</strong> {viewAdmin.email}
              </p>
              <p>
                <strong>Phone:</strong> {viewAdmin.phone || 'N/A'}
              </p>
              <p>
                <strong>ID:</strong> {viewAdmin._id}
              </p>
              {viewAdmin.createdAt && (
                <p>
                  <strong>Created:</strong> {new Date(viewAdmin.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            <button className={styles.closeModalButton} onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;