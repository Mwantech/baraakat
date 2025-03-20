import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaAmbulance, FaVideo, FaUserMd, FaStethoscope, FaCalendarAlt, FaMicroscope, FaHospital, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';
import styles from './Welcome.module.css';

// Import background images
import hospitalExterior from '@/assets/images/h-exterior.jpeg';
import doctorTeam from '@/assets/images/d-team.jpeg';
import medicalEquipment from '@/assets/images/m-equipment.jpeg';
import patientCare from '@/assets/images/p-care.jpeg';

const Welcome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const contactRef = useRef(null);

  const backgroundImages = [
    { image: hospitalExterior, heading: "Welcome to Barakaat Hospital", subheading: "Excellence in Healthcare" },
    { image: doctorTeam, heading: "Expert Medical Team", subheading: "Committed to Your Well-being" },
    { image: medicalEquipment, heading: "Cutting-Edge Technology", subheading: "Advanced Diagnostic Solutions" },
    { image: patientCare, heading: "Patient-Centered Care", subheading: "Your Health, Our Priority" }
  ];

  // Automatic slide transition
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Intersection observer for animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsVisible(prev => ({
          ...prev,
          [entry.target.id]: entry.isIntersecting
        }));
      });
    }, observerOptions);

    const sections = [
      { ref: aboutRef, id: 'about' },
      { ref: servicesRef, id: 'services' },
     
    ];

    sections.forEach(section => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    return () => {
      sections.forEach(section => {
        if (section.ref.current) {
          observer.unobserve(section.ref.current);
        }
      });
    };
  }, []);

  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  const serviceItems = [
    { icon: <FaAmbulance />, title: "Emergency Care", description: "24/7 emergency services with advanced life support and trauma care for all critical situations." },
    { icon: <FaVideo />, title: "Telemedicine", description: "Virtual consultations with our specialists from the comfort of your home using secure video technology." },
    { icon: <FaUserMd />, title: "Specialist Consultations", description: "Access to expert physicians across various medical and surgical specialties." },
    { icon: <FaStethoscope />, title: "Primary Care", description: "Comprehensive primary healthcare services for patients of all ages." },
    { icon: <FaCalendarAlt />, title: "Scheduled Surgeries", description: "State-of-the-art surgical facilities with minimally invasive and advanced surgical options." },
    { icon: <FaMicroscope />, title: "Diagnostic Services", description: "Full range of laboratory and imaging services including MRI, CT scan, and ultrasound." }
  ];

  return (
    <div className={styles.welcomeContainer}>
      <Header />
      
      <main className={styles.mainContent}>
        {/* Hero Section with Auto-Sliding Background */}
        <section className={styles.hero}>
          <div className={styles.backgroundSlider}>
            {backgroundImages.map((slide, index) => (
              <div 
                key={index} 
                className={`${styles.slide} ${currentSlide === index ? styles.activeSlide : ''}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className={styles.slideOverlay}></div>
              </div>
            ))}
          </div>
          
          <div className={styles.heroContent}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className={styles.heroText}
            >
              <h1>{backgroundImages[currentSlide].heading}</h1>
              <p>{backgroundImages[currentSlide].subheading}</p>
              
              <div className={styles.slideIndicators}>
                {backgroundImages.map((_, index) => (
                  <span 
                    key={index} 
                    className={`${styles.indicator} ${currentSlide === index ? styles.activeIndicator : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  ></span>
                ))}
              </div>
              
              <div className={styles.ctaButtons}>
                <Link to="/signup" className={styles.primaryButton}>
                  Create Account
                </Link>
                <Link to="/signin" className={styles.secondaryButton}>
                  Sign In
                </Link>
              </div>
              
              <div className={styles.scrollLinks}>
                <button onClick={() => scrollToSection(aboutRef)} className={styles.scrollLink}>About</button>
                <button onClick={() => scrollToSection(servicesRef)} className={styles.scrollLink}>Services</button>
                
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" ref={aboutRef} className={styles.aboutSection}>
          <div className={styles.container}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isVisible.about ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8 }}
              className={styles.sectionHeader}
            >
              <h2>About Barakaat Hospital</h2>
              <div className={styles.underline}></div>
            </motion.div>
            
            <div className={styles.aboutContent}>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={isVisible.about ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={styles.aboutImage}
              >
                <img src={doctorTeam} alt="Barakaat Hospital Team" />
                <div className={styles.imageDecoration}></div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={isVisible.about ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className={styles.aboutText}
              >
                <h3>Excellence in Healthcare Since 2010</h3>
                <p>
                  Barakaat Hospital is a premier healthcare institution dedicated to providing 
                  exceptional medical services with compassion and integrity. Our state-of-the-art 
                  facilities combined with our team of experienced healthcare professionals ensure 
                  that every patient receives the highest quality care.
                </p>
                <p>
                  We believe in a patient-centered approach that treats the whole person, not just 
                  the illness. Our multidisciplinary teams work collaboratively to deliver 
                  personalized care tailored to the unique needs of each patient.
                </p>
                
                <div className={styles.statsContainer}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>50+</span>
                    <span className={styles.statLabel}>Specialists</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>15K+</span>
                    <span className={styles.statLabel}>Patients</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>12</span>
                    <span className={styles.statLabel}>Departments</span>
                  </div>
                </div>
                
                <Link to="/about" className={styles.learnMoreButton}>Learn More</Link>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Services Section */}
        <section id="services" ref={servicesRef} className={styles.servicesSection}>
          <div className={styles.container}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isVisible.services ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8 }}
              className={styles.sectionHeader}
            >
              <h2>Our Services</h2>
              <div className={styles.underline}></div>
              <p className={styles.sectionDescription}>
                Comprehensive healthcare services designed to meet all your medical needs
              </p>
            </motion.div>
            
            <div className={styles.servicesGrid}>
              {serviceItems.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible.services ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className={styles.serviceCard}
                >
                  <div className={styles.serviceIcon}>
                    {service.icon}
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible.services ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className={styles.servicesFooter}
            >
              <Link to="/services" className={styles.viewAllButton}>
                View All Services
              </Link>
            </motion.div>
          </div>
        </section>
        
       
      </main>
      
      <Footer />
    </div>
  );
};

export default Welcome;