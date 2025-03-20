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

// Setup axios interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await api.post('/users/refresh-token');
        const { token } = refreshResponse.data;
        
        // Update token in localStorage
        localStorage.setItem('token', token);
        
        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect will be handled by the component
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
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkAuthStatus = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setUserRole(user.role);
        setToken(storedToken);
        
        // Set authorization header for all future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      
      // Set user in state
      setCurrentUser(user);
      setUserRole(user.role);
      setToken(token);
      
      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to sign in' 
      };
    }
  };

  // Sign up function
  const signUp = async (userData, role) => {
    try {
      // Format data for backend
      const formattedData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: role,
        phone: userData.phone || '' // Add phone if available
      };
      
      // Add doctor-specific fields if role is doctor
      if (role === 'doctor') {
        formattedData.specialization = userData.specialization;
        formattedData.licenseNumber = userData.licenseNumber;
      }
      
      const response = await api.post('/users/register', formattedData);
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);
      
      // Set user in state
      setCurrentUser(user);
      setUserRole(user.role);
      setToken(token);
      
      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user, token };
    } catch (error) {
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
    delete api.defaults.headers.common['Authorization'];
  };

  // Get current auth token
  const getToken = () => {
    return token || localStorage.getItem('token');
  };

  const value = {
    currentUser,
    userRole,
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