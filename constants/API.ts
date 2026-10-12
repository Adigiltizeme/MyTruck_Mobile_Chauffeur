/**
 * Configuration API Backend
 * URLs et endpoints pour connexion au backend NestJS
 */

// URL Backend depuis variable d'environnement (EAS env ou .env local)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

// Application web (pages légales publiques). Repli : URL de production connue du backend.
export const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? 'https://mytruck-transport.vercel.app';

export const LEGAL_URLS = {
  MENTIONS: `${WEB_APP_URL}/legal/mentions-legales`,
  CGU: `${WEB_APP_URL}/legal/cgu`,
  CONFIDENTIALITE: `${WEB_APP_URL}/legal/confidentialite`,
};

// Préfixe API v1
export const API_PREFIX = '/api/v1';

// URL complète API
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

if (__DEV__) {
  console.log('🔗 [API] Base URL:', API_BASE_URL);
}

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
  DELETE_PHOTO: (id: string) => `/commandes/${id}/photos`,
  CREATE_RAPPORT: (id: string) => `/commandes/${id}/rapports`,
  GET_RAPPORTS: (id: string) => `/commandes/${id}/rapports`,
  UPDATE_RAPPORT: (id: string, type: string) => `/commandes/${id}/rapports/${type}`,
  DELETE_RAPPORT: (id: string, type: string) => `/commandes/${id}/rapports/${type}`,
  SAVE_SIGNATURE: (id: string) => `/commandes/${id}/signature-livraison`,
  // Actions admin / direction
  ASSIGN_CHAUFFEURS: (id: string) => `/commandes/${id}/assign-chauffeurs`,
  UPDATE_STATUTS: (id: string) => `/commandes/${id}/statuts`,
};

// Endpoints Messagerie (mêmes routes que la messagerie web)
export const MESSAGING_ENDPOINTS = {
  CONVERSATIONS: '/messaging/conversations',
  CONVERSATION: (id: string) => `/messaging/conversations/${id}`,
  MARK_READ: (id: string) => `/messaging/conversations/${id}/read`,
  USER_DIRECTION: '/messaging/conversations/user-direction',
  MESSAGES: '/messaging/messages',
};

// Endpoints Magasins (noms des interlocuteurs côté admin)
export const MAGASINS_ENDPOINTS = {
  BASE: '/magasins',
};

// Endpoints Chauffeurs (liste pour le dispatch admin)
export const CHAUFFEURS_ENDPOINTS = {
  BASE: '/chauffeurs',
};

// Endpoints Notifications push
export const NOTIFICATIONS_ENDPOINTS = {
  REGISTER_DEVICE: '/notifications/devices',
  // Sans session : utilisable après expiration du JWT ou en différé
  FORGET_DEVICE: '/notifications/devices/forget',
};

// Endpoints Tracking GPS
export const TRACKING_ENDPOINTS = {
  WEBSOCKET: '/tracking',
  UPDATE_LOCATION: '/tracking/location',
  SHARE_LINK: (commandeId: string) => `/tracking/share/${commandeId}`,
  LAST_POSITION: (commandeId: string) => `/tracking/commande/${commandeId}/last-position`,
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
