import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth, api } from '../../../../contexts/AuthContext';
import Header from '../../../common/Header/Header';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  // State to hold the fetched dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
  });
  
  // Fetch dashboard data from the backend using the api instance from AuthContext
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        const { totalUsers, totalDoctors, totalPatients } = response.data;
        setDashboardData({ totalUsers, totalDoctors, totalPatients });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);
  
  // Update the stats array based on the fetched dashboardData
  const stats = [
    { 
      title: 'Total Users', 
      value: dashboardData.totalUsers.toLocaleString(), 
      change: '+12%', 
      icon: '👥', 
      color: '#3b82f6' 
    },
    { 
      title: 'Active Doctors', 
      value: dashboardData.totalDoctors.toLocaleString(), 
      change: '+5%', 
      icon: '👨‍⚕️', 
      color: '#10b981' 
    },
    { 
      title: 'Registered Patients', 
      value: dashboardData.totalPatients.toLocaleString(), 
      change: '+15%', 
      icon: '🧑‍⚕️', 
      color: '#f59e0b' 
    },
    { 
      title: 'Open Reports', 
      value: '24', 
      change: '-8%', 
      icon: '📊', 
      color: '#ef4444' 
    },
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Check if we're on the exact admin dashboard route
  const isExactDashboard = location.pathname === '/dashboard/admin';

  return (
    <div className={styles.dashboardContainer}>
      <Header />
      
      <div className={styles.dashboardContent}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3>Admin Portal</h3>
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
              {currentUser?.displayName?.charAt(0) || 'A'}
            </div>
            {!isSidebarCollapsed && (
              <div className={styles.userDetails}>
                <p className={styles.userName}>{currentUser?.displayName || 'Administrator'}</p>
                <p className={styles.userRole}>System Admin</p>
              </div>
            )}
          </div>
          
          <nav className={styles.sidebarNav}>
            <NavLink 
              to="/dashboard/admin" 
              className={({ isActive }) => 
                isExactDashboard ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
              end
            >
              <span className={styles.icon}>📊</span>
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </NavLink>
            
            
            
            <NavLink 
              to="/dashboard/admin/doctors" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>👨‍⚕️</span>
              {!isSidebarCollapsed && <span>Doctors</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/admin/patients" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>🧑</span>
              {!isSidebarCollapsed && <span>Admins</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/admin/reports" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>📊</span>
              {!isSidebarCollapsed && <span>Reports</span>}
            </NavLink>
            
            <NavLink 
              to="/dashboard/admin/settings" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <span className={styles.icon}>⚙️</span>
              {!isSidebarCollapsed && <span>Settings</span>}
            </NavLink>
          </nav>
          
          <div className={styles.sidebarFooter}>
            <button className={styles.logoutButton}>
              <span className={styles.icon}>🚪</span>
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.pageHeader}>
            <h1>Admin Dashboard</h1>
            <div className={styles.dashboardActions}>
              <div className={styles.searchBar}>
                <input type="text" placeholder="Search..." />
                <button>🔍</button>
              </div>
              <button className={styles.actionButton}>
                <span className={styles.icon}>🔔</span>
              </button>
              <button className={styles.actionButton}>
                <span className={styles.icon}>⚡</span>
              </button>
            </div>
          </div>
          
          {isExactDashboard ? (
            // Main dashboard content - only show on exact path
            <>
              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                  <div key={index} className={styles.statCard} style={{ borderTopColor: stat.color }}>
                    <div className={styles.statIcon} style={{ backgroundColor: stat.color }}>
                      {stat.icon}
                    </div>
                    <h3>{stat.title}</h3>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div className={styles.statChange} style={{ color: stat.change.startsWith('+') ? '#10b981' : '#ef4444' }}>
                      {stat.change} from last month
                    </div>
                  </div>
                ))}
              </div>
              
              
            </>
          ) : (
            // Child routes - Outlet will render the specific component (Users, Doctors, etc.)
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;