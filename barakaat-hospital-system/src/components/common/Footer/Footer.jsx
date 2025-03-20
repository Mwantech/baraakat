import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { 
  Home, 
  Info, 
  Layers, 
  PhoneCall, 
  AlertTriangle, 
  FileText, 
  MapPin,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Heart,
  Clock,
  Stethoscope,
  Activity
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.topWave}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
      </div>
      
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.logoContainer}>
              <Activity size={28} className={styles.logoIcon} />
              <h3 className={styles.footerTitle}>
                <span>Barakaat</span>
                <span className={styles.highlight}>Hospital</span>
              </h3>
            </div>
            <p className={styles.footerDescription}>
              Providing quality healthcare services with compassion and excellence.
              Our mission is to improve the health and wellbeing of the communities we serve.
            </p>
            <div className={styles.serviceHours}>
              <Clock size={16} className={styles.serviceIcon} />
              <span>Open 24/7 for Emergency Services</span>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Quick Links</h3>
            <ul className={styles.footerLinks}>
              <li>
                <Home size={16} className={styles.linkIcon} />
                <Link to="/" className={styles.footerLink}>Home</Link>
              </li>
              <li>
                <Info size={16} className={styles.linkIcon} />
                <Link to="/about" className={styles.footerLink}>About Us</Link>
              </li>
              <li>
                <Layers size={16} className={styles.linkIcon} />
                <Link to="/services" className={styles.footerLink}>Services</Link>
              </li>
              <li>
                <PhoneCall size={16} className={styles.linkIcon} />
                <Link to="/contact" className={styles.footerLink}>Contact</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Services</h3>
            <ul className={styles.footerLinks}>
              <li>
                <AlertTriangle size={16} className={styles.linkIcon} />
                <Link to="/services#emergency" className={styles.footerLink}>Emergency Care</Link>
              </li>
              <li>
                <PhoneCall size={16} className={styles.linkIcon} />
                <Link to="/services#consultation" className={styles.footerLink}>Online Consultation</Link>
              </li>
              <li>
                <Stethoscope size={16} className={styles.linkIcon} />
                <Link to="/services#specialties" className={styles.footerLink}>Medical Specialties</Link>
              </li>
              <li>
                <FileText size={16} className={styles.linkIcon} />
                <Link to="/services#laboratory" className={styles.footerLink}>Laboratory Services</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>Contact Info</h3>
            <address className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <MapPin size={16} className={styles.contactIcon} />
                <div>
                  <p>123 Hospital Street</p>
                  <p>Mogadishu, Somalia</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <Mail size={16} className={styles.contactIcon} />
                <p>info@barakaathospital.com</p>
              </div>
              <div className={styles.contactItem}>
                <Phone size={16} className={styles.contactIcon} />
                <p>+252 61 123 4567</p>
              </div>
            </address>
            <div className={styles.socialLinks}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} Barakaat Hospital. All rights reserved.
          </p>
          <div className={styles.madeWith}>
            <span>Made with</span>
            <Heart size={14} className={styles.heartIcon} />
            <span>for better healthcare</span>
          </div>
          <div className={styles.footerBottomLinks}>
            <Link to="/privacy-policy" className={styles.footerBottomLink}>Privacy Policy</Link>
            <span className={styles.dividerDot}>•</span>
            <Link to="/terms-of-service" className={styles.footerBottomLink}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;