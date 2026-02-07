/**
 * DeliveriesScreen - Écran principal Livraisons (Duplication exacte web)
 * Reproduit l'interface web : Liste + Filtres + Détails expandable
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useCommandes } from '../hooks/useCommandes';
import type { Commande } from '../constants/Types';
import { DeliveryRow } from '../components/deliveries/DeliveryRow';
import { DeliveryDetails } from '../components/deliveries/DeliveryDetails';

type TabFilter = 'all' | 'today' | 'upcoming' | 'history';

export const DeliveriesScreen: React.FC = () => {
  const { user } = useAuth();
  const { commandes, loading, refresh } = useCommandes({ autoConnect: true, autoLoad: true });

  // États
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null);

  // Filtrage des commandes selon l'onglet actif
  const filteredCommandes = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filtered = commandes;

    // Filtre par onglet
    switch (activeTab) {
      case 'today':
        filtered = commandes.filter((cmd) => {
          if (!cmd.dateLivraison) return false;
          const deliveryDate = new Date(cmd.dateLivraison);
          return deliveryDate >= today && deliveryDate < tomorrow;
        });
        break;

      case 'upcoming':
        filtered = commandes.filter((cmd) => {
          if (!cmd.dateLivraison) return false;
          const deliveryDate = new Date(cmd.dateLivraison);
          return deliveryDate >= tomorrow;
        });
        break;

      case 'history':
        filtered = commandes.filter((cmd) => {
          return cmd.statutLivraison === 'LIVREE' || cmd.statutLivraison === 'ANNULEE';
        });
        break;

      default: // 'all'
        break;
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

  // Compter commandes par onglet
  const tabCounts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      all: commandes.length,
      today: commandes.filter((cmd) => {
        if (!cmd.dateLivraison) return false;
        const d = new Date(cmd.dateLivraison);
        return d >= today && d < tomorrow;
      }).length,
      upcoming: commandes.filter((cmd) => {
        if (!cmd.dateLivraison) return false;
        return new Date(cmd.dateLivraison) >= tomorrow;
      }).length,
      history: commandes.filter((cmd) =>
        ['LIVREE', 'ANNULEE'].includes(cmd.statutLivraison)
      ).length,
    };
  }, [commandes]);

  // Gestion sélection commande
  const handleToggleDetails = (commandeId: string) => {
    setSelectedCommandeId((prev) => (prev === commandeId ? null : commandeId));
  };

  const selectedCommande = useMemo(
    () => commandes.find((c) => c.id === selectedCommandeId),
    [commandes, selectedCommandeId]
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
      </View>

      {/* Onglets de filtres */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Toutes ({tabCounts.all})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.tabActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            Aujourd'hui ({tabCounts.today})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            À venir ({tabCounts.upcoming})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique ({tabCounts.history})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Affichage nombre de commandes */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>
          Affichage de {filteredCommandes.length} commande(s) assignée(s) à{' '}
          {user?.prenom} {user?.nom}
        </Text>
      </View>

      {/* Liste des livraisons */}
      <ScrollView style={styles.listContainer}>
        {filteredCommandes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune livraison à afficher</Text>
          </View>
        ) : (
          filteredCommandes.map((commande) => (
            <View key={commande.id}>
              <DeliveryRow
                commande={commande}
                isExpanded={selectedCommandeId === commande.id}
                onToggle={() => handleToggleDetails(commande.id)}
              />
              {selectedCommandeId === commande.id && selectedCommande && (
                <DeliveryDetails commande={selectedCommande} />
              )}
            </View>
          ))
        )}
      </ScrollView>
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
    fontSize: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#EF4444',
    fontWeight: '600',
  },
  resultHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultText: {
    fontSize: 13,
    color: '#6B7280',
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default DeliveriesScreen;
