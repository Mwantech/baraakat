import React, { useState, useRef } from 'react';
import styles from './Contact.module.css';
import Footer from '../../common/Footer/Footer';
import Header from '../../common/Header/Header';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    isSubmitting: false,
    isSubmitted: false,
    error: null
  });

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [emergencyCallOpen, setEmergencyCallOpen] = useState(false);
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({
      isSubmitting: true,
      isSubmitted: false,
      error: null
    });

    try {
      // Web3Forms integration
      const apiEndpoint = 'https://api.web3forms.com/submit';
      const apiKey = '5640a5e5-73c9-4f33-8082-dc05a3873e9a'; // Replace with your actual API key

      const formDataToSubmit = new FormData();
      formDataToSubmit.append('access_key', apiKey);
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('email', formData.email);
      formDataToSubmit.append('phone', formData.phone);
      formDataToSubmit.append('department', formData.department);
      formDataToSubmit.append('message', formData.message);
      formDataToSubmit.append('subject', `New Contact from ${formData.name} - ${formData.department}`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formDataToSubmit
      });

      const data = await response.json();

      if (data.success) {
        setFormStatus({
          isSubmitting: false,
          isSubmitted: true,
          error: null
        });
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          department: '',
          message: ''
        });
        
        // Scroll to form top to show success message
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error(data.message || 'Form submission failed');
      }
    } catch (error) {
      setFormStatus({
        isSubmitting: false,
        isSubmitted: false,
        error: error.message || 'Something went wrong. Please try again.'
      });
    }
  };

  const whatsappTemplates = [
    {
      id: 1,
      title: "Appointment Request",
      message: "Hello, I would like to schedule an appointment with your hospital. My name is [Your Name] and I'm looking for the [Department] department. Please let me know the available time slots. Thank you."
    },
    {
      id: 2,
      title: "Medical Records Request",
      message: "Hello, I would like to request my medical records. My name is [Your Name], DOB: [Your DOB]. I was treated at your facility on [Date]. Please advise on the process to obtain my records. Thank you."
    },
    {
      id: 3,
      title: "Insurance Inquiry",
      message: "Hello, I'd like to confirm if you accept [Insurance Provider] insurance. I need to visit the [Department] department. Thank you."
    },
    {
      id: 4,
      title: "General Information",
      message: "Hello, I'd like to inquire about your hospital's services and facilities. Could you please provide me with more information? Thank you."
    }
  ];

  const emergencyNumbers = [
    { name: "Hospital Emergency", number: "+1-555-911-0000" },
    { name: "Ambulance Service", number: "+1-555-911-1111" },
    { name: "24/7 Nurse Hotline", number: "+1-555-911-2222" }
  ];

  const sendWhatsappMessage = (message) => {
    const phoneNumber = "+15551234567"; // Replace with actual WhatsApp number
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    setWhatsappOpen(false);
  };

  const makeEmergencyCall = (number) => {
    window.location.href = `tel:${number}`;
    setEmergencyCallOpen(false);
  };

  const departments = [
    "General Inquiry",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "Oncology",
    "Emergency",
    "Billing & Insurance",
    "Feedback & Suggestions"
  ];

  return (
    <>
      <Header/>
      <section id="contact" className={styles.contactSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p className={styles.sectionSubtitle}>We're here to help with your healthcare needs</p>
          
          <div className={styles.quickActions}>
            <div 
              className={`${styles.actionButton} ${styles.emergencyAction}`}
              onClick={() => setEmergencyCallOpen(!emergencyCallOpen)}
            >
              <i className="fas fa-phone-alt"></i>
              <span>Emergency Call</span>
              
              {emergencyCallOpen && (
                <div className={styles.actionDropdown}>
                  <div className={styles.dropdownHeader}>
                    <h4>Emergency Contact Numbers</h4>
                    <p>Select a number to call immediately</p>
                  </div>
                  {emergencyNumbers.map(item => (
                    <button 
                      key={item.number} 
                      className={styles.emergencyNumber}
                      onClick={() => makeEmergencyCall(item.number.replace(/[^0-9+]/g, ''))}
                    >
                      <i className="fas fa-ambulance"></i>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.number}</span>
                      </div>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div 
              className={`${styles.actionButton} ${styles.whatsappAction}`}
              onClick={() => setWhatsappOpen(!whatsappOpen)}
            >
              <i className="fab fa-whatsapp"></i>
              <span>WhatsApp Us</span>
              
              {whatsappOpen && (
                <div className={styles.actionDropdown}>
                  <div className={styles.dropdownHeader}>
                    <h4>WhatsApp Templates</h4>
                    <p>Choose a message template to send via WhatsApp</p>
                  </div>
                  {whatsappTemplates.map(template => (
                    <button 
                      key={template.id} 
                      className={styles.whatsappTemplate}
                      onClick={() => sendWhatsappMessage(template.message)}
                    >
                      <i className="fas fa-comment-medical"></i>
                      <div>
                        <strong>{template.title}</strong>
                        <span>{template.message.substring(0, 60)}...</span>
                      </div>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <a href="mailto:info@barakaathospital.com" className={`${styles.actionButton} ${styles.emailAction}`}>
              <i className="fas fa-envelope"></i>
              <span>Email Us</span>
            </a>
            
            <a href="https://maps.google.com/?q=123+Medical+Center+Drive,Healthville" target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.mapAction}`}>
              <i className="fas fa-map-marker-alt"></i>
              <span>Find Us</span>
            </a>
          </div>

          <div className={styles.contactContent}>
            <div className={styles.contactInfo}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-map-marked-alt"></i>
                </div>
                <div className={styles.infoItem}>
                  <h3>Hospital Location</h3>
                  <p><i className="fas fa-map-pin"></i> 123 Medical Center Drive</p>
                  <p><i className="fas fa-city"></i> Healthville, Region 12345</p>
                  <p><i className="fas fa-globe-americas"></i> Country</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-phone-volume"></i>
                </div>
                <div className={styles.infoItem}>
                  <h3>Appointments & Inquiries</h3>
                  <p><i className="fas fa-ambulance"></i> Emergency: <a href="tel:+15559110000">(555) 911-0000</a></p>
                  <p><i className="fas fa-calendar-check"></i> Appointments: <a href="tel:+15551234567">(555) 123-4567</a></p>
                  <p><i className="fas fa-envelope"></i> Email: <a href="mailto:info@barakaathospital.com">info@barakaathospital.com</a></p>
                  <p><i className="fab fa-whatsapp"></i> WhatsApp: <a href="https://wa.me/15551234567">+1 (555) 123-4567</a></p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-clock"></i>
                </div>
                <div className={styles.infoItem}>
                  <h3>Visiting Hours</h3>
                  <p><i className="fas fa-procedures"></i> General Wards: 10:00 AM - 8:00 PM</p>
                  <p><i className="fas fa-heartbeat"></i> ICU: 11:00 AM - 12:00 PM & 5:00 PM - 6:00 PM</p>
                  <p><i className="fas fa-stethoscope"></i> Outpatient Clinics: 8:00 AM - 4:00 PM (Mon-Fri)</p>
                  <p><i className="fas fa-briefcase-medical"></i> Weekend Clinics: 9:00 AM - 1:00 PM (Sat)</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className={styles.infoItem}>
                  <h3>Patient Resources</h3>
                  <p><i className="fas fa-user-md"></i> <a href="#find-doctor">Find a Doctor</a></p>
                  <p><i className="fas fa-file-medical"></i> <a href="#medical-records">Request Medical Records</a></p>
                  <p><i className="fas fa-credit-card"></i> <a href="#payment">Pay Your Bill Online</a></p>
                  <p><i className="fas fa-question-circle"></i> <a href="#faq">FAQs</a></p>
                </div>
              </div>
            </div>
            
            <div className={styles.contactForm} ref={formRef}>
              <div className={styles.formHeader}>
                <i className="fas fa-paper-plane"></i>
                <h3>Send us a Message</h3>
                <p>We'll get back to you within 24 hours</p>
              </div>
              
              {formStatus.isSubmitted && (
                <div className={styles.successMessage}>
                  <i className="fas fa-check-circle"></i>
                  <h4>Thank You!</h4>
                  <p>Your message has been sent successfully. Our team will get back to you shortly.</p>
                </div>
              )}
              
              {formStatus.error && (
                <div className={styles.errorMessage}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <h4>Submission Error</h4>
                  <p>{formStatus.error}</p>
                </div>
              )}
              
              {!formStatus.isSubmitted && (
                <form onSubmit={handleSubmit}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name">
                        <i className="fas fa-user"></i> Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="email">
                        <i className="fas fa-envelope"></i> Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="phone">
                        <i className="fas fa-phone"></i> Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="department">
                        <i className="fas fa-hospital-user"></i> Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a department</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept.toLowerCase().replace(/\s+/g, '-')}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="message">
                      <i className="fas fa-comment"></i> Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      required
                      rows="5"
                    ></textarea>
                  </div>
                  
                  <div className={styles.formPrivacy}>
                    <input type="checkbox" id="privacy" required />
                    <label htmlFor="privacy">
                      I agree to the <a href="#privacy">privacy policy</a> and consent to the processing of my personal data.
                    </label>
                  </div>
                  
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={formStatus.isSubmitting}
                  >
                    {formStatus.isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
          
          <div className={styles.mapSection}>
            <h3><i className="fas fa-map-marked-alt"></i> Find Us</h3>
            <div className={styles.mapContainer}>
              {/* Replace with actual Google Maps embed code */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.789012345678!2d-123.1234567890123!3d45.6789012345678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDQwJzQ0LjAiTiAxMjPCsDA3JzI0LjQiVw!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className={styles.directionsLink}>
              <a href="https://maps.google.com/?q=123+Medical+Center+Drive,Healthville" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-directions"></i> Get Directions
              </a>
            </div>
          </div>
          
          <div className={styles.faqSection}>
            <h3><i className="fas fa-question-circle"></i> Frequently Asked Questions</h3>
            <div className={styles.faqContainer}>
              <div className={styles.faqItem}>
                <h4>How do I schedule an appointment?</h4>
                <p>You can schedule an appointment by calling our appointment desk at (555) 123-4567, using the form on this page, or through our patient portal.</p>
              </div>
              <div className={styles.faqItem}>
                <h4>What insurance plans do you accept?</h4>
                <p>We accept most major insurance plans. Please contact our billing department at (555) 123-8901 to verify your specific coverage.</p>
              </div>
              <div className={styles.faqItem}>
                <h4>How can I access my medical records?</h4>
                <p>You can request your medical records through our patient portal or by submitting a request form at our Medical Records Department.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </>
  );
};

export default Contact;