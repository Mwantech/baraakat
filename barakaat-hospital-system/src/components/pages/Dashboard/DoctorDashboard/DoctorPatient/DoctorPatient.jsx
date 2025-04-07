import React, { useState, useEffect } from 'react';
import styles from './DoctorPatient.module.css';
import { useAuth, api } from '../../../../../contexts/AuthContext';

const PatientList = () => {
  // Get auth context
  const { getToken, getUserRole } = useAuth();
  
  // State for patients data and loading status
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  
  // State for filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    bloodGroup: '',
    hasAllergies: '',
    minAge: '',
    maxAge: ''
  });
  
  // State for filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Function to fetch patients
  const fetchPatients = async (searchParam = null) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      // Add search param if provided
      if (searchParam) {
        params.append('search', searchParam);
      }
      
      // Add other filters
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
      if (filters.hasAllergies) params.append('hasAllergies', filters.hasAllergies);
      if (filters.minAge) params.append('minAge', filters.minAge);
      if (filters.maxAge) params.append('maxAge', filters.maxAge);
      
      // Make API request using the api instance from auth context
      const response = await api.get(`/patients?${params.toString()}`);
      
      // Handle the response
      if (response.data?.data) {
        setPatients(response.data.data);
        setTotalPages(response.data.pages || 1);
        setTotalPatients(response.data.total || 0);
      } else {
        // If data is not in the expected format, initialize with empty array
        setPatients([]);
        setTotalPages(1);
        setTotalPatients(0);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.response?.data?.message || 'Failed to fetch patients');
      setPatients([]); // Initialize with empty array on error
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(search);
    setSearch(''); // Clear search bar after submitting
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when applying filters
    fetchPatients(search);
    setShowFilterModal(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      gender: '',
      bloodGroup: '',
      hasAllergies: '',
      minAge: '',
      maxAge: ''
    });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Initial data fetch - depends on page and limit
  useEffect(() => {
    fetchPatients();
  }, [page, limit]);

  // Calculate the age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Patient Management</h1>
        <div className={styles.actions}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
          <button 
            className={styles.filterButton}
            onClick={() => setShowFilterModal(true)}
          >
            Filter
          </button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading patients...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => fetchPatients()}>Try Again</button>
        </div>
      ) : (
        <>
          <div className={styles.patientCount}>
            <p>Showing {patients.length} of {totalPatients} patients</p>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.patientTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients && patients.length > 0 ? (
                  patients.map(patient => (
                    <tr key={patient._id}>
                      <td>
                        <div className={styles.patientName}>
                          {patient.user?.firstName} {patient.user?.lastName}
                        </div>
                        <div className={styles.patientEmail}>{patient.user?.email}</div>
                      </td>
                      <td>{patient.gender || 'N/A'}</td>
                      <td>{patient.bloodGroup || 'N/A'}</td>
                      <td>{calculateAge(patient.dateOfBirth)} years</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.viewButton}>View</button>
                          <button className={styles.editButton}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.noPatients}>
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 0 && (
            <div className={styles.pagination}>
              <button 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1}
                className={styles.pageButton}
              >
                Previous
              </button>
              
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Logic to show pages around the current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`${styles.pageNumberButton} ${pageNum === page ? styles.activePage : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className={styles.ellipsis}>...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={styles.pageNumberButton}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.filterModal}>
            <h2>Filter Patients</h2>
            
            <div className={styles.filterGroup}>
              <label htmlFor="gender">Gender</label>
              <select 
                id="gender" 
                name="gender" 
                value={filters.gender} 
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="bloodGroup">Blood Group</label>
              <select 
                id="bloodGroup" 
                name="bloodGroup" 
                value={filters.bloodGroup} 
                onChange={handleFilterChange}
              >
                <option value="">All</option>
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
            
            <div className={styles.filterGroup}>
              <label htmlFor="hasAllergies">Allergies</label>
              <select 
                id="hasAllergies" 
                name="hasAllergies" 
                value={filters.hasAllergies} 
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Has Allergies</option>
                <option value="false">No Allergies</option>
              </select>
            </div>
            
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="minAge">Min Age</label>
                <input 
                  type="number" 
                  id="minAge" 
                  name="minAge" 
                  value={filters.minAge} 
                  onChange={handleFilterChange}
                  min="0"
                />
              </div>
              
              <div className={styles.filterGroup}>
                <label htmlFor="maxAge">Max Age</label>
                <input 
                  type="number" 
                  id="maxAge" 
                  name="maxAge" 
                  value={filters.maxAge} 
                  onChange={handleFilterChange}
                  min="0"
                />
              </div>
            </div>
            
            <div className={styles.modalButtons}>
              <button 
                className={styles.clearButton} 
                onClick={clearFilters}
              >
                Clear All
              </button>
              <button 
                className={styles.applyButton} 
                onClick={applyFilters}
              >
                Apply Filters
              </button>
              <button 
                className={styles.closeButton} 
                onClick={() => setShowFilterModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;