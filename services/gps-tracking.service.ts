/**
 * Service GPS Tracking Mobile (Expo)
 *
 * Amélioration du gps-tracking.service.ts web :
 * ✅ expo-location (meilleure précision, gestion batterie native)
 * ✅ Foreground : Socket.IO WebSocket → temps réel pour admin/magasin
 * ✅ Background : expo-task-manager (Android foreground service) → REST API
 * ✅ Gestion permissions Expo (foreground + background)
 * ✅ Singleton persistant entre navigations
 */

import * as Location from 'expo-location';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_URL } from '../constants/API';

// Nom de la tâche background (référencé dans App.tsx)
export const BACKGROUND_LOCATION_TASK = 'mytruck-gps-tracking';

// Clé AsyncStorage pour partager la config avec la tâche background
export const TRACKING_CONFIG_KEY = 'gps_tracking_config';

type Socket = ReturnType<typeof io>;

export type TrackingStatus = 'idle' | 'starting' | 'active';

export interface TrackingConfig {
  chauffeurId: string;
  chauffeurName: string;
  commandeId: string;
  token: string;
}

class GPSTrackingService {
  private static instance: GPSTrackingService;
  private socket: Socket | null = null;
  private foregroundSubscription: Location.LocationSubscription | null = null;
  private status: TrackingStatus = 'idle';
  private config: TrackingConfig | null = null;
  private onStatusChange?: (status: TrackingStatus) => void;

  private constructor() {}

  static getInstance(): GPSTrackingService {
    if (!GPSTrackingService.instance) {
      GPSTrackingService.instance = new GPSTrackingService();
    }
    return GPSTrackingService.instance;
  }

  /**
   * Démarrer le tracking GPS.
   * - Demande les permissions foreground (obligatoire) et background (optionnel)
   * - Lance le watch foreground via expo-location (précision BestForNavigation)
   * - Lance la tâche background si permission accordée (Android foreground service)
   * - Connecte le WebSocket pour l'émission temps réel
   */
  async start(
    config: TrackingConfig,
    onStatusChange?: (status: TrackingStatus) => void,
  ): Promise<{ success: boolean; error?: string }> {
    // Déjà actif pour la même commande → rien à faire
    if (this.status === 'active' && this.config?.commandeId === config.commandeId) {
      return { success: true };
    }

    // Si actif pour une autre commande → arrêter d'abord
    if (this.status !== 'idle') {
      await this.stop();
    }

    this.config = config;
    this.onStatusChange = onStatusChange;
    this.setStatus('starting');

    // 1. Permission foreground obligatoire
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      this.setStatus('idle');
      return {
        success: false,
        error: 'Permission de localisation refusée. Activez-la dans les paramètres de l\'application.',
      };
    }

    // 2. Persister la config pour la tâche background (contexte JS isolé)
    await AsyncStorage.setItem(TRACKING_CONFIG_KEY, JSON.stringify(config));

    // 3. Connecter le WebSocket (foreground temps réel)
    this.connectWebSocket(config.token);

    // 4. Watch foreground : haute précision, intervalle 15s ou 50m
    this.foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 15000,
        distanceInterval: 50,
      },
      (location) => {
        this.emitLocation(location.coords.latitude, location.coords.longitude);
      },
    );

    this.setStatus('active');

    // 5. Background : permission optionnelle (Android foreground service notification)
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      try {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (!isRunning) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced, // Moins agressif en background
            timeInterval: 30000,    // Toutes les 30s en background
            distanceInterval: 100,  // Ou tous les 100m
            foregroundService: {    // Android : service prioritaire (pas tué par l'OS)
              notificationTitle: 'My Truck — Livraison en cours',
              notificationBody: 'Votre position est partagée avec votre équipe.',
              notificationColor: '#3B82F6',
            },
            pausesUpdatesAutomatically: false,
          });
          console.log('[GPS] ✅ Background task started');
        }
      } catch (bgError) {
        // Non bloquant : le tracking foreground fonctionne sans background
        console.warn('[GPS] Background task non disponible (non bloquant):', bgError);
      }
    } else {
      console.log('[GPS] Background permission non accordée — tracking foreground uniquement');
    }

    console.log('[GPS] ✅ Tracking démarré — commande:', config.commandeId);
    return { success: true };
  }

  /**
   * Arrêter le tracking GPS (foreground + background + WebSocket)
   */
  async stop(): Promise<void> {
    console.log('[GPS] ⏹️ Arrêt du tracking...');

    // Arrêter la subscription foreground
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
      this.foregroundSubscription = null;
    }

    // Arrêter la tâche background
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('[GPS] ✅ Background task stopped');
      }
    } catch {}

    // Déconnecter le WebSocket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Nettoyer la config persistée
    await AsyncStorage.removeItem(TRACKING_CONFIG_KEY);

    this.config = null;
    this.setStatus('idle');
    console.log('[GPS] ✅ Tracking arrêté');
  }

  isTracking(): boolean {
    return this.status === 'active';
  }

  getStatus(): TrackingStatus {
    return this.status;
  }

  private setStatus(status: TrackingStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  /**
   * Connexion Socket.IO pour émission temps réel vers la gateway WebSocket
   * La gateway rebroadcast 'chauffeur-location' à tous (admin/magasins → LiveTrackingMap)
   */
  private connectWebSocket(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[GPS] 🟢 WebSocket connecté:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[GPS] 🔴 WebSocket déconnecté:', reason);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.warn('[GPS] WebSocket erreur connexion:', err.message);
    });
  }

  /**
   * Émettre la position :
   * - Via WebSocket si connecté (temps réel → admin voit en direct)
   * - Via REST en fallback si WebSocket déconnecté
   */
  private emitLocation(latitude: number, longitude: number): void {
    if (!this.config) return;

    const payload = {
      chauffeurId: this.config.chauffeurId,
      chauffeurName: this.config.chauffeurName,
      latitude,
      longitude,
      commandeId: this.config.commandeId,
      statutLivraison: 'EN COURS DE LIVRAISON',
    };

    if (this.socket?.connected) {
      this.socket.emit('location-update', payload);
      console.log(`[GPS] 📍 WS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } else {
      // Fallback REST si WebSocket déconnecté
      this.postLocationREST(payload).catch(() => {});
    }
  }

  /**
   * Fallback REST (WebSocket déconnecté côté foreground)
   * Le backend émettra chauffeur-location via WebSocket après réception
   */
  private async postLocationREST(data: {
    chauffeurId: string;
    chauffeurName: string;
    latitude: number;
    longitude: number;
    commandeId: string;
  }): Promise<void> {
    const token = this.config?.token;
    if (!token) return;

    await fetch(`${API_URL}/tracking/position`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log(`[GPS] 📍 REST fallback: ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`);
  }
}

export const gpsTrackingService = GPSTrackingService.getInstance();
