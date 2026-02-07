/**
 * BottomTabsNavigator - Navigation principale app mobile chauffeur
 * Équivalent mobile de la Sidebar web
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import DeliveriesScreen from '../screens/DeliveriesScreen'; // ✅ NOUVEAU: Duplication exacte web
import MessagingScreen from '../screens/MessagingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E11D48', // Rouge My Truck
        tabBarInactiveTintColor: '#6B7280', // Gris
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#E11D48', // Rouge My Truck
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Tableau de bord',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text>
          ),
          headerShown: false, // DashboardScreen a son propre header
        }}
      />

      <Tab.Screen
        name="Deliveries"
        component={DeliveriesScreen}
        options={{
          title: 'Livraisons',
          tabBarLabel: 'Livraisons',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🚚</Text>
          ),
          headerShown: false, // ✅ DeliveriesScreen gère son propre header
        }}
      />

      <Tab.Screen
        name="Messaging"
        component={MessagingScreen}
        options={{
          title: 'Messagerie',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
          headerShown: true,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}
