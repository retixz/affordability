import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const register = (userData) => api.post('/register', userData);
export const login = (credentials) => api.post('/login', credentials);
export const createCheck = (checkData) => api.post('/checks', checkData);
export const getReport = (applicantId) => api.get(`/reports/${applicantId}`);
export const getApplicants = () => api.get('/applicants');

// You can add other API functions here as needed

export default api;
