import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './PatientDashboard.module.css';
import Header from '../../../common/Header/Header';

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
  FaCheck
} from 'react-icons/fa';

const PatientDashboard = () => {
  const location = useLocation();
  const [notifications, setNotifications] = useState(3);

  // Sample data for dashboard widgets
  const stats = [
    { id: 1, icon: <FaCalendarAlt />, value: '4', label: 'Upcoming Appointments', color: 'blue' },
    { id: 2, icon: <FaUserMd />, value: '3', label: 'Assigned Doctors', color: 'green' },
    { id: 3, icon: <FaFileAlt />, value: '12', label: 'Medical Records', color: 'purple' },
    { id: 4, icon: <FaPrescriptionBottleAlt />, value: '5', label: 'Active Prescriptions', color: 'orange' }
  ];

  const upcomingAppointments = [
    { 
      id: 1, 
      day: '15', 
      month: 'Mar', 
      title: 'General Checkup', 
      doctor: 'Dr. Sarah Johnson',
      time: '10:00 AM',
      status: 'confirmed'
    },
    { 
      id: 2, 
      day: '22', 
      month: 'Mar', 
      title: 'Dental Appointment', 
      doctor: 'Dr. Michael Chen',
      time: '2:00 PM',
      status: 'pending'
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Import the Header component at the top level */}
      <Header />
      
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <FaHospital />
            <span className={styles.logoText}>MedCare</span>
          </div>
        </div>
        <ul className={styles.navMenu}>
          <li className={styles.navItem}>
            <Link to="/dashboard" className={`${styles.navLink} ${location.pathname === '/dashboard' ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaHome /></span>
              <span className={styles.navText}>Dashboard</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/appointments" className={`${styles.navLink} ${location.pathname === '/dashboard/appointments' ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaCalendarAlt /></span>
              <span className={styles.navText}>Appointments</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/medical-records" className={`${styles.navLink} ${location.pathname === '/dashboard/medical-records' ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaFileAlt /></span>
              <span className={styles.navText}>Medical Records</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/prescriptions" className={`${styles.navLink} ${location.pathname === '/dashboard/prescriptions' ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaPrescriptionBottleAlt /></span>
              <span className={styles.navText}>Prescriptions</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/dashboard/profile" className={`${styles.navLink} ${location.pathname === '/dashboard/profile' ? styles.navLinkActive : ''}`}>
              <span className={styles.navIcon}><FaUserAlt /></span>
              <span className={styles.navText}>My Profile</span>
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
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
                <span className={styles.profileName}>John Doe</span>
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
                <h3 className={styles.statValue}>{stat.value}</h3>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Upcoming Appointments</h2>
            <Link to="/dashboard/appointments" className={styles.cardAction}>View All</Link>
          </div>
          
          {upcomingAppointments.map(appointment => (
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
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Medical Activity</h2>
          </div>
          <p>Your recent lab results have been uploaded. Please check your medical records.</p>
          <button className={styles.buttonPrimary}>View Records</button>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;