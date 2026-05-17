import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Interceptor for logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const uploadDocument = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data;
};

export const getDocuments = async (page = 1, limit = 10, status = null) => {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await api.get('/documents', { params });
  return res.data;
};

export const getDocument = async (id) => {
  const res = await api.get(`/documents/${id}`);
  return res.data;
};

export const updateDocument = async (id, data) => {
  const res = await api.put(`/documents/${id}`, data);
  return res.data;
};

export const deleteDocument = async (id) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};

export const reextractDocument = async (id) => {
  const res = await api.post(`/documents/${id}/reextract`);
  return res.data;
};

export const getDashboardStats = async () => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};

export const getDashboardCharts = async () => {
  const res = await api.get('/dashboard/charts');
  return res.data;
};

export const searchDocuments = async (query, filters = {}, page = 1) => {
  const params = { q: query, page, limit: 10, ...filters };
  const res = await api.get('/search', { params });
  return res.data;
};

export const getDocumentImageUrl = (docId) => {
  const backendBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${backendBase}/api/documents/${docId}/image`;
};

export default api;
