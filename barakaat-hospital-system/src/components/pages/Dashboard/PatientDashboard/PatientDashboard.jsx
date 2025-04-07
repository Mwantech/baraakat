import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import styles from './PatientDashboard.module.css';
import Header from '../../../common/Header/Header';
import { useAuth, api } from '../../../../contexts/AuthContext'; // Import api and useAuth

// Import icons
import { 
  FaHome, 
  FaCalendarAlt, 
  FaFileAlt, 
  FaPrescriptionBottleAlt, 
  FaUserAlt,
  FaBell,
  FaHospital,
  FaUserMd,
  FaClock,
  FaRobot,
  FaCheck
} from 'react-icons/fa';

const PatientDashboard = () => {
  const location = useLocation();
  const { getToken, currentUser } = useAuth();
  const [notifications, setNotifications] = useState(3);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      upcomingAppointments: 0,
      completedAppointments: 0,
      activePrescriptions: 0,
      medicalRecords: 0
    },
    nextAppointment: null,
    expiringPrescription: null
  });
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  // Check if we're on exactly the dashboard/patient route (not a sub-route)
  const isExactDashboard = location.pathname === '/dashboard/patient';

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isExactDashboard) return;
      
      try {
        setLoading(true);
        const response = await api.get('/dashboard/patient');
        setDashboardData(response.data);
        
        // Also fetch upcoming appointments (limited to 2 for the dashboard)
        const appointmentsResponse = await api.get('/api/appointments/patient?limit=2&status=scheduled');
        
        // Transform the appointments to match the format needed for display
        const formattedAppointments = appointmentsResponse.data.map(apt => {
          const appointmentDate = new Date(apt.appointmentDate);
          return {
            id: apt._id,
            day: appointmentDate.getDate(),
            month: appointmentDate.toLocaleString('default', { month: 'short' }),
            title: apt.type || 'Appointment',
            doctor: `Dr. ${apt.doctor?.user?.firstName} ${apt.doctor?.user?.lastName}`,
            time: apt.startTime,
            status: apt.status === 'scheduled' ? 'confirmed' : apt.status
          };
        });
        
        setUpcomingAppointments(formattedAppointments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isExactDashboard]);

  // Convert dashboard data to stats format for display
  const stats = [
    { 
      id: 1, 
      icon: <FaCalendarAlt />, 
      value: dashboardData.stats.upcomingAppointments.toString(), 
      label: 'Upcoming Appointments', 
      color: 'blue' 
    },
    { 
      id: 2, 
      icon: <FaUserMd />, 
      value: '-', // This might need to be fetched separately
      label: 'Assigned Doctors', 
      color: 'green' 
    },
    { 
      id: 3, 
      icon: <FaFileAlt />, 
      value: dashboardData.stats.medicalRecords.toString(), 
      label: 'Medical Records', 
      color: 'purple' 
    },
    { 
      id: 4, 
      icon: <FaPrescriptionBottleAlt />, 
      value: dashboardData.stats.activePrescriptions.toString(), 
      label: 'Active Prescriptions', 
      color: 'orange' 
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Wrap Header in a container with proper positioning */}
      <div className={styles.headerContainer}>
        <Header />
      </div>
      
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          
        </div>
        <ul className={styles.navMenu}>
          <li className={styles.navItem}>
            <Link to="/dashboard/patient" className={`${styles.navLink} ${isExactDashboard ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaHome /></span>
              <span className={styles.navText}>Dashboard</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/patient/appointments" className={`${styles.navLink} ${location.pathname.includes('/dashboard/patient/appointments') ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaCalendarAlt /></span>
              <span className={styles.navText}>Appointments</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link
              to="/dashboard/patient/chatbot"
              className={`${styles.navLink} ${
                location.pathname.includes('/dashboard/patient/chatbot')
                  ? styles.navLinkActive
                  : ''
              }`}
            >
              <span className={styles.navIcon}>
                <FaRobot />
              </span>
              <span className={styles.navText}>Chatbot</span>
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link to="/dashboard/patient/medical-records" className={`${styles.navLink} ${location.pathname.includes('/dashboard/patient/medical-records') ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaFileAlt /></span>
              <span className={styles.navText}>Medical Records</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/patient/prescriptions" className={`${styles.navLink} ${location.pathname.includes('/dashboard/patient/prescriptions') ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaPrescriptionBottleAlt /></span>
              <span className={styles.navText}>Prescriptions</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/patient/profile" className={`${styles.navLink} ${location.pathname.includes('/dashboard/patient/profile') ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaUserAlt /></span>
              <span className={styles.navText}>My Profile</span>
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {isExactDashboard ? (
          <>
            <div className={styles.contentHeader}>
              <h1 className={styles.pageTitle}>Patient Dashboard</h1>
              <div className={styles.userActions}>
                <div className={styles.notificationBadge}>
                  <FaBell className={styles.notificationIcon} />
                  {notifications > 0 && <span className={styles.badge}>{notifications}</span>}
                </div>
                <div className={styles.userProfile}>
                  <img 
                    src="https://i.pravatar.cc/150?img=12" 
                    alt="Profile" 
                    className={styles.profileAvatar} 
                  />
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>
                      {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Loading...'}
                    </span>
                    <span className={styles.profileRole}>Patient</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className={styles.statsGrid}>
              {stats.map(stat => (
                <div key={stat.id} className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                    {stat.icon}
                  </div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statValue}>
                      {loading ? '...' : stat.value}
                    </h3>
                    <p className={styles.statLabel}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Dashboard Content */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Upcoming Appointments</h2>
                <Link to="/dashboard/patient/appointments" className={styles.cardAction}>View All</Link>
              </div>
              
              {loading ? (
                <p>Loading appointments...</p>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <div key={appointment.id} className={styles.appointmentItem}>
                    <div className={styles.appointmentDate}>
                      <span className={styles.appointmentDay}>{appointment.day}</span>
                      <span className={styles.appointmentMonth}>{appointment.month}</span>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <h3 className={styles.appointmentTitle}>{appointment.title}</h3>
                      <p className={styles.appointmentDoctor}>
                        <FaUserMd style={{ marginRight: '5px' }} />
                        {appointment.doctor}
                      </p>
                      <p className={styles.appointmentTime}>
                        <FaClock style={{ marginRight: '5px' }} />
                        {appointment.time}
                      </p>
                    </div>
                    <div>
                      <span className={`${styles.appointmentStatus} ${styles[`status${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}`]}`}>
                        {appointment.status === 'confirmed' && <FaCheck style={{ marginRight: '5px' }} />}
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No upcoming appointments.</p>
              )}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Medical Activity</h2>
              </div>
              {dashboardData.nextAppointment ? (
                <>
                  <p>Your next appointment is scheduled for {new Date(dashboardData.nextAppointment.appointmentDate).toLocaleDateString()} at {dashboardData.nextAppointment.startTime}.</p>
                  <Link to="/dashboard/patient/appointments">
                    <button className={styles.buttonPrimary}>View Details</button>
                  </Link>
                </>
              ) : dashboardData.expiringPrescription ? (
                <>
                  <p>You have a prescription ending soon. Please check your prescriptions.</p>
                  <Link to="/dashboard/patient/prescriptions">
                    <button className={styles.buttonPrimary}>View Prescriptions</button>
                  </Link>
                </>
              ) : (
                <>
                  <p>No recent medical activity to display.</p>
                  <Link to="/dashboard/patient/medical-records">
                    <button className={styles.buttonPrimary}>View Records</button>
                  </Link>
                </>
              )}
            </div>
          </>
        ) : (
          // Render the child routes (Appointments, Medical Records, etc.)
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;