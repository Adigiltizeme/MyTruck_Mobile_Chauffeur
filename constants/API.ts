/**
 * Configuration API Backend
 * URLs et endpoints pour connexion au backend NestJS
 */

// URL Backend depuis variable d'environnement (.env → EXPO_PUBLIC_API_BASE_URL)
// Fallback Railway si la variable n'est pas définie
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://mytruckprojectbackend-production.up.railway.app';

// Préfixe API v1
export const API_PREFIX = '/api/v1';

// URL complète API
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

console.log('🔗 [API] Base URL:', API_BASE_URL);

// Endpoints Auth
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
};

// Endpoints Commandes
export const COMMANDES_ENDPOINTS = {
  BASE: '/commandes',
  BY_ID: (id: string) => `/commandes/${id}`,
  BY_CHAUFFEUR: (chauffeurId: string) => `/commandes/chauffeur/${chauffeurId}`,
  UPDATE_STATUT_COMMANDE: (id: string) => `/commandes/${id}/statut-commande`,
  UPDATE_STATUT_LIVRAISON: (id: string) => `/commandes/${id}/statut-livraison`,
  ADD_PHOTO: (id: string) => `/commandes/${id}/photos-livraison`,
  CREATE_RAPPORT: (id: string) => `/commandes/${id}/rapports`,
  GET_RAPPORTS: (id: string) => `/commandes/${id}/rapports`,
};

// Endpoints Tracking GPS
export const TRACKING_ENDPOINTS = {
  WEBSOCKET: '/tracking',
  UPDATE_LOCATION: '/tracking/location',
};

// Timeout requêtes (en ms)
export const API_TIMEOUT = 30000; // 30 secondes

// Intervalle refresh données (en ms)
export const REFRESH_INTERVAL = 60000; // 1 minute

// Intervalle envoi position GPS (en ms)
export const GPS_UPDATE_INTERVAL = 30000; // 30 secondes

export default {
  API_BASE_URL,
  API_URL,
  AUTH_ENDPOINTS,
  COMMANDES_ENDPOINTS,
  TRACKING_ENDPOINTS,
  API_TIMEOUT,
  REFRESH_INTERVAL,
  GPS_UPDATE_INTERVAL,
};
