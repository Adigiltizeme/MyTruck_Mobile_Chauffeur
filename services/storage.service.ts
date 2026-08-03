/**
 * Service de stockage multi-plateforme
 * - Token JWT : expo-secure-store (iOS Keychain / Android Keystore chiffré)
 * - Données utilisateur : AsyncStorage (JSON > 2KB, moins critique)
 * - Web : localStorage pour les deux
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

// ─── Token via SecureStore (chiffré) ─────────────────────────────────────────

const setSecureToken = async (value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, value);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  }
};

const getSecureToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const deleteSecureToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

// ─── Données utilisateur via AsyncStorage ────────────────────────────────────

const setAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

const getAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await AsyncStorage.getItem(key);
};

const removeAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

// ─── Service public ───────────────────────────────────────────────────────────

export const StorageService = {
  async setItem(key: string, value: string): Promise<void> {
    if (key === TOKEN_KEY) {
      await setSecureToken(value);
    } else {
      await setAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (key === TOKEN_KEY) {
      return await getSecureToken();
    }
    return await getAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    if (key === TOKEN_KEY) {
      await deleteSecureToken();
    } else {
      await removeAsync(key);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.removeItem(key)));
  },

  async setToken(token: string): Promise<void> {
    await setSecureToken(token);
  },

  async getToken(): Promise<string | null> {
    return await getSecureToken();
  },

  async removeToken(): Promise<void> {
    await deleteSecureToken();
  },

  async setUser(user: any): Promise<void> {
    await setAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const userData = await getAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  async removeUser(): Promise<void> {
    await removeAsync(USER_KEY);
  },

  async clearAuth(): Promise<void> {
    await Promise.all([deleteSecureToken(), removeAsync(USER_KEY)]);
  },
};

export default StorageService;
