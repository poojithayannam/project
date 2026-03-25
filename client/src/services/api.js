import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const submitFeedback = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/feedback`, payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    console.error('Error logging in', error);
    throw error;
  }
};

export const register = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, { email, password });
    return response.data;
  } catch (error) {
    console.error('Error registering', error);
    throw error;
  }
};

export const fetchAnalytics = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/feedback/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics', error);
    throw error;
  }
};

export const fetchRecommendations = async (category = 'All') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/feedback/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { category }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations', error);
    throw error;
  }
};

export const fetchAnomalies = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/intelligence/anomalies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching anomalies', error);
    throw error;
  }
};
