/**
 * Service d'Authentification
 * Gère le login/logout des chauffeurs
 */

import apiService from './api.service';
import { AUTH_ENDPOINTS } from '../constants/API';
import type { LoginResponse, User, ApiResponse } from '../constants/Types';

export const authService = {
  /**
   * Login chauffeur
   * @param email - Email du chauffeur
   * @param password - Mot de passe
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('🔐 [AUTH] Tentative de connexion:', email);

      const response = await apiService.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      if (response.success && response.data) {
        // Backend renvoie access_token, pas token
        const backendData = response.data as any;
        const token = backendData.access_token || backendData.token;
        const user = backendData.user;

        console.log('🔍 [AUTH] Réponse backend:', JSON.stringify({
          hasAccessToken: !!backendData.access_token,
          hasToken: !!backendData.token,
          userRole: user?.role,
        }));

        if (!token || !user) {
          return {
            success: false,
            error: 'Réponse invalide du serveur',
          };
        }

        // Vérifier que c'est un chauffeur (role en majuscules: CHAUFFEUR)
        const roleUpperCase = user.role?.toUpperCase();
        if (roleUpperCase !== 'CHAUFFEUR') {
          console.warn('⚠️ [AUTH] Rôle non autorisé:', user.role);
          return {
            success: false,
            error: 'Accès réservé aux chauffeurs uniquement',
          };
        }

        // Sauvegarder token et user
        await apiService.setToken(token);
        await apiService.setUser(user);

        console.log('✅ [AUTH] Connexion réussie:', user.email);

        return {
          success: true,
          data: { token, user },
        };
      }

      return {
        success: false,
        error: 'Échec de la connexion',
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur login:', error);
      return {
        success: false,
        error: 'Erreur lors de la connexion',
      };
    }
  },

  /**
   * Logout chauffeur
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 [AUTH] Déconnexion...');

      // Appel backend (optionnel)
      // await apiService.post(AUTH_ENDPOINTS.LOGOUT);

      // Supprimer token et user localement
      await apiService.clearAuth();

      console.log('✅ [AUTH] Déconnexion réussie');
    } catch (error) {
      console.error('❌ [AUTH] Erreur logout:', error);
      // Supprimer quand même les données locales
      await apiService.clearAuth();
    }
  },

  /**
   * Récupérer les données de session
   */
  async getSession(): Promise<{ token: string; user: User } | null> {
    try {
      const token = await apiService.getToken();
      const user = await apiService.getUser();

      if (token && user) {
        return { token, user };
      }

      return null;
    } catch (error) {
      console.error('❌ [AUTH] Erreur récupération session:', error);
      return null;
    }
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  },

  /**
   * Récupérer le profil utilisateur depuis le backend
   */
  async getMe(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get<User>(AUTH_ENDPOINTS.ME);
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la récupération du profil',
      };
    }
  },
};

export default authService;
