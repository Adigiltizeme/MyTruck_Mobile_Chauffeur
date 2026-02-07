/**
 * MessagingScreen - Messagerie temps réel chauffeur
 * TODO: Dupliquer RealTimeMessaging.tsx web
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessagingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Messagerie</Text>
      <Text style={styles.subtitle}>À implémenter (Phase 5)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});
