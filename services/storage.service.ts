/**
 * Service de stockage multi-plateforme
 * Gère AsyncStorage (mobile) et localStorage (web)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

/**
 * Service de stockage qui fonctionne sur mobile ET web
 */
export const StorageService = {
  /**
   * Sauvegarder une valeur
   */
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Mode Web - Utiliser localStorage
      localStorage.setItem(key, value);
    } else {
      // Mode Mobile - Utiliser AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  },

  /**
   * Récupérer une valeur
   */
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Mode Web - Utiliser localStorage
      return localStorage.getItem(key);
    } else {
      // Mode Mobile - Utiliser AsyncStorage
      return await AsyncStorage.getItem(key);
    }
  },

  /**
   * Supprimer une valeur
   */
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Mode Web - Utiliser localStorage
      localStorage.removeItem(key);
    } else {
      // Mode Mobile - Utiliser AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  },

  /**
   * Supprimer plusieurs valeurs
   */
  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      // Mode Web - Utiliser localStorage
      keys.forEach((key) => localStorage.removeItem(key));
    } else {
      // Mode Mobile - Utiliser AsyncStorage
      await AsyncStorage.multiRemove(keys);
    }
  },

  /**
   * Sauvegarder le token
   */
  async setToken(token: string): Promise<void> {
    await this.setItem(TOKEN_KEY, token);
  },

  /**
   * Récupérer le token
   */
  async getToken(): Promise<string | null> {
    return await this.getItem(TOKEN_KEY);
  },

  /**
   * Supprimer le token
   */
  async removeToken(): Promise<void> {
    await this.removeItem(TOKEN_KEY);
  },

  /**
   * Sauvegarder les données utilisateur
   */
  async setUser(user: any): Promise<void> {
    await this.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Récupérer les données utilisateur
   */
  async getUser(): Promise<any | null> {
    const userData = await this.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Supprimer les données utilisateur
   */
  async removeUser(): Promise<void> {
    await this.removeItem(USER_KEY);
  },

  /**
   * Nettoyer toutes les données d'authentification
   */
  async clearAuth(): Promise<void> {
    await this.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};

export default StorageService;
