import React, { useState } from 'react';
import styles from './Services.module.css';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';

const Services = () => {
  const [expandedService, setExpandedService] = useState(null);

  const toggleService = (id) => {
    setExpandedService(expandedService === id ? null : id);
  };

  const services = [
    {
      id: 1,
      title: "Emergency Care",
      description: "Our 24/7 emergency department is equipped to handle all medical emergencies with prompt, expert care from our specialized trauma team.",
      icon: "emergency",
      details: "Our Emergency Care department features a dedicated triage system, state-of-the-art resuscitation rooms, and specialized trauma bays. Our emergency physicians are board-certified with extensive experience in trauma management, cardiac emergencies, and critical care. We maintain a 15-minute maximum wait time policy for all acute emergencies and offer helicopter transport services for remote locations."
    },
    {
      id: 2,
      title: "Specialized Departments",
      description: "We offer comprehensive care across multiple specialties including Cardiology, Neurology, Orthopedics, Pediatrics, Obstetrics, and Oncology.",
      icon: "specialty",
      details: "Our specialized departments are staffed by board-certified physicians and specialists at the forefront of medical research and practice. The Cardiology department features a catheterization lab and electrophysiology services. Neurology offers advanced stroke care and neurological disorder management. Our Orthopedics center specializes in joint replacement, sports medicine, and spinal surgery. Pediatrics provides compassionate care for children of all ages, while our Obstetrics department delivers over 2,000 babies annually. Our Oncology center offers cutting-edge cancer treatments including immunotherapy and targeted radiation."
    },
    {
      id: 3,
      title: "Diagnostic Services",
      description: "Our hospital features advanced diagnostic facilities including MRI, CT scan, X-ray, Ultrasound, and a full-service laboratory for accurate diagnosis.",
      icon: "diagnostic",
      details: "Our Diagnostic Services department utilizes the latest 3T MRI technology, 128-slice CT scanners, digital radiography, and advanced ultrasound imaging. Our pathology laboratory is accredited by international standards with rapid turnaround times. We offer specialized diagnostic procedures including nuclear medicine studies, PET scans, and interventional radiology services. All diagnostic images are available to patients and referring physicians through our secure digital portal."
    },
    {
      id: 4,
      title: "Surgical Services",
      description: "Our modern operating theaters support a wide range of surgical procedures, from routine operations to complex interventions.",
      icon: "surgery",
      details: "Our Surgical Services department houses 12 state-of-the-art operating theaters equipped with advanced laparoscopic and robotic surgical systems. We specialize in minimally invasive procedures across all surgical disciplines, reducing recovery time and improving outcomes. Our surgical team includes specialists in cardiovascular surgery, neurosurgery, orthopedic surgery, and transplant medicine. We maintain a dedicated post-anesthesia care unit and surgical intensive care for comprehensive perioperative management."
    },
    {
      id: 5,
      title: "Outpatient Care",
      description: "Our outpatient clinics provide convenient access to medical consultations, follow-up care, and preventive health services.",
      icon: "outpatient",
      details: "Our Outpatient Care clinics offer extended hours including evenings and weekends for patient convenience. We provide comprehensive primary care services, specialist consultations, and same-day appointments for urgent needs. Our integrated electronic health record system ensures continuity of care between inpatient and outpatient services. We offer telemedicine appointments for follow-up care and medication management, with an online patient portal for secure communication with your healthcare team."
    },
    {
      id: 6,
      title: "Rehabilitation",
      description: "Our rehabilitation center offers physical therapy, occupational therapy, and speech therapy to support recovery and improve quality of life.",
      icon: "rehab",
      details: "Our Rehabilitation Center features a therapeutic pool, state-of-the-art exercise equipment, and specialized rehabilitation technology. We provide individualized treatment plans for post-stroke recovery, orthopedic rehabilitation, neurological conditions, and sports injuries. Our multidisciplinary team includes physical therapists, occupational therapists, speech pathologists, and rehabilitation physicians. We offer both inpatient and outpatient rehabilitation services with seamless transitions of care."
    },
    {
      id: 7,
      title: "Mental Health Services",
      description: "Our comprehensive mental health program provides supportive care for a wide range of psychological and psychiatric conditions.",
      icon: "mental",
      details: "Our Mental Health Services department offers evidence-based treatments for depression, anxiety, bipolar disorder, and other psychiatric conditions. We provide individual therapy, group therapy, and family counseling with licensed psychologists and social workers. Our psychiatric services include medication management and innovative treatments such as transcranial magnetic stimulation. We maintain a dedicated inpatient psychiatric unit with specialized programs for adolescents, adults, and geriatric patients."
    },
    {
      id: 8,
      title: "Women's Health",
      description: "Our women's health center provides specialized care addressing the unique health needs of women at every stage of life.",
      icon: "women",
      details: "Our Women's Health Center offers comprehensive obstetric and gynecological care, including prenatal services, labor and delivery, and postpartum support. We provide specialized services in reproductive endocrinology, fertility treatments, and menopause management. Our breast health program includes screening, diagnostics, and treatment with a multidisciplinary approach to breast cancer care. We offer specialized gynecologic surgery including minimally invasive and robotic procedures."
    },
    {
      id: 9,
      title: "Pediatric Care",
      description: "Our pediatric department provides compassionate, specialized care for infants, children, and adolescents in a child-friendly environment.",
      icon: "pediatric",
      details: "Our Pediatric Care department features colorful, child-friendly examination rooms and play areas designed to reduce anxiety. We offer comprehensive well-child visits, immunizations, and management of acute and chronic pediatric conditions. Our specialized pediatric subspecialties include cardiology, neurology, endocrinology, and gastroenterology. We maintain a dedicated pediatric emergency room staffed by pediatric emergency medicine specialists available 24/7."
    },
    {
      id: 10,
      title: "Preventive Medicine",
      description: "Our preventive medicine programs focus on health maintenance, disease prevention, and promoting healthy lifestyle choices.",
      icon: "preventive",
      details: "Our Preventive Medicine department offers comprehensive health screenings, immunizations, and wellness assessments. We provide lifestyle medicine consultations focusing on nutrition, exercise, stress management, and smoking cessation. Our corporate wellness programs serve local businesses with on-site health screenings and education. We offer specialized preventive care including travel medicine, cardiac risk assessment, and cancer screening protocols tailored to individual risk factors."
    }
  ];

  return (
    <>
      <Header />
      <section id="services" className={styles.servicesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Services</h2>
          <p className={styles.sectionIntro}>
            Barakaat Hospital provides a comprehensive range of medical services designed to meet the diverse healthcare needs of our community. Click on any service to learn more.
          </p>
          <div className={styles.servicesGrid}>
            {services.map((service) => (
              <div 
                key={service.id} 
                className={`${styles.serviceCard} ${expandedService === service.id ? styles.expanded : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className={styles.serviceHeader}>
                  <div className={styles.serviceIcon}>
                    <i className={`fas fa-${service.icon === 'emergency' ? 'ambulance' : 
                                          service.icon === 'specialty' ? 'stethoscope' :
                                          service.icon === 'diagnostic' ? 'microscope' :
                                          service.icon === 'surgery' ? 'user-md' :
                                          service.icon === 'outpatient' ? 'clinic-medical' :
                                          service.icon === 'rehab' ? 'walking' :
                                          service.icon === 'mental' ? 'brain' :
                                          service.icon === 'women' ? 'female' :
                                          service.icon === 'pediatric' ? 'baby' :
                                          service.icon === 'preventive' ? 'heartbeat' : 'hospital'}`}></i>
                  </div>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <div className={styles.expandIcon}>
                    <i className={`fas fa-chevron-${expandedService === service.id ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceDetails}>
                  <p>{service.details}</p>
                  <a href="#appointment" className={styles.appointmentBtn}>Schedule Appointment</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Services;