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

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';

// Navigation
import BottomTabsNavigator from './navigation/BottomTabsNavigator';

// Types
import type { RootStackParamList } from './constants/Types';
import { Colors } from './constants/Colors';

// Créer le Stack Navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navigation principale de l'app
 */
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Afficher un spinner pendant la vérification de session
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
          <Stack.Screen name="Main" component={BottomTabsNavigator} />
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
