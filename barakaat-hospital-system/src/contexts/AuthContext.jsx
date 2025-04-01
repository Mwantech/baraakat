import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create API base URL
export const API_BASE_URL = 'http://localhost:5500/api'; // Adjust this to your backend URL

// Create axios instance with base URL
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to apply auth token to axios instance
const applyAuthToken = (token) => {
  if (token) {
    // Apply to both header formats to ensure compatibility
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['x-auth-token'];
  }
};

// Setup axios interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Check if there is a token before attempting to refresh
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          throw new Error('No token available to refresh');
        }
        
        // Try to refresh the token
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'x-auth-token': currentToken
          }
        });
        
        const { token } = refreshResponse.data;
        
        // Update token in localStorage
        localStorage.setItem('token', token);
        
        // Update authorization header
        applyAuthToken(token);
        
        // Update headers in the original request
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['x-auth-token'] = token;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        
        // Return a rejected promise to trigger the sign-out process
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkAuthStatus = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('userRole');
      
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          // Make sure we set role from user object if available, or from separate storage
          setUserRole(user.role || storedRole);
          setToken(storedToken);
          
          // Apply token to axios instance
          applyAuthToken(storedToken);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear potentially corrupted data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        }
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Effect to update axios headers whenever token changes
  useEffect(() => {
    applyAuthToken(token);
  }, [token]);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      // Updated endpoint to match the backend
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      const { token, user } = response.data;
      
      // Make sure we have the role, either from user object or separate field
      const role = user.role || response.data.role;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', role);
      
      // Set user in state
      setCurrentUser(user);
      setUserRole(role);
      setToken(token);
      
      // Set authorization header for future requests
      applyAuthToken(token);
      
      return { success: true, user };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to sign in' 
      };
    }
  };

  // Sign up function
  const signUp = async (userData, role) => {
    try {
      // Determine the appropriate registration endpoint based on role
      let endpoint = '';
      
      if (role === 'patient') {
        endpoint = `${API_BASE_URL}/auth/register/patient`;
      } else if (role === 'doctor') {
        endpoint = `${API_BASE_URL}/auth/register/doctor`;
      } else if (role === 'admin') {
        endpoint = `${API_BASE_URL}/auth/register/admin`;
      } else {
        throw new Error('Invalid role specified');
      }
      
      // Format patient data
      if (role === 'patient') {
        userData = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || '',
          // Patient specific fields
          dateOfBirth: userData.dateOfBirth || null,
          gender: userData.gender || '',
          address: userData.address || '',
          bloodGroup: userData.bloodGroup || '',
          allergies: userData.allergies || [],
          medicalHistory: userData.medicalHistory || []
        };
      }
      
      // Format doctor data
      if (role === 'doctor') {
        userData = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || '',
          // Doctor specific fields
          specialization: userData.specialization,
          qualification: userData.qualification || [],
          licenseNumber: userData.licenseNumber,
          experience: userData.experience || 0,
          department: userData.department || userData.specialization,
          availableTime: userData.availableTime || [],
          fees: userData.fees || 0,
          bio: userData.bio || ''
        };
      }
      
      const response = await axios.post(endpoint, userData);
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role || role);
      
      // Set user in state
      setCurrentUser(user);
      setUserRole(user.role || role);
      setToken(token);
      
      // Set authorization header for future requests
      applyAuthToken(token);
      
      return { success: true, user, token };
    } catch (error) {
      console.error("Signup error:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to sign up' 
      };
    }
  };

  // Sign out function
  const signOut = () => {
    setCurrentUser(null);
    setUserRole(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // Remove authorization header
    applyAuthToken(null);
  };

  // Get current auth token
  const getToken = () => {
    // First check state, then fallback to localStorage
    return token || localStorage.getItem('token');
  };
  
  // Get current user role
  const getUserRole = () => {
    // First check state, then fallback to localStorage
    return userRole || localStorage.getItem('userRole');
  };

  const value = {
    currentUser,
    userRole,
    getUserRole,
    token,
    getToken,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;