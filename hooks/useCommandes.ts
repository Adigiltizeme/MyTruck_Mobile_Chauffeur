/**
 * Hook useCommandes - Adapté de useCommandesRealtime.ts web
 * Gère WebSocket temps réel + chargement commandes chauffeur
 */

import { useEffect, useRef, useCallback, useState } from 'react';
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
  autoLoad?: boolean; // ⭐ NOUVEAU: Charger automatiquement les commandes
}

/**
 * Hook pour gérer les commandes du chauffeur avec WebSocket temps réel
 *
 * Événements WebSocket:
 * - commande-updated: Mise à jour générale d'une commande
 * - commande-status-changed: Changement de statut (commande ou livraison)
 * - commande-chauffeurs-assigned: Assignation/réassignation de chauffeurs
 */
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

  // ⭐ État local des commandes
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

  /**
   * Connexion WebSocket
   */
  const connectWebSocket = useCallback(async () => {
    console.log('🔌 [useCommandes] Connecting WebSocket...', {
      hasUser: !!user?.id,
      isConnected: socketRef.current?.connected,
      isConnecting: isConnectingRef.current,
    });

    // Éviter connexions multiples
    if (!user?.id || socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    // ✅ Utiliser StorageService au lieu de localStorage
    const token = await StorageService.getToken();
    if (!token) {
      console.warn('❌ [useCommandes] No auth token, skipping WebSocket');
      isConnectingRef.current = false;
      return;
    }

    // URL WebSocket (production Railway)
    const wsUrl = API_BASE_URL;
    console.log('🔌 [useCommandes] Connecting to:', wsUrl);

    // Créer connexion WebSocket
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Événements de connexion
    socket.on('connect', () => {
      console.log('✅ [useCommandes] WebSocket connected:', socket.id);
      isConnectingRef.current = false;

      // Rejoindre la room de l'utilisateur
      socket.emit('join-room', {
        userId: user.id,
        userType: user.role,
      });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('🔌 [useCommandes] WebSocket disconnected:', reason);
      isConnectingRef.current = false;
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ [useCommandes] WebSocket error:', error);
      isConnectingRef.current = false;
    });

    // ✅ ÉVÉNEMENTS COMMANDES TEMPS RÉEL
    socket.on('commande-updated', (data: any) => {
      console.log('📦 [useCommandes] Commande updated:', data);
      // ⭐ Recharger automatiquement
      loadCommandes();
      onCommandeUpdated?.(data);
    });

    socket.on('commande-status-changed', (data: any) => {
      console.log('🔄 [useCommandes] Status changed:', data);
      // ⭐ Recharger automatiquement
      loadCommandes();
      onCommandeStatusChanged?.(data);
    });

    socket.on('commande-chauffeurs-assigned', (data: any) => {
      console.log('🚛 [useCommandes] Chauffeurs assigned:', data);
      // ⭐ Recharger automatiquement
      loadCommandes();
      onCommandeChauffeurAssigned?.(data);
    });

    socketRef.current = socket;
  }, [user, loadCommandes, onCommandeUpdated, onCommandeStatusChanged, onCommandeChauffeurAssigned]);

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

  // ⭐ Chargement initial des commandes
  useEffect(() => {
    if (autoLoad && user) {
      loadCommandes();
    }
  }, [user?.id, autoLoad, loadCommandes]);

  // ⭐ Connexion WebSocket automatique
  useEffect(() => {
    if (autoConnect && user) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, autoConnect, connectWebSocket, disconnect]);

  return {
    // ⭐ Données
    commandes,
    loading,
    error,

    // ⭐ Actions
    loadCommandes,
    refresh: loadCommandes,

    // ⭐ WebSocket
    isConnected: socketRef.current?.connected || false,
    disconnect,
    reconnect: connectWebSocket,
  };
};

export default useCommandes;
