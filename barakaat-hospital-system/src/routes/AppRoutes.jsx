import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import public page components
import Welcome from '../components/pages/Welcome/Welcome';
import About from '../components/pages/About/About';
import Services from '../components/pages/Services/Services';
import Contact from '../components/pages/Contact/Contact';
import NotFound from '../components/pages/pages/NotFound/NotFound';

// Import auth components
import SignIn from '../components/auth/SignIn/SignIn';
import SignUp from '../components/auth/SignUp/SignUp';
import ForgotPassword from '../components/auth/ForgotPassword/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword/ResetPassword.jsx';

// Import patient dashboard components
import PatientDashboard from '../components/pages/Dashboard/PatientDashboard/PatientDashboard';
import PatientAppointments from '../components/pages/Dashboard/PatientDashboard/PatientAppointment/PatientAppointment';
import AppointmentBooking from '../components/pages/Dashboard/PatientDashboard/BookingAppointments/BookingAppointment.jsx'
import PatientMedicalRecords from '../components/pages/Dashboard/PatientDashboard/PatientMedicalRecords/PatientMedicalRecords';
import PatientPrescriptions from '../components/pages/Dashboard/PatientDashboard/PatientPrescriptions/PatientPrescriptions';
import PatientProfile from '../components/pages/Dashboard/PatientDashboard/PatientProfile/PatientProfile';
import PatientChatbot from '../components/pages/Dashboard/PatientDashboard/PatientChatbot/Chatbot.jsx';

// Import doctor dashboard components
import DoctorDashboard from '../components/pages/Dashboard/DoctorDashboard/DoctorDashboard';
import DoctorAppointments from '../components/pages/Dashboard/DoctorDashboard/DoctorAppointment/DoctorAppointment';
import DoctorPatients from '../components/pages/Dashboard/DoctorDashboard/DoctorPatient/DoctorPatient';
import DoctorPrescriptions from '../components/pages/Dashboard/DoctorDashboard/DoctorPrescriptions/DoctorPrescriptions';
import DoctorProfile from '../components/pages/Dashboard/DoctorDashboard/DoctorProfile/DoctorProfile';

// Import admin dashboard components
import AdminDashboard from '../components/pages/Dashboard/AdminDashboard/AdminDashboard';
import AdminUsers from '../components/pages/Dashboard/AdminDashboard/AdminUsers/AdminUsers';
import AdminDoctors from '../components/pages/Dashboard/AdminDashboard/AdminDoctors/AdminDoctors';
import AdminPatients from '../components/pages/Dashboard/AdminDashboard/AdminPatients/AdminPatients';
import AdminReports from '../components/pages/Dashboard/AdminDashboard/AdminReports/AdminReports';
import AdminSettings from '../components/pages/Dashboard/AdminDashboard/AdminSettings/AdminSettings';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public route - redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (isAuthenticated) {
    if (userRole === 'patient') {
      return <Navigate to="/dashboard/patient" replace />;
    } else if (userRole === 'doctor') {
      return <Navigate to="/dashboard/doctor" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    }
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Welcome />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Auth routes */}
      <Route 
        path="/signin" 
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } 
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Patient Dashboard Routes */}
      <Route 
        path="/dashboard/patient" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="/dashboard/patient/appointments" replace />} />
        <Route path="booking-appointment" element={<AppointmentBooking />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="chatbot" element={<PatientChatbot />} />
        <Route path="medical-records" element={<PatientMedicalRecords />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>
      
      {/* Doctor Dashboard Routes */}
      <Route 
        path="/dashboard/doctor" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="/dashboard/doctor/appointments" replace />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>
      
      {/* Admin Dashboard Routes */}
      <Route 
        path="/dashboard/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="/dashboard/admin/users" replace />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;