/**
 * Hook useCommandes - Adapté de useCommandesRealtime.ts web
 * Gère WebSocket temps réel + chargement commandes chauffeur
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { StorageService } from '../services/storage.service';
import { API_BASE_URL } from '../constants/API';
import type { Commande } from '../constants/Types';
import commandesService from '../services/commandes.service';

interface UseCommandesProps {
  onCommandeUpdated?: (data: any) => void;
  onCommandeStatusChanged?: (data: any) => void;
  onCommandeChauffeurAssigned?: (data: any) => void;
  autoConnect?: boolean;
  autoLoad?: boolean;
}

export const useCommandes = ({
  onCommandeUpdated,
  onCommandeStatusChanged,
  onCommandeChauffeurAssigned,
  autoConnect = true,
  autoLoad = true,
}: UseCommandesProps = {}) => {
  const { user } = useAuth();
  const socketRef = useRef<any>(null);
  const isConnectingRef = useRef(false);

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les commandes du chauffeur
   */
  const loadCommandes = useCallback(async () => {
    if (!user?.chauffeurId && !user?.id) {
      console.warn('⚠️ [useCommandes] No chauffeur ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chauffeurId = user.chauffeurId || user.id;
      const response = await commandesService.getCommandesByChauffeur(chauffeurId);

      if (response.success && response.data) {
        console.log(`✅ [useCommandes] Loaded ${response.data.length} commandes`);
        setCommandes(response.data);
      } else {
        setError(response.error || 'Erreur chargement commandes');
      }
    } catch (err) {
      console.error('❌ [useCommandes] Error loading:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Ref toujours à jour pour éviter les stale closures dans les listeners ───
  const loadCommandesRef = useRef(loadCommandes);
  useEffect(() => {
    loadCommandesRef.current = loadCommandes;
  });

  const onCommandeUpdatedRef = useRef(onCommandeUpdated);
  const onCommandeStatusChangedRef = useRef(onCommandeStatusChanged);
  const onCommandeChauffeurAssignedRef = useRef(onCommandeChauffeurAssigned);
  useEffect(() => {
    onCommandeUpdatedRef.current = onCommandeUpdated;
    onCommandeStatusChangedRef.current = onCommandeStatusChanged;
    onCommandeChauffeurAssignedRef.current = onCommandeChauffeurAssigned;
  });

  /**
   * Connexion WebSocket — ne dépend que de user pour éviter les reconnexions inutiles
   */
  const connectWebSocket = useCallback(async () => {
    if (!user?.id || socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    console.log('🔌 [useCommandes] Connecting WebSocket...');

    const token = await StorageService.getToken();
    if (!token) {
      console.warn('❌ [useCommandes] No auth token, skipping WebSocket');
      isConnectingRef.current = false;
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['polling', 'websocket'], // polling-first pour Railway
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ [useCommandes] WebSocket connected:', socket.id);
      isConnectingRef.current = false;

      socket.emit('join-room', {
        userId: user.id,
        userType: user.role,
      });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('🔌 [useCommandes] WebSocket disconnected:', reason);
      isConnectingRef.current = false;
    });

    socket.on('connect_error', (err: Error) => {
      console.error('❌ [useCommandes] WebSocket error:', err.message);
      isConnectingRef.current = false;
    });

    // ─── Événements temps réel — noms correspondant au helper backend (EntityType-EntityAction) ───
    socket.on('commande-updated', (data: any) => {
      console.log('📦 [useCommandes] commande-updated:', data?.action);
      loadCommandesRef.current();
      onCommandeUpdatedRef.current?.(data);
    });

    socket.on('commande-created', (data: any) => {
      console.log('📦 [useCommandes] commande-created:', data?.entityId);
      loadCommandesRef.current();
      onCommandeUpdatedRef.current?.(data);
    });

    socket.on('commande-deleted', (data: any) => {
      console.log('🗑️ [useCommandes] commande-deleted:', data?.entityId);
      loadCommandesRef.current();
      onCommandeUpdatedRef.current?.(data);
    });

    // EntityAction.STATUS_CHANGED = 'status_changed' → 'commande-status_changed'
    socket.on('commande-status_changed', (data: any) => {
      console.log('🔄 [useCommandes] commande-status_changed:', data?.entityId);
      loadCommandesRef.current();
      onCommandeStatusChangedRef.current?.(data);
    });

    // EntityAction.ASSIGNED = 'assigned' → 'commande-assigned'
    socket.on('commande-assigned', (data: any) => {
      console.log('🚛 [useCommandes] commande-assigned:', data?.entityId);
      loadCommandesRef.current();
      onCommandeChauffeurAssignedRef.current?.(data);
    });

    socketRef.current = socket;
  }, [user?.id, user?.role]); // Dépend uniquement de l'identité user — pas de loadCommandes

  /**
   * Déconnexion WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 [useCommandes] Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectingRef.current = false;
    }
  }, []);

  // ─── Chargement initial ───
  useEffect(() => {
    if (autoLoad && user) {
      loadCommandes();
    }
  }, [user?.id, autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Connexion WebSocket ───
  useEffect(() => {
    if (autoConnect && user) {
      connectWebSocket();
    }
    return () => {
      disconnect();
    };
  }, [user?.id, autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Refresh au retour au premier plan (AppState) ───
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        console.log('📱 [useCommandes] App active — refreshing commandes');
        loadCommandesRef.current();

        // Reconnecter le WebSocket si déconnecté
        if (!socketRef.current?.connected && !isConnectingRef.current && user?.id) {
          connectWebSocket();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [connectWebSocket, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    commandes,
    loading,
    error,
    loadCommandes,
    refresh: loadCommandes,
    isConnected: socketRef.current?.connected || false,
    disconnect,
    reconnect: connectWebSocket,
  };
};

export default useCommandes;
