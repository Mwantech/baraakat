import React, { useEffect } from 'react';
import styles from './About.module.css';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';
import { FaHospital, FaAward, FaHeartbeat, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

// Import images
// Note: You would need to add these images to your project's assets folder
import hospitalExterior from '/images/h-exterior.jpeg';
import founderImage from '/images/founder.jpeg';
import missionImage from '/images/mission.jpeg';
import staffImage from '/images/staff.jpeg';

const About = () => {
  // Add animation on scroll effect
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(`.${styles.animate}`);
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>
          <h1>About Barakaat Hospital</h1>
          <p>Excellence in Healthcare Since 2010</p>
        </div>
      </section>

      {/* Main About Section */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <div className={styles.underline}></div>
          </div>
          
          <div className={`${styles.aboutContent} ${styles.animate}`}>
            <div className={styles.aboutText}>
              <p className={styles.lead}>
                Barakaat Hospital is a comprehensive healthcare system dedicated to providing exceptional medical care with compassion and integrity.
              </p>
              <p>
                Established in 2010, our hospital has grown to become a leading healthcare provider, equipped with state-of-the-art medical technology and staffed by highly qualified healthcare professionals. We are committed to improving the health and well-being of the communities we serve.
              </p>
              <p>
                Our multidisciplinary team of doctors, nurses, and support staff work collaboratively to deliver personalized care that addresses the unique needs of each patient. At Barakaat Hospital, we believe in treating the whole person, not just the illness.
              </p>
            </div>
            <div className={styles.aboutImage}>
              <img src={hospitalExterior} alt="Barakaat Hospital Building" />
              <div className={styles.imageCaption}>
                Our modern facility in downtown Mogadishu
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className={`${styles.statsSection} ${styles.animate}`}>
            <div className={styles.statItem}>
              <div className={styles.statIcon}><FaHospital /></div>
              <div className={styles.statNumber}>250+</div>
              <div className={styles.statTitle}>Hospital Beds</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIcon}><FaHeartbeat /></div>
              <div className={styles.statNumber}>50,000+</div>
              <div className={styles.statTitle}>Patients Served</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIcon}><FaAward /></div>
              <div className={styles.statNumber}>15+</div>
              <div className={styles.statTitle}>Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <div className={styles.underline}></div>
          </div>
          
          <div className={`${styles.valuesContainer} ${styles.animate}`}>
            <div className={styles.valuesImage}>
              <img src={missionImage} alt="Medical professionals in a meeting" />
            </div>
            <div className={styles.valuesText}>
              <ul className={styles.valuesList}>
                <li>
                  <span className={styles.valueTitle}>Excellence</span>
                  <p>We strive for the highest standards in healthcare delivery, continuously improving our services and skills.</p>
                </li>
                <li>
                  <span className={styles.valueTitle}>Compassion</span>
                  <p>We provide care with empathy and understanding, recognizing the emotional needs of our patients and their families.</p>
                </li>
                <li>
                  <span className={styles.valueTitle}>Integrity</span>
                  <p>We maintain ethical standards in all our practices, ensuring transparency and honesty in patient care.</p>
                </li>
                <li>
                  <span className={styles.valueTitle}>Innovation</span>
                  <p>We embrace advanced medical technologies and techniques, staying at the forefront of medical advancements.</p>
                </li>
                <li>
                  <span className={styles.valueTitle}>Accessibility</span>
                  <p>We ensure healthcare is available to all who need it, breaking down barriers to quality medical services.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className={styles.founderSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Meet Our Founder</h2>
            <div className={styles.underline}></div>
          </div>
          
          <div className={`${styles.founderContainer} ${styles.animate}`}>
            <div className={styles.founderImage}>
              <img src={founderImage} alt="Dr. Abdi Hassan, Founder of Barakaat Hospital" />
            </div>
            <div className={styles.founderBio}>
              <h3>Dr. Abdi Hassan, M.D.</h3>
              <p className={styles.founderTitle}>Founder & Chief Medical Director</p>
              <p>
                Dr. Abdi Hassan founded Barakaat Hospital in 2010 with a vision to transform healthcare delivery in Somalia. A graduate of Harvard Medical School with over 25 years of experience in internal medicine, Dr. Hassan returned to his homeland to establish a world-class medical facility that would serve the community with dignity and excellence.
              </p>
              <p>
                Under his leadership, Barakaat Hospital has grown from a small clinic to a comprehensive healthcare system. Dr. Hassan's commitment to accessible healthcare has led to numerous community outreach programs and partnerships with international medical organizations.
              </p>
              <p>
                "Our mission is not just to treat illness, but to promote wellness and improve the quality of life for all our patients. Healthcare is a fundamental right, and we are dedicated to providing the best possible care to everyone who walks through our doors."
              </p>
              <div className={styles.founderAwards}>
                <span>Humanitarian Award (2015)</span>
                <span>Medical Excellence Award (2018)</span>
                <span>Community Service Medal (2022)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className={styles.teamSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Dedicated Team</h2>
            <div className={styles.underline}></div>
          </div>
          
          <div className={`${styles.teamContent} ${styles.animate}`}>
            <div className={styles.teamText}>
              <p>
                At Barakaat Hospital, our greatest asset is our people. Our team consists of over 200 healthcare professionals including specialists, general practitioners, nurses, technicians, and support staff, all dedicated to providing exceptional care.
              </p>
              <p>
                Our medical staff are leaders in their respective fields, bringing expertise from prestigious institutions around the world. We maintain the highest standards through continuous training and professional development.
              </p>
              <p>
                Together, we work as a cohesive unit with one shared goal: to improve the health and wellbeing of our community through compassionate, patient-centered care.
              </p>
            </div>
            <div className={styles.teamImage}>
              <img src={staffImage} alt="Barakaat Hospital Medical Team" />
              <div className={styles.imageCaption}>
                Our diverse team of healthcare professionals
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className={styles.locationSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Location</h2>
            <div className={styles.underline}></div>
          </div>
          
          <div className={`${styles.locationContainer} ${styles.animate}`}>
            <div className={styles.contactInfo}>
              <h3>Visit Our Hospital</h3>
              <div className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <p>123 Healthcare Avenue, Mogadishu, Somalia</p>
              </div>
              <div className={styles.contactItem}>
                <FaPhone className={styles.contactIcon} />
                <p>+252 61 123 4567</p>
              </div>
              <div className={styles.contactItem}>
                <FaEnvelope className={styles.contactIcon} />
                <p>info@barakaathospital.com</p>
              </div>
              <div className={styles.hoursContainer}>
                <h4>Hours of Operation</h4>
                <div className={styles.hours}>
                  <div className={styles.hoursDay}>Emergency Care</div>
                  <div className={styles.hoursTime}>24/7</div>
                </div>
                <div className={styles.hours}>
                  <div className={styles.hoursDay}>Outpatient Services</div>
                  <div className={styles.hoursTime}>8:00 AM - 8:00 PM (Mon-Sat)</div>
                </div>
                <div className={styles.hours}>
                  <div className={styles.hoursDay}>Administrative Office</div>
                  <div className={styles.hoursTime}>9:00 AM - 5:00 PM (Mon-Fri)</div>
                </div>
              </div>
            </div>
            <div className={styles.mapContainer}>
              <iframe
                title="Barakaat Hospital Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254040.73138106365!2d45.2424088!3d2.0460622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3d58425955ce6b53%3A0xbb20eaaa52cc59d9!2sMogadishu%2C%20Somalia!5e0!3m2!1sen!2sus!4v1709975620351!5m2!1sen!2sus"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default About;