/**
 * DeliveriesScreen - Écran principal Livraisons (VERSION OPTIMISÉE)
 * Duplication EXACTE version web mobile responsive + optimisations UX React Native
 * Référence : frontend/src/pages/Deliveries/Deliveries.tsx lignes 898-972
 */

import React, { useState, useMemo } from 'react';
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

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9CA3AF"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ OPTIMISATION : Onglets en grille 2x2 (comme web mobile ligne 699) */}
      <View style={styles.tabsGrid}>
        <TouchableOpacity
          style={[styles.tabGridItem, activeTab === 'all' && styles.tabGridItemActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabGridText, activeTab === 'all' && styles.tabGridTextActive]}>
            Toutes
          </Text>
          <Text style={[styles.tabGridCount, activeTab === 'all' && styles.tabGridCountActive]}>
            ({tabCounts.all})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabGridItem, activeTab === 'today' && styles.tabGridItemActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabGridText, activeTab === 'today' && styles.tabGridTextActive]}>
            Aujourd'hui
          </Text>
          <Text style={[styles.tabGridCount, activeTab === 'today' && styles.tabGridCountActive]}>
            ({tabCounts.today})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabGridItem, activeTab === 'upcoming' && styles.tabGridItemActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabGridText, activeTab === 'upcoming' && styles.tabGridTextActive]}>
            À venir
          </Text>
          <Text
            style={[styles.tabGridCount, activeTab === 'upcoming' && styles.tabGridCountActive]}
          >
            ({tabCounts.upcoming})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabGridItem, activeTab === 'history' && styles.tabGridItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabGridText, activeTab === 'history' && styles.tabGridTextActive]}>
            Historique
          </Text>
          <Text style={[styles.tabGridCount, activeTab === 'history' && styles.tabGridCountActive]}>
            ({tabCounts.history})
          </Text>
        </TouchableOpacity>
      </View>

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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  // ✅ NOUVEAU : Grille 2x2 pour onglets
  tabsGrid: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabGridItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabGridItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabGridText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabGridTextActive: {
    color: '#EF4444',
    fontWeight: '600',
  },
  tabGridCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabGridCountActive: {
    color: '#EF4444',
    fontWeight: '600',
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
