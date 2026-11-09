/**
 * Notifications push (Expo) : autorisation, enregistrement de l'appareil auprès du backend,
 * affichage au premier plan. En arrière-plan ou app fermée, c'est le système qui affiche.
 */

import { Platform } from 'react-native';
import type * as NotificationsModule from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api.service';
import { NOTIFICATIONS_ENDPOINTS } from '../constants/API';

const PUSH_TOKEN_KEY = 'pushToken';
// Retrait d'appareil qui a échoué (hors ligne) : retenté au prochain démarrage
const PENDING_FORGET_KEY = 'pushTokenPendingForget';

async function forgetOnServer(token: string): Promise<boolean> {
  const res = await apiService.post(NOTIFICATIONS_ENDPOINTS.FORGET_DEVICE, { token });
  return res.success;
}
// Expo Go (SDK 53+) n'embarque plus le push distant : y charger expo-notifications lève une erreur
// au démarrage. Le module n'est donc chargé que dans les builds (développement, preview, production).
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications: typeof NotificationsModule | null = isExpoGo ? null : require('expo-notifications');

// Doit correspondre au channelId envoyé par le backend (push.service.ts)
export const ANDROID_CHANNEL_ID = 'default';

export interface PushNotificationData {
  type?: string;
  commandeId?: string | null;
  conversationId?: string | null;
}

// Au premier plan : afficher quand même la bannière (sinon iOS/Android la masquent)
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || !Notifications) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Livraisons et messages',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

export const pushNotificationsService = {
  /**
   * Demande l'autorisation, récupère le jeton Expo et l'associe au compte connecté.
   * Retourne le jeton, ou null (simulateur, refus, erreur) sans jamais bloquer la connexion.
   */
  async register(): Promise<string | null> {
    try {
      if (!Notifications || !Device.isDevice) return null;
      await ensureAndroidChannel();

      const current = await Notifications.getPermissionsAsync();
      let granted = current.granted;
      if (!granted && current.canAskAgain) {
        granted = (await Notifications.requestPermissionsAsync()).granted;
      }
      if (!granted) return null;

      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('⚠️ [PUSH] projectId EAS introuvable');
        return null;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

      // Un retrait en attente pour ce même appareil est inutile : l'enregistrement le réattribue
      const pending = await AsyncStorage.getItem(PENDING_FORGET_KEY);
      if (pending && pending !== token) await forgetOnServer(pending).catch(() => false);
      if (pending) await AsyncStorage.removeItem(PENDING_FORGET_KEY);

      const res = await apiService.post(NOTIFICATIONS_ENDPOINTS.REGISTER_DEVICE, {
        token,
        platform: Platform.OS,
      });
      if (res.success) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      }
      return token;
    } catch (error) {
      console.warn('⚠️ [PUSH] Enregistrement impossible:', error);
      return null;
    }
  },

  /**
   * Ouvre l'écran lié à une notification touchée : app lancée depuis la notification (fermée),
   * puis toutes les suivantes. Retourne la fonction de désabonnement.
   */
  onNotificationOpened(handler: (data: PushNotificationData, id: string) => void): () => void {
    if (!Notifications) return () => undefined;
    const handle = (response: NotificationsModule.NotificationResponse) =>
      handler((response.notification.request.content.data || {}) as PushNotificationData, response.notification.request.identifier);

    // Réponse effacée ensuite pour ne pas la rejouer au prochain lancement normal
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handle(response);
        Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      }
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  },

  /** Déconnexion : l'appareil ne doit plus recevoir de push pour ce compte, même si le réseau manque. */
  async unregister(): Promise<void> {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    if (!token) return;
    const ok = await forgetOnServer(token).catch(() => false);
    if (!ok) await AsyncStorage.setItem(PENDING_FORGET_KEY, token);
  },

  /** Au démarrage sans session : termine un retrait qui avait échoué lors de la déconnexion. */
  async retryPendingForget(): Promise<void> {
    const pending = await AsyncStorage.getItem(PENDING_FORGET_KEY);
    if (!pending) return;
    const ok = await forgetOnServer(pending).catch(() => false);
    if (ok) await AsyncStorage.removeItem(PENDING_FORGET_KEY);
  },
};

export default pushNotificationsService;
