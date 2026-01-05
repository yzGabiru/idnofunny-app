import axios from 'axios';

const api = axios.create({
  // Usa a variável de ambiente VITE_API_BASE_URL ou fallback para localhost
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', 
});

// Interceptador: Antes de cada requisição, insere o Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;