/**
 * DashboardScreen - Liste des commandes assignées au chauffeur
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import commandesService from '../services/commandes.service';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../constants/Colors';
import type { Commande } from '../constants/Types';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Charger les commandes au démarrage
   */
  useEffect(() => {
    loadCommandes();
  }, []);

  /**
   * Charger les commandes du chauffeur
   */
  const loadCommandes = async () => {
    // Pour un chauffeur, user.id EST le chauffeurId (backend auth.service.ts ligne 136)
    const chauffeurId = user?.chauffeurId || user?.id;

    if (!chauffeurId) {
      console.warn('⚠️ Aucun chauffeurId trouvé');
      setLoading(false);
      return;
    }

    try {
      console.log('📦 Chargement commandes pour chauffeur:', chauffeurId);

      const response = await commandesService.getCommandesByChauffeur(chauffeurId);

      console.log('📋 Réponse backend:', JSON.stringify({
        success: response.success,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
      }, null, 2));

      if (response.success && response.data) {
        const commandesList = Array.isArray(response.data) ? response.data : [];
        setCommandes(commandesList);
        console.log(`✅ ${commandesList.length} commandes chargées`);
      } else {
        console.error('❌ Erreur chargement commandes:', response.error);
        setCommandes([]);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Rafraîchir les commandes (pull-to-refresh)
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommandes();
  }, [user?.id]);

  /**
   * Gérer la déconnexion
   */
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  /**
   * Ouvrir le détail d'une commande
   */
  const handleCommandePress = (commande: Commande) => {
    // TODO: Navigation vers écran Retrait ou Livraison selon statut
    Alert.alert(
      'Commande',
      `#${commande.numeroCommande}\nStatut: ${commande.statutLivraison}`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Obtenir la couleur du badge statut
   */
  const getStatusColor = (statutLivraison: string) => {
    switch (statutLivraison) {
      case 'EN_ATTENTE':
        return Colors.status.enAttente;
      case 'EN_COURS':
        return Colors.status.enCours;
      case 'LIVRE':
        return Colors.status.livre;
      case 'ANNULE':
        return Colors.status.annule;
      default:
        return Colors.textSecondary;
    }
  };

  /**
   * Obtenir le libellé du statut
   */
  const getStatusLabel = (statutLivraison: string) => {
    switch (statutLivraison) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'LIVRE':
        return 'Livré';
      case 'ANNULE':
        return 'Annulé';
      default:
        return statutLivraison;
    }
  };

  /**
   * Render d'une commande
   */
  const renderCommande = ({ item }: { item: Commande }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCommandePress(item)}
      activeOpacity={0.7}
    >
      {/* Header Card */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>#{item.numeroCommande}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.statutLivraison) }]}>
          <Text style={styles.badgeText}>{getStatusLabel(item.statutLivraison)}</Text>
        </View>
      </View>

      {/* Info Magasin → Client */}
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>🏪 Retrait:</Text>
          <Text style={styles.value}>{item.magasin?.nom || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>📍 Livraison:</Text>
          <Text style={styles.value}>
            {item.client ? `${item.client.nom} ${item.client.prenom}` : 'N/A'}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text style={styles.label}>⏰ Retrait:</Text>
          <Text style={styles.value}>{item.heureRetrait || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>⏰ Livraison:</Text>
          <Text style={styles.value}>{item.heureLivraison || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render chargement
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes Livraisons</Text>
          <Text style={styles.headerSubtitle}>
            {user?.prenom} {user?.nom}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Liste Commandes */}
      <FlatList
        data={commandes}
        renderItem={renderCommande}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySubtitle}>Vous n'avez aucune livraison assignée</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 20, // StatusBar
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textLight,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  logoutButton: {
    padding: Spacing.sm,
  },
  logoutText: {
    fontSize: 24,
  },
  list: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  badgeText: {
    color: Colors.textLight,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  cardBody: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  value: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});
