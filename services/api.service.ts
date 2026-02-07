/**
 * Service API - Instance Axios avec interceptors
 * Gère toutes les requêtes HTTP vers le backend NestJS
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, API_TIMEOUT } from '../constants/API';
import type { ApiResponse } from '../constants/Types';
import { StorageService } from './storage.service';

/**
 * Instance Axios configurée
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor Request - Ajoute le token JWT
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await StorageService.getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log(`📤 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🔗 [API] Full URL: ${config.baseURL}${config.url}`);

      return config;
    } catch (error) {
      console.error('❌ [API] Error in request interceptor:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error('❌ [API REQUEST ERROR]:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Interceptor Response - Gère les erreurs
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 [API RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ [API ERROR] ${status} ${url}:`, error.message);

    // Token expiré ou invalide → Déconnexion
    if (status === 401) {
      console.warn('⚠️ [API] Token expired or invalid - Logging out');
      await StorageService.clearAuth();
      // TODO: Navigate to Login screen
    }

    // Erreur serveur
    if (status && status >= 500) {
      console.error('🔥 [API] Server error:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Service API - Méthodes CRUD
 */
export const apiService = {
  /**
   * GET request
   */
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<T>(url, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<T>(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.patch<T>(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<T>(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Upload file (FormData)
   */
  async upload<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Gestion centralisée des erreurs
   */
  handleError(error: any): ApiResponse {
    let message = 'Une erreur est survenue';

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      // Message du backend
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      }
      // Erreur réseau
      else if (axiosError.message === 'Network Error') {
        message = 'Erreur de connexion. Vérifiez votre connexion internet.';
      }
      // Timeout
      else if (axiosError.code === 'ECONNABORTED') {
        message = 'La requête a expiré. Veuillez réessayer.';
      }
      // Autre erreur Axios
      else {
        message = axiosError.message;
      }
    }

    return {
      success: false,
      error: message,
    };
  },

  /**
   * Sauvegarder le token
   */
  async setToken(token: string): Promise<void> {
    await StorageService.setToken(token);
  },

  /**
   * Récupérer le token
   */
  async getToken(): Promise<string | null> {
    return await StorageService.getToken();
  },

  /**
   * Supprimer le token
   */
  async removeToken(): Promise<void> {
    await StorageService.removeToken();
  },

  /**
   * Sauvegarder les données utilisateur
   */
  async setUser(user: any): Promise<void> {
    await StorageService.setUser(user);
  },

  /**
   * Récupérer les données utilisateur
   */
  async getUser(): Promise<any | null> {
    return await StorageService.getUser();
  },

  /**
   * Supprimer les données utilisateur
   */
  async removeUser(): Promise<void> {
    await StorageService.removeUser();
  },

  /**
   * Clear all auth data
   */
  async clearAuth(): Promise<void> {
    await StorageService.clearAuth();
  },
};

export default apiService;
