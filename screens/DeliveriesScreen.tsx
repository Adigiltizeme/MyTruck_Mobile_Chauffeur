/**
 * DeliveriesScreen - Écran principal Livraisons (VERSION OPTIMISÉE)
 * Duplication EXACTE version web mobile responsive + optimisations UX React Native
 * Référence : frontend/src/pages/Deliveries/Deliveries.tsx lignes 898-972
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useCommandes } from '../hooks/useCommandes';
import type { Commande } from '../constants/Types';
import { DeliveryCard } from '../components/deliveries/DeliveryCard';
import { DeliveryDetails } from '../components/deliveries/DeliveryDetails';

type TabFilter = 'all' | 'today' | 'upcoming' | 'history';

export const DeliveriesScreen: React.FC = () => {
  const { user } = useAuth();
  const { commandes, loading, refresh } = useCommandes({ autoConnect: true, autoLoad: true });

  // États
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Filtrage IDENTIQUE version web (lignes 81-120)
  const filteredCommandes = useMemo(() => {
    const now = new Date();
    const todayFrance = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const todayStr = todayFrance; // Format YYYY-MM-DD

    let filtered = commandes;

    // Filtre temporel (MÊME LOGIQUE que web)
    if (activeTab !== 'all') {
      filtered = commandes.filter((cmd) => {
        const livraisonDate = cmd.dates?.livraison || cmd.dateLivraison;
        if (!livraisonDate) return false;

        const itemDate = new Date(livraisonDate);
        const itemDateStr = itemDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

        switch (activeTab) {
          case 'today':
            return itemDateStr === todayStr;
          case 'upcoming':
            return itemDateStr > todayStr;
          case 'history':
            return itemDateStr < todayStr;
          default:
            return true;
        }
      });
    }

    // Filtre par recherche
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (cmd) =>
          cmd.numeroCommande?.toLowerCase().includes(search) ||
          cmd.client?.nom?.toLowerCase().includes(search) ||
          cmd.client?.prenom?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [commandes, activeTab, searchText]);

  // Compteurs IDENTIQUES version web (lignes 133-194)
  const tabCounts = useMemo(() => {
    const todayFrance = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const todayStr = todayFrance;

    const counts = {
      all: commandes.length,
      today: 0,
      upcoming: 0,
      history: 0,
    };

    commandes.forEach((cmd) => {
      const livraisonDate = cmd.dates?.livraison || cmd.dateLivraison;
      if (!livraisonDate) return;

      const itemDate = new Date(livraisonDate);
      const itemDateStr = itemDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

      if (itemDateStr === todayStr) {
        counts.today++;
      } else if (itemDateStr > todayStr) {
        counts.upcoming++;
      } else if (itemDateStr < todayStr) {
        counts.history++;
      }
    });

    return counts;
  }, [commandes]);

  // Gestion sélection commande
  const handleToggleDetails = (commandeId: string) => {
    setSelectedCommandeId((prev) => (prev === commandeId ? null : commandeId));
  };

  const selectedCommande = useMemo(
    () => commandes.find((c) => c.id === selectedCommandeId),
    [commandes, selectedCommandeId]
  );

  // ✅ OPTIMISATION : Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // ✅ OPTIMISATION : Render item pour FlatList
  const renderItem = ({ item }: { item: Commande }) => (
    <View style={styles.cardWrapper}>
      <DeliveryCard
        commande={item}
        isExpanded={selectedCommandeId === item.id}
        onToggle={() => handleToggleDetails(item.id)}
      />
      {selectedCommandeId === item.id && selectedCommande && (
        <DeliveryDetails commande={selectedCommande} onStatusChanged={refresh} />
      )}
    </View>
  );

  // ✅ OPTIMISATION : Key extractor
  const keyExtractor = (item: Commande) => item.id;

  // ✅ OPTIMISATION : Empty component
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>Aucune livraison à afficher</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'today' && "Aucune livraison prévue aujourd'hui"}
        {activeTab === 'upcoming' && 'Aucune livraison à venir'}
        {activeTab === 'history' && 'Aucune livraison passée'}
        {activeTab === 'all' && 'Aucune commande assignée'}
      </Text>
    </View>
  );

  // ✅ OPTIMISATION : Header component
  const ListHeaderComponent = () => (
    <View style={styles.resultHeader}>
      <Text style={styles.resultText}>
        Affichage de {filteredCommandes.length} commande(s) assignée(s) à {user?.prenom}{' '}
        {user?.nom}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Mes Livraisons - {user?.prenom} {user?.nom}
        </Text>
      </View>

      {/* Barre de recherche + toggle filtres — ligne compacte */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9CA3AF"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, filtersExpanded && styles.filterToggleActive]}
          onPress={() => setFiltersExpanded(v => !v)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filtersExpanded ? 'chevron-up' : 'filter'}
            size={16}
            color={filtersExpanded ? '#EF4444' : '#6B7280'}
          />
          {activeTab !== 'all' && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filtres période — collapsables */}
      {filtersExpanded && (
        <View style={styles.tabsRow}>
          {(['all', 'today', 'upcoming', 'history'] as TabFilter[]).map((tab) => {
            const labels: Record<TabFilter, string> = {
              all: 'Toutes',
              today: "Auj.",
              upcoming: 'À venir',
              history: 'Passées',
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
                onPress={() => { setActiveTab(tab); setFiltersExpanded(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                  {labels[tab]}
                </Text>
                <Text style={[styles.tabChipCount, activeTab === tab && styles.tabChipCountActive]}>
                  {tabCounts[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ✅ OPTIMISATION : FlatList avec pull-to-refresh */}
      <FlatList
        data={filteredCommandes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EF4444"
            colors={['#EF4444']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // ✅ Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  // Ligne recherche + bouton filtre
  searchRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  filterToggle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleActive: {
    backgroundColor: '#FEE2E2',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  // Chips de filtre collapsables
  tabsRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 6,
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabChipTextActive: {
    color: '#EF4444',
    fontWeight: '600',
  },
  tabChipCount: {
    fontSize: 11,
    color: '#9CA3AF',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  tabChipCountActive: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  resultHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DeliveriesScreen;
