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
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
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
        
        // Fetch dashboard statistics
        const statsResponse = await api.get('/doctors/dashboard/stats');
        setDashboardStats(statsResponse.data);
        
        // Fetch recent patients
        const patientsResponse = await api.get('/doctors/patients/recent');
        setRecentPatients(patientsResponse.data.slice(0, 5));
        
        // Fetch upcoming appointments
        const appointmentsResponse = await api.get('/doctors/appointments/upcoming');
        setUpcomingAppointments(appointmentsResponse.data.slice(0, 5));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use mock data for demonstration
        setDashboardStats({
          totalAppointments: 125,
          todayAppointments: 8,
          pendingAppointments: 15,
          totalPatients: 73
        });
        
        setRecentPatients([
          { id: 1, name: 'John Smith', age: 45, lastVisit: '2025-03-15', condition: 'Hypertension' },
          { id: 2, name: 'Sarah Johnson', age: 32, lastVisit: '2025-03-14', condition: 'Pregnancy' },
          { id: 3, name: 'Robert Chen', age: 58, lastVisit: '2025-03-10', condition: 'Diabetes' }
        ]);
        
        setUpcomingAppointments([
          { id: 101, patientName: 'Emma Wilson', date: '2025-03-20', time: '14:30', type: 'Follow-up' },
          { id: 102, patientName: 'Michael Brooks', date: '2025-03-21', time: '09:15', type: 'New Patient' },
          { id: 103, patientName: 'Linda Garcia', date: '2025-03-21', time: '11:00', type: 'Consultation' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
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
                  <button className={`${styles.actionButton} ${styles.primaryAction}`}>
                    <span className={styles.icon}>➕</span>
                    <span>New Appointment</span>
                  </button>
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
                    <div className={styles.statValue}>{dashboardStats.totalAppointments}</div>
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
                    <div className={styles.statValue}>{dashboardStats.pendingAppointments}</div>
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
                            <button className={styles.iconButton} title="View Details">👁️</button>
                            <button className={styles.iconButton} title="Edit">✏️</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.emptyState}>No upcoming appointments</div>
                  )}
                </div>
                
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
                        <li key={patient.id} className={styles.patientItem}>
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