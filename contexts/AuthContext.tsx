/**
 * AuthContext - Gestion de l'authentification globale
 * Fournit l'état d'authentification à toute l'application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/auth.service';
import type { User, AuthState } from '../constants/Types';

// Interface du contexte
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Créer le contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props du Provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Fournit l'état d'authentification
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  /**
   * Vérifier l'authentification au démarrage
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Vérifier si l'utilisateur est déjà connecté
   */
  const checkAuth = async () => {
    try {
      console.log('🔐 [AUTH] Vérification session...');

      const session = await authService.getSession();

      if (session) {
        console.log('✅ [AUTH] Session trouvée:', session.user.email);

        setState({
          isAuthenticated: true,
          user: session.user,
          token: session.token,
          loading: false,
        });
      } else {
        console.log('⚠️ [AUTH] Aucune session trouvée');

        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur vérification session:', error);

      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
    }
  };

  /**
   * Connexion utilisateur
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 [AUTH] Tentative de connexion:', email);

      // Appeler le service auth
      const response = await authService.login(email, password);

      if (response.success && response.data) {
        const { token, user } = response.data;

        console.log('✅ [AUTH] Connexion réussie:', user.email);

        // Mettre à jour l'état
        setState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
        });

        return { success: true };
      }

      console.warn('⚠️ [AUTH] Échec de connexion:', response.error);

      return {
        success: false,
        error: response.error || 'Échec de la connexion',
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur login:', error);

      return {
        success: false,
        error: 'Une erreur est survenue lors de la connexion',
      };
    }
  };

  /**
   * Déconnexion utilisateur
   */
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 [AUTH] Déconnexion...');

      await authService.logout();

      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });

      console.log('✅ [AUTH] Déconnexion réussie');
    } catch (error) {
      console.error('❌ [AUTH] Erreur logout:', error);

      // Forcer la déconnexion même en cas d'erreur
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
    }
  };

  /**
   * Rafraîchir l'authentification
   */
  const refreshAuth = async (): Promise<void> => {
    await checkAuth();
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personnalisé pour utiliser l'AuthContext
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
