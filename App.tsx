/**
 * App.tsx - Point d'entrée de l'application Mobile Chauffeur
 */

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
