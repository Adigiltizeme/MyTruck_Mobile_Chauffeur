/**
 * DeliveriesListScreen - Liste complète des livraisons
 * Pour l'onglet "Livraisons" (pas le dashboard)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import commandesService from '../services/commandes.service';
import DateFilterSelector, { PeriodType } from '../components/dashboard/DateFilterSelector';
import CustomDatePicker, { DateRange } from '../components/dashboard/CustomDatePicker';
import type { Commande } from '../constants/Types';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';

export default function DeliveriesListScreen() {
  const { user } = useAuth();

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<PeriodType>('day');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null,
    mode: 'range',
    singleDate: null,
  });

  // Charger commandes
  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    const chauffeurId = user?.chauffeurId || user?.id;

    if (!chauffeurId) {
      console.warn('⚠️ Aucun chauffeurId trouvé');
      setLoading(false);
      return;
    }

    try {
      const response = await commandesService.getCommandesByChauffeur(chauffeurId);

      if (response.success && response.data) {
        const commandesList = Array.isArray(response.data) ? response.data : [];
        setCommandes(commandesList);
      } else {
        setCommandes([]);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setCommandes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommandes();
  }, [user?.id]);

  // Filtrage des commandes (même logique que DashboardScreen)
  const filteredCommandes = React.useMemo(() => {
    if (commandes.length === 0) return [];

    let filtered = [...commandes];
    const now = new Date();

    // Dates personnalisées prioritaires
    if (customDateRange.singleDate || (customDateRange.start && customDateRange.end)) {
      const startDate = customDateRange.singleDate
        ? parseISO(customDateRange.singleDate)
        : customDateRange.start
        ? parseISO(customDateRange.start)
        : null;

      const endDate = customDateRange.singleDate
        ? parseISO(customDateRange.singleDate)
        : customDateRange.end
        ? parseISO(customDateRange.end)
        : null;

      if (startDate && endDate) {
        filtered = filtered.filter((c) => {
          const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
          if (!dateLivraison) return false;
          return isWithinInterval(dateLivraison, {
            start: startOfDay(startDate),
            end: endOfDay(endDate),
          });
        });
      }
    } else {
      // Filtrage par période
      switch (dateRange) {
        case 'day':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfDay(now),
              end: endOfDay(now),
            });
          });
          break;
        case 'week':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfWeek(now, { weekStartsOn: 1 }),
              end: endOfWeek(now, { weekStartsOn: 1 }),
            });
          });
          break;
        case 'month':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfMonth(now),
              end: endOfMonth(now),
            });
          });
          break;
        case 'year':
          filtered = filtered.filter((c) => {
            const dateLivraison = c.dateLivraison ? parseISO(c.dateLivraison) : null;
            if (!dateLivraison) return false;
            return isWithinInterval(dateLivraison, {
              start: startOfYear(now),
              end: endOfYear(now),
            });
          });
          break;
      }
    }

    return filtered;
  }, [commandes, dateRange, customDateRange]);

  const handleCommandePress = (commandeId: string) => {
    console.log('📦 Navigation vers commande:', commandeId);
    // TODO: Navigation vers CommandeDetailsScreen
  };

  const renderCommande = ({ item }: { item: Commande }) => {
    const STATUS_STYLES: Record<string, { background: string; text: string }> = {
      'EN ATTENTE': { background: '#93C5FD', text: '#1E3A8A' },
      'CONFIRMEE': { background: '#A5B4FC', text: '#312E81' },
      'ENLEVEE': { background: '#C4B5FD', text: '#4C1D95' },
      'EN COURS DE LIVRAISON': { background: '#FDE047', text: '#713F12' },
      'LIVREE': { background: '#86EFAC', text: '#14532D' },
      'ANNULEE': { background: '#FCA5A5', text: '#7F1D1D' },
    };

    const statusStyle = STATUS_STYLES[item.statutLivraison || 'EN ATTENTE'] || {
      background: '#E5E7EB',
      text: '#374151',
    };

    const deliveryDate = item.dateLivraison ? parseISO(item.dateLivraison) : new Date();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCommandePress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.numeroCommande}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.statutLivraison}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.label}>Client: </Text>
            <Text style={styles.value}>{item.client?.nom || 'Non spécifié'}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="storefront-outline" size={16} color="#6B7280" />
            <Text style={styles.label}>Magasin: </Text>
            <Text style={styles.value}>{item.magasin?.nom || 'Non spécifié'}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.label}>Date: </Text>
            <Text style={styles.value}>{format(deliveryDate, 'dd/MM/yyyy')}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.label}>Heure: </Text>
            <Text style={styles.value}>{format(deliveryDate, 'HH:mm')}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Chargement des livraisons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes livraisons</Text>
        <Text style={styles.subtitle}>
          {filteredCommandes.length} livraison{filteredCommandes.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filtres */}
      <DateFilterSelector value={dateRange} onChange={setDateRange} />
      <CustomDatePicker value={customDateRange} onChange={setCustomDateRange} />

      {/* Liste des livraisons */}
      <FlatList
        data={filteredCommandes}
        renderItem={renderCommande}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Aucune livraison</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
