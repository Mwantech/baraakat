import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Header.module.css';
import { 
  Home, 
  Info, 
  Grid, 
  PhoneCall, 
  User, 
  UserPlus, 
  LogOut, 
  Menu, 
  X,
  Activity,
  Layers
} from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, userRole, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (userRole === 'patient') {
      return '/dashboard/patient';
    } else if (userRole === 'doctor') {
      return '/dashboard/doctor';
    } else if (userRole === 'admin') {
      return '/dashboard/admin';
    }
    return '/';
  };

  const isActive = (path) => {
    return location.pathname === path ? styles.active : '';
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.headerBg}></div>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <Link to="/" className={styles.logo}>
            <Activity size={28} className={styles.logoIcon} strokeWidth={2.5} />
            <span className={styles.logoText}>Barakaat</span>
            <span className={styles.logoHighlight}>Hospital</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <ul className={styles.navLinks}>
            <li>
              <Link to="/" className={`${styles.navLink} ${isActive('/')}`}>
                <Home size={18} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/about" className={`${styles.navLink} ${isActive('/about')}`}>
                <Info size={18} />
                <span>About</span>
              </Link>
            </li>
            <li>
              <Link to="/services" className={`${styles.navLink} ${isActive('/services')}`}>
                <Layers size={18} />
                <span>Services</span>
              </Link>
            </li>
            <li>
              <Link to="/contact" className={`${styles.navLink} ${isActive('/contact')}`}>
                <PhoneCall size={18} />
                <span>Contact</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.authButtons}>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className={styles.dashboardButton}>
                <Grid size={18} />
                <span>Dashboard</span>
              </Link>
              <button onClick={handleSignOut} className={styles.signOutButton}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className={styles.signInButton}>
                <User size={18} />
                <span>Sign In</span>
              </Link>
              <Link to="/signup" className={styles.signUpButton}>
                <UserPlus size={18} />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className={styles.mobileMenuButton} onClick={toggleMobileMenu} aria-label="Toggle menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileNavBg}></div>
        <ul className={styles.mobileNavLinks}>
          <li>
            <Link to="/" className={`${styles.mobileNavLink} ${isActive('/')}`} onClick={() => setMobileMenuOpen(false)}>
              <Home size={20} />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/about" className={`${styles.mobileNavLink} ${isActive('/about')}`} onClick={() => setMobileMenuOpen(false)}>
              <Info size={20} />
              <span>About</span>
            </Link>
          </li>
          <li>
            <Link to="/services" className={`${styles.mobileNavLink} ${isActive('/services')}`} onClick={() => setMobileMenuOpen(false)}>
              <Layers size={20} />
              <span>Services</span>
            </Link>
          </li>
          <li>
            <Link to="/contact" className={`${styles.mobileNavLink} ${isActive('/contact')}`} onClick={() => setMobileMenuOpen(false)}>
              <PhoneCall size={20} />
              <span>Contact</span>
            </Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li>
                <Link to={getDashboardLink()} className={`${styles.mobileNavLink} ${isActive(getDashboardLink())}`} onClick={() => setMobileMenuOpen(false)}>
                  <Grid size={20} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <button onClick={handleSignOut} className={styles.mobileSignOutButton}>
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/signin" className={`${styles.mobileNavLink} ${isActive('/signin')}`} onClick={() => setMobileMenuOpen(false)}>
                  <User size={20} />
                  <span>Sign In</span>
                </Link>
              </li>
              <li>
                <Link to="/signup" className={`${styles.mobileNavLink} ${isActive('/signup')}`} onClick={() => setMobileMenuOpen(false)}>
                  <UserPlus size={20} />
                  <span>Sign Up</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Header;