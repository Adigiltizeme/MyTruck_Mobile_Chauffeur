/**
 * App.tsx - Point d'entrée de l'application Mobile Chauffeur
 */

// ──────────────────────────────────────────────────────────────────────────────
// IMPORTANT : defineTask DOIT être appelé au niveau module (avant tout rendu React)
// Le background task s'exécute dans un contexte JS isolé → pas accès au singleton
// Il lit la config depuis AsyncStorage et appelle le REST pour mettre à jour la position
// (le backend émettra chauffeur-location via WebSocket pour que l'admin voie la position)
// ──────────────────────────────────────────────────────────────────────────────
import './global.css';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_LOCATION_TASK, TRACKING_CONFIG_KEY } from './services/gps-tracking.service';
import { API_URL } from './constants/API';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[GPS BG] Task error:', (error as any).message);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const { latitude, longitude } = locations[0].coords;

  try {
    const configStr = await AsyncStorage.getItem(TRACKING_CONFIG_KEY);
    if (!configStr) return;

    const config = JSON.parse(configStr);

    // Appel REST → backend met à jour la position ET émet chauffeur-location via WebSocket
    await fetch(`${API_URL}/tracking/position`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chauffeurId: config.chauffeurId,
        chauffeurName: config.chauffeurName,
        latitude,
        longitude,
        commandeId: config.commandeId,
      }),
    });

    if (__DEV__) console.log(`[GPS BG] 📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
  } catch (err) {
    console.error('[GPS BG] Erreur REST:', err);
  }
});

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import CommandeDetailScreen from './screens/CommandeDetailScreen';
import type { PushNotificationData } from './services/push-notifications.service';

// Navigation
import BottomTabsNavigator from './navigation/BottomTabsNavigator';

// Types
import type { RootStackParamList } from './constants/Types';
import { Colors } from './constants/Colors';

// Créer le Stack Navigator
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Ouvre l'écran correspondant à une notification touchée (app ouverte, en arrière-plan ou fermée). */
function openFromNotification(data: PushNotificationData) {
  if (!navigationRef.isReady()) return false;
  if (data.type === 'NOUVEAU_MESSAGE') {
    (navigationRef as any).navigate('Main', {
      screen: 'Messaging',
      params: data.conversationId ? { conversationId: data.conversationId } : undefined,
    });
  } else if (data.type === 'COURSE_RETIREE') {
    // La course n'est plus la sienne : retour à la liste plutôt qu'au détail
    (navigationRef as any).navigate('Main', { screen: 'Deliveries' });
  } else if (data.commandeId) {
    navigationRef.navigate('CommandeDetail', { commandeId: data.commandeId });
  }
  return true;
}

/**
 * Navigation principale de l'app
 */
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const pendingRef = useRef<PushNotificationData | null>(null);
  const handledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handle = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (handledIdRef.current === id) return;
      handledIdRef.current = id;
      const data = (response.notification.request.content.data || {}) as PushNotificationData;
      if (!openFromNotification(data)) pendingRef.current = data;
    };

    // App lancée en touchant une notification alors qu'elle était fermée.
    // On efface ensuite cette réponse pour ne pas la rejouer au prochain lancement normal.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handle(response);
        Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      }
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [isAuthenticated]);

  const handleNavigationReady = () => {
    if (pendingRef.current && openFromNotification(pendingRef.current)) {
      pendingRef.current = null;
    }
  };

  // Afficher un spinner pendant la vérification de session
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Cacher le header par défaut
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          // Écrans publics (non connecté)
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Écrans protégés (connecté) - Navigation par Bottom Tabs
          <>
            <Stack.Screen name="Main" component={BottomTabsNavigator} />
            <Stack.Screen name="CommandeDetail" component={CommandeDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Composant principal de l'application
 */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
