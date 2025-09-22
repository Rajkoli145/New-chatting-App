import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState(null);

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/register', userData);
      
      // Store registration data for OTP verification
      setRegistrationData({
        phone: response.data.phone,
        ...userData
      });

      toast.success('OTP sent to your phone number!');
      
      // In development mode, show OTP
      if (response.data.otp) {
        toast.success(`Development OTP: ${response.data.otp}`, { duration: 10000 });
      }

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/verify-otp', { phone, otp });
      
      const { token: newToken, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setRegistrationData(null);

      toast.success('Phone number verified successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/login', { phone });
      
      const { token: newToken, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (phone) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/resend-otp', { phone });
      
      toast.success('OTP resent successfully!');
      
      // In development mode, show OTP
      if (response.data.otp) {
        toast.success(`Development OTP: ${response.data.otp}`, { duration: 10000 });
      }

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await axios.put('/auth/profile', profileData);
      
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRegistrationData(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully!');
  };

  const value = {
    user,
    token,
    loading,
    registrationData,
    register,
    verifyOTP,
    login,
    resendOTP,
    updateProfile,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
