/**
 * SubscriptIQ Centralized Axios API Client
 * Manages HTTP configuration, JWT auth headers, error propagation,
 * and seamless fallback/toggle between live Spring Boot backend and local mock mode.
 */

import axios from 'axios';
import { handleMockRequest } from './mockAdapter';

// Base API URL configured via Vite environment variable or default Spring Boot port
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Check if Mock Mode is enabled. Defaults to false so it uses the real Spring Boot REST backend
export function isMockModeEnabled() {
  const localPref = localStorage.getItem('subscriptiq_use_mock');
  if (localPref !== null) {
    return localPref === 'true';
  }
  const envVal = import.meta.env.VITE_USE_MOCK;
  if (envVal !== undefined) {
    return envVal === 'true';
  }
  return false;
}

export function setMockMode(enabled) {
  localStorage.setItem('subscriptiq_use_mock', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('subscriptiq_mode_change'));
}

// Create centralized Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Interceptor: inject Bearer token into Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    // If mock mode is active, handle via Mock Adapter
    if (isMockModeEnabled()) {
      config.adapter = async (cfg) => {
        const res = await handleMockRequest(cfg);
        return {
          data: res.data,
          status: res.status,
          statusText: 'OK',
          headers: {},
          config: cfg,
          request: {},
        };
      };
      return config;
    }

    // Live API mode: attach JWT token if present
    const token = localStorage.getItem('subscriptiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: normalize response and errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error messaging for components
    const data = error.response?.data;
    let message = data?.message || data?.error || error.message || 'An unexpected error occurred';
    
    // If field errors exist, format detailed message
    if (data?.errors && typeof data.errors === 'object') {
      const fieldMessages = Object.entries(data.errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      if (fieldMessages) {
        message = `${message} (${fieldMessages})`;
      }
    }
    
    // Auto-logout on 401 if not in mock mode
    if (error.response?.status === 401 && !isMockModeEnabled()) {
      localStorage.removeItem('subscriptiq_token');
      localStorage.removeItem('subscriptiq_user');
      window.dispatchEvent(new Event('subscriptiq_unauthorized'));
    }

    return Promise.reject({
      status: error.response?.status,
      message: message,
      errors: data?.errors || null,
      originalError: error,
    });
  }
);

export default apiClient;
