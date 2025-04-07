import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { api } from '../../../../contexts/AuthContext';
import Header from '../../../common/Header/Header';
import styles from './DoctorDashboard.module.css';

const DoctorDashboard = () => {
  const { currentUser, signOut } = useAuth();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    activePrescriptions: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingRefills, setPendingRefills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Get doctor's full name from currentUser
  const doctorName = currentUser ? 
    `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : 
    'Doctor';

  const doctorInitial = doctorName.charAt(0);

  useEffect(() => {
    // Fetch dashboard data when component mounts
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch dashboard statistics
        try {
          const dashboardResponse = await api.get('/dashboard/doctor');
          const dashboardData = dashboardResponse.data;
          
          setDashboardStats({
            totalPatients: dashboardData.stats.totalPatients,
            todayAppointments: dashboardData.stats.todayAppointments,
            upcomingAppointments: dashboardData.stats.upcomingAppointments,
            completedAppointments: dashboardData.stats.completedAppointments,
            activePrescriptions: dashboardData.stats.activePrescriptions
          });
          
          // Set upcoming appointments
          const formattedAppointments = dashboardData.nextAppointments.map(appointment => ({
            id: appointment._id,
            patientName: `${appointment.patient?.user?.firstName} ${appointment.patient?.user?.lastName}`,
            date: new Date(appointment.appointmentDate).toLocaleDateString(),
            time: appointment.startTime,
            type: appointment.symptoms ? 'Symptoms: ' + appointment.symptoms : 'Consultation'
          }));
          setUpcomingAppointments(formattedAppointments);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
          // Set default values on error
          setDashboardStats({
            totalPatients: 0,
            todayAppointments: 0,
            upcomingAppointments: 0,
            completedAppointments: 0,
            activePrescriptions: 0
          });
          setUpcomingAppointments([]);
        }
        
        // 2. Fetch recent patients
        try {
          const allPatientsResponse = await api.get('/patients/');
          // Check if response.data is already an array or if data is nested in a 'data' property
          const allPatients = Array.isArray(allPatientsResponse.data) 
            ? allPatientsResponse.data 
            : (allPatientsResponse.data.data || []);
          
          if (Array.isArray(allPatients) && allPatients.length > 0) {
            setRecentPatients(allPatients.slice(0, 5).map(patient => ({
              id: patient._id,
              name: `${patient.user?.firstName} ${patient.user?.lastName}`,
              age: calculateAge(patient.dateOfBirth),
              lastVisit: patient.lastVisit || 'N/A',
              condition: patient.condition || 'Regular checkup'
            })));
          } else {
            setRecentPatients([]);
          }
        } catch (error) {
          console.error('Error fetching recent patients:', error);
          setRecentPatients([]);
        }
        
        // 3. Fetch pending refill requests
        const doctorId = currentUser?._id;
        if (doctorId) {
          try {
            const refillsResponse = await api.get(`/doctors/${doctorId}/prescriptions/refill-requests?status=pending`);
            const refillsData = refillsResponse.data.data || [];
            
            setPendingRefills(refillsData.map(refill => ({
              id: refill._id,
              prescriptionId: refill.prescription._id,
              refillId: refill.refillId,
              patientName: `${refill.patient?.user?.firstName} ${refill.patient?.user?.lastName}`,
              medication: refill.prescription.medication,
              dosage: refill.prescription.dosage,
              requestDate: new Date(refill.requestDate).toLocaleDateString(),
              refillsRemaining: refill.prescription.refillsRemaining
            })));
          } catch (error) {
            console.error('Error fetching refill requests:', error);
            setPendingRefills([]);
          }
        } else {
          console.warn('Doctor ID is undefined, skipping refill requests fetch');
          setPendingRefills([]);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const handleViewAppointment = (appointmentId) => {
    navigate(`/dashboard/doctor/appointments/${appointmentId}`);
  };

  const handleEditAppointment = (appointmentId) => {
    navigate(`/dashboard/doctor/appointments/${appointmentId}/edit`);
  };

  const handleViewPatient = (patientId) => {
    navigate(`/dashboard/doctor/patients/${patientId}`);
  };

  const handleViewPrescription = (prescriptionId) => {
    navigate(`/dashboard/doctor/prescriptions/${prescriptionId}`);
  };

  const handleProcessRefill = async (prescriptionId, refillId, status) => {
    try {
      await api.post('/prescriptions/refill/process', {
        prescriptionId,
        refillId,
        status
      });
      
      // Update the pending refills list after processing
      setPendingRefills(pendingRefills.filter(refill => refill.refillId !== refillId));
      
      // Show success message (you can implement a toast notification here)
      alert(`Refill request ${status} successfully`);
    } catch (error) {
      console.error('Error processing refill request:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to process refill request'}`);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <Header />
      
      <div className={styles.dashboardContent}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3>Doctor Portal</h3>
            <button 
              className={styles.toggleButton} 
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {doctorInitial}
            </div>
            {!isSidebarCollapsed && (
              <div className={styles.userDetails}>
                <p className={styles.userName}>{doctorName}</p>
                <p className={styles.userRole}>{currentUser?.specialization || 'Medical Professional'}</p>
              </div>
            )}
          </div>
          
          <nav className={styles.sidebarNav}>
            <NavLink 
              to="/dashboard/doctor"
              end
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>📊</span>
              {!isSidebarCollapsed && <span>Overview</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/doctor/appointments" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>📅</span>
              {!isSidebarCollapsed && <span>Appointments</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/doctor/patients" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>👥</span>
              {!isSidebarCollapsed && <span>Patients</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/doctor/prescriptions" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>💊</span>
              {!isSidebarCollapsed && <span>Prescriptions</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/doctor/profile" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>👤</span>
              {!isSidebarCollapsed && <span>Profile</span>}
            </NavLink>
          </nav>
          
          <div className={styles.sidebarFooter}>
            <button className={styles.logoutButton} onClick={handleSignOut}>
              <span className={styles.icon}>🚪</span>
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Main dashboard overview - Only shown when on the main dashboard page */}
          {window.location.pathname === '/dashboard/doctor' ? (
            <>
              <div className={styles.welcomeSection}>
                <div>
                  <h1>Welcome, Dr. {currentUser?.lastName || 'Doctor'}</h1>
                  <p className={styles.dateDisplay}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className={styles.dashboardActions}>
                  
                  <button className={styles.actionButton}>
                    <span className={styles.icon}>🔔</span>
                  </button>
                  <button className={styles.actionButton}>
                    <span className={styles.icon}>✉️</span>
                  </button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statAppointments}`}>
                  <div className={styles.statIcon}>📅</div>
                  <div className={styles.statInfo}>
                    <h3>Total Appointments</h3>
                    <div className={styles.statValue}>{dashboardStats.upcomingAppointments + dashboardStats.completedAppointments}</div>
                  </div>
                </div>
                
                <div className={`${styles.statCard} ${styles.statToday}`}>
                  <div className={styles.statIcon}>⏰</div>
                  <div className={styles.statInfo}>
                    <h3>Today's Appointments</h3>
                    <div className={styles.statValue}>{dashboardStats.todayAppointments}</div>
                  </div>
                </div>
                
                <div className={`${styles.statCard} ${styles.statPending}`}>
                  <div className={styles.statIcon}>⏳</div>
                  <div className={styles.statInfo}>
                    <h3>Pending Requests</h3>
                    <div className={styles.statValue}>{pendingRefills.length}</div>
                  </div>
                </div>
                
                <div className={`${styles.statCard} ${styles.statPatients}`}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statInfo}>
                    <h3>Total Patients</h3>
                    <div className={styles.statValue}>{dashboardStats.totalPatients}</div>
                  </div>
                </div>
              </div>
              
              {/* Content Cards Grid */}
              <div className={styles.contentGrid}>
                {/* Upcoming Appointments */}
                <div className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <h2>Upcoming Appointments</h2>
                    <NavLink to="/dashboard/doctor/appointments" className={styles.viewAllLink}>
                      View All
                    </NavLink>
                  </div>
                  
                  {isLoading ? (
                    <div className={styles.loadingState}>Loading appointments...</div>
                  ) : upcomingAppointments.length > 0 ? (
                    <ul className={styles.appointmentList}>
                      {upcomingAppointments.map((appointment) => (
                        <li key={appointment.id} className={styles.appointmentItem}>
                          <div className={styles.appointmentTime}>
                            <div className={styles.appointmentDate}>{appointment.date}</div>
                            <div className={styles.appointmentHour}>{appointment.time}</div>
                          </div>
                          <div className={styles.appointmentInfo}>
                            <div className={styles.appointmentName}>{appointment.patientName}</div>
                            <div className={styles.appointmentType}>{appointment.type}</div>
                          </div>
                          <div className={styles.appointmentActions}>
                            <button className={styles.iconButton} title="View Details" onClick={() => handleViewAppointment(appointment.id)}>👁️</button>
                            <button className={styles.iconButton} title="Edit" onClick={() => handleEditAppointment(appointment.id)}>✏️</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.emptyState}>No upcoming appointments</div>
                  )}
                </div>
                
                {/* Pending Refill Requests */}
                <div className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <h2>Pending Refill Requests</h2>
                    <NavLink to="/dashboard/doctor/prescriptions/refills" className={styles.viewAllLink}>
                      View All
                    </NavLink>
                  </div>
                  
                  {isLoading ? (
                    <div className={styles.loadingState}>Loading refill requests...</div>
                  ) : pendingRefills.length > 0 ? (
                    <ul className={styles.refillList}>
                      {pendingRefills.map((refill) => (
                        <li key={refill.refillId} className={styles.refillItem}>
                          <div className={styles.refillInfo}>
                            <div className={styles.refillPatient}>{refill.patientName}</div>
                            <div className={styles.refillMedication}>
                              <strong>{refill.medication}</strong> - {refill.dosage}
                            </div>
                            <div className={styles.refillDetails}>
                              <span>Requested: {refill.requestDate}</span>
                              <span>•</span>
                              <span>Refills remaining: {refill.refillsRemaining}</span>
                            </div>
                          </div>
                          <div className={styles.refillActions}>
                            <button 
                              className={`${styles.actionButton} ${styles.approveButton}`}
                              onClick={() => handleProcessRefill(refill.prescriptionId, refill.refillId, 'approved')}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className={`${styles.actionButton} ${styles.rejectButton}`}
                              onClick={() => handleProcessRefill(refill.prescriptionId, refill.refillId, 'rejected')}
                            >
                              ✗ Reject
                            </button>
                            <button 
                              className={styles.iconButton} 
                              title="View Prescription" 
                              onClick={() => handleViewPrescription(refill.prescriptionId)}
                            >
                              👁️
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.emptyState}>No pending refill requests</div>
                  )}
                </div>
              </div>
              
              {/* Additional Content Row */}
              <div className={styles.contentGrid}>
                {/* Recent Patients */}
                <div className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <h2>Recent Patients</h2>
                    <NavLink to="/dashboard/doctor/patients" className={styles.viewAllLink}>
                      View All
                    </NavLink>
                  </div>
                  
                  {isLoading ? (
                    <div className={styles.loadingState}>Loading patients...</div>
                  ) : recentPatients.length > 0 ? (
                    <ul className={styles.patientList}>
                      {recentPatients.map((patient) => (
                        <li key={patient.id} className={styles.patientItem} onClick={() => handleViewPatient(patient.id)}>
                          <div className={styles.patientAvatar}>
                            {patient.name.charAt(0)}
                          </div>
                          <div className={styles.patientInfo}>
                            <div className={styles.patientName}>{patient.name}</div>
                            <div className={styles.patientDetails}>
                              <span>{patient.age} years</span>
                              <span>•</span>
                              <span>{patient.condition}</span>
                            </div>
                          </div>
                          <div className={styles.patientVisit}>
                            Last visit: {patient.lastVisit}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.emptyState}>No recent patients</div>
                  )}
                </div>
                
                {/* New Card: Active Prescriptions */}
                <div className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <h2>Active Prescriptions</h2>
                    <NavLink to="/dashboard/doctor/prescriptions" className={styles.viewAllLink}>
                      View All
                    </NavLink>
                  </div>
                  
                  <div className={styles.statHighlight}>
                    <div className={styles.statHighlightIcon}>💊</div>
                    <div className={styles.statHighlightValue}>
                      {dashboardStats.activePrescriptions}
                    </div>
                    <div className={styles.statHighlightLabel}>
                      Active Prescriptions
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.pageHeader}>
                <h1>
                  {window.location.pathname.includes('/appointments') ? 'Appointments' : 
                   window.location.pathname.includes('/patients') ? 'Patients' : 
                   window.location.pathname.includes('/prescriptions') ? 'Prescriptions' : 
                   window.location.pathname.includes('/profile') ? 'Profile' : 'Doctor Dashboard'}
                </h1>
                <div className={styles.dashboardActions}>
                  <button className={styles.actionButton}>
                    <span className={styles.icon}>🔔</span>
                  </button>
                  <button className={styles.actionButton}>
                    <span className={styles.icon}>✉️</span>
                  </button>
                </div>
              </div>
              
              <div className={styles.contentArea}>
                <Outlet />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;