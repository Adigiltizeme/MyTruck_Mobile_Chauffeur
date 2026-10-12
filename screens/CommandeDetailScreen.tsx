/**
 * CommandeDetailScreen - Détail d'une commande/cession ouvert depuis une notification push
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Commande, RootStackParamList } from '../constants/Types';
import commandesService from '../services/commandes.service';
import { DeliveryCard } from '../components/deliveries/DeliveryCard';
import { DeliveryDetails } from '../components/deliveries/DeliveryDetails';

type Props = NativeStackScreenProps<RootStackParamList, 'CommandeDetail'>;

export const CommandeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { commandeId } = route.params;
  const [commande, setCommande] = useState<Commande | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await commandesService.getCommandeById(commandeId);
    if (res.success && res.data) {
      setCommande(res.data);
      setError(null);
    } else {
      setError(res.error || 'Commande introuvable');
    }
    setLoading(false);
  }, [commandeId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {commande ? `${commande.type === 'INTER_MAGASIN' ? 'Cession' : 'Commande'} ${commande.numeroCommande}` : 'Détail'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.centered} size="large" color="#E11D48" />
      ) : error || !commande ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
          <Text style={styles.errorText}>{error || 'Commande introuvable'}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.retry}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <DeliveryCard commande={commande} isExpanded onToggle={() => undefined} />
          <DeliveryDetails commande={commande} onStatusChanged={load} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 2 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111827' },
  content: { padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorText: { fontSize: 15, color: '#6B7280' },
  retry: { fontSize: 14, fontWeight: '600', color: '#E11D48' },
});

export default CommandeDetailScreen;
