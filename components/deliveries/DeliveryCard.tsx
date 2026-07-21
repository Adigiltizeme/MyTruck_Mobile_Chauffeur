/**
 * DeliveryCard - Carte mobile type version web responsive
 * Duplication EXACTE de la version web mobile (lignes 898-972 Deliveries.tsx)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import type { Commande } from '../../constants/Types';

interface DeliveryCardProps {
  commande: Commande;
  isExpanded: boolean;
  onToggle: () => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({ commande, isExpanded, onToggle }) => {
  // Styles badges statuts (identiques web)
  const getStatutCommandeStyle = (statut: string) => {
    const styles = {
      'Confirmée': 'bg-green-100 text-green-800',
      'En cours': 'bg-blue-100 text-blue-800',
      'Livrée': 'bg-green-100 text-green-800',
      'Annulée': 'bg-red-100 text-red-800',
    };
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLivraisonStyle = (statut: string) => {
    const styles = {
      'EN ATTENTE': 'bg-blue-300 text-blue-900',
      'CONFIRMEE': 'bg-indigo-300 text-indigo-900',
      'ENLEVEE': 'bg-purple-300 text-purple-900',
      'EN COURS DE LIVRAISON': 'bg-yellow-300 text-yellow-900',
      'LIVREE': 'bg-green-300 text-green-900',
      'ANNULEE': 'bg-red-300 text-red-900',
      'ECHEC': 'bg-red-200 text-red-900',
    };
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatDateValue = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    try {
      return format(new Date(dateValue), 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const statutCmdClass = getStatutCommandeStyle(commande.statutCommande);
  const statutLivClass = getStatutLivraisonStyle(commande.statutLivraison);

  return (
    <View style={styles.card}>
      {/* En-tête carte */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.numeroCommande}>{commande.numeroCommande || 'N/A'}</Text>
          <Text style={styles.clientName}>
            {commande.client
              ? `${commande.client.nom?.toUpperCase() || ''} ${commande.client.prenom || ''}`.trim()
              : 'N/A'}
          </Text>
        </View>
        <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
          <Text style={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
      </View>

      {/* Info grid 2 colonnes (identique web) */}
      <View style={styles.infoGrid}>
        {/* Date */}
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Date:</Text>
          <Text style={styles.gridValue}>
            {formatDateValue(commande.dates?.livraison || commande.dateLivraison)}
          </Text>
        </View>

        {/* Créneau */}
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Créneau:</Text>
          <Text style={styles.gridValue}>{commande.livraison?.creneau || 'N/A'}</Text>
        </View>

        {/* Statut commande */}
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Statut commande:</Text>
          <View style={[styles.badge, getBadgeColors(statutCmdClass)]}>
            <Text style={[styles.badgeText, getBadgeTextColor(statutCmdClass)]}>
              {commande.statutCommande || 'En attente'}
            </Text>
          </View>
        </View>

        {/* Statut livraison */}
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Statut livraison:</Text>
          <View style={[styles.badge, getBadgeColors(statutLivClass)]}>
            <Text style={[styles.badgeText, getBadgeTextColor(statutLivClass)]}>
              {commande.statutLivraison || 'EN ATTENTE'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Helper pour convertir classes Tailwind → React Native styles
const getBadgeColors = (tailwindClass: string) => {
  if (tailwindClass.includes('green')) return { backgroundColor: '#D1FAE5' };
  if (tailwindClass.includes('blue')) return { backgroundColor: '#DBEAFE' };
  if (tailwindClass.includes('indigo')) return { backgroundColor: '#E0E7FF' };
  if (tailwindClass.includes('purple')) return { backgroundColor: '#EDE9FE' };
  if (tailwindClass.includes('yellow')) return { backgroundColor: '#FEF3C7' };
  if (tailwindClass.includes('red')) return { backgroundColor: '#FEE2E2' };
  return { backgroundColor: '#F3F4F6' };
};

const getBadgeTextColor = (tailwindClass: string) => {
  if (tailwindClass.includes('green')) return { color: '#065F46' };
  if (tailwindClass.includes('blue')) return { color: '#1E40AF' };
  if (tailwindClass.includes('indigo')) return { color: '#3730A3' };
  if (tailwindClass.includes('purple')) return { color: '#5B21B6' };
  if (tailwindClass.includes('yellow')) return { color: '#92400E' };
  if (tailwindClass.includes('red')) return { color: '#991B1B' };
  return { color: '#374151' };
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  numeroCommande: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleButton: {
    padding: 4,
  },
  toggleIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '48%', // 2 colonnes
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
