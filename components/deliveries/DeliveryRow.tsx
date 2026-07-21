/**
 * DeliveryRow - Ligne tableau livraison (Duplication exacte web)
 * Affiche : NUMÉRO | CLIENT | DATE | STATUT CMD | STATUT LIV | CRÉNEAU | VÉHICULE | RÉSERVE | MAGASIN
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import type { Commande } from '../../constants/Types';

interface DeliveryRowProps {
  commande: Commande;
  isExpanded: boolean;
  onToggle: () => void;
}

export const DeliveryRow: React.FC<DeliveryRowProps> = ({ commande, isExpanded, onToggle }) => {
  // Styles badges statuts
  const getStatutCommandeStyle = (statut: string) => {
    switch (statut) {
      case 'Confirmée':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'En cours':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'Livrée':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'Annulée':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#E5E7EB', text: '#374151' };
    }
  };

  const getStatutLivraisonStyle = (statut: string) => {
    switch (statut) {
      case 'EN ATTENTE':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'CONFIRMEE':
        return { bg: '#C7D2FE', text: '#3730A3' };
      case 'ENLEVEE':
        return { bg: '#DDD6FE', text: '#5B21B6' };
      case 'EN COURS DE LIVRAISON':
        return { bg: '#FEF08A', text: '#854D0E' };
      case 'LIVREE':
        return { bg: '#BBF7D0', text: '#14532D' };
      case 'ANNULEE':
      case 'ECHEC':
        return { bg: '#FECACA', text: '#7F1D1D' };
      default:
        return { bg: '#E5E7EB', text: '#374151' };
    }
  };

  const statutCmdStyle = getStatutCommandeStyle(commande.statutCommande);
  const statutLivStyle = getStatutLivraisonStyle(commande.statutLivraison);

  return (
    <TouchableOpacity
      style={[styles.container, isExpanded && styles.containerExpanded]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Indicateur expandable */}
      <View style={styles.expandIcon}>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color="#6B7280"
        />
      </View>

      {/* Colonnes du tableau */}
      <View style={styles.row}>
        {/* NUMÉRO */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>NUMÉRO</Text>
          <Text style={styles.cellValue}>{commande.numeroCommande}</Text>
        </View>

        {/* CLIENT */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>CLIENT</Text>
          <Text style={styles.cellValue}>
            {commande.client ? `${commande.client.nom} ${commande.client.prenom}` : 'N/A'}
          </Text>
        </View>

        {/* DATE LIVRAISON */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>DATE LIVRAISON</Text>
          <Text style={[styles.cellValue, styles.dateValue]}>
            {commande.dateLivraison
              ? format(new Date(commande.dateLivraison), 'dd/MM/yyyy')
              : 'N/A'}
          </Text>
        </View>

        {/* STATUT COMMANDE */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>STATUT COMMANDE</Text>
          <View style={[styles.badge, { backgroundColor: statutCmdStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statutCmdStyle.text }]}>
              {commande.statutCommande}
            </Text>
          </View>
        </View>

        {/* STATUT LIVRAISON */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>STATUT LIVRAISON</Text>
          <View style={[styles.badge, { backgroundColor: statutLivStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statutLivStyle.text }]}>
              {commande.statutLivraison}
            </Text>
          </View>
        </View>

        {/* CRÉNEAU */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>CRÉNEAU</Text>
          <Text style={styles.cellValue}>{commande.livraison?.creneau || 'N/A'}</Text>
        </View>

        {/* VÉHICULE */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>VÉHICULE</Text>
          <Text style={styles.cellValue}>{commande.livraison?.vehicule || 'N/A'}</Text>
        </View>

        {/* RÉSERVE */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>RÉSERVE</Text>
          <View
            style={[
              styles.reserveBadge,
              { backgroundColor: commande.livraison?.reserve ? '#FEF08A' : '#D1FAE5' },
            ]}
          >
            <Text
              style={[
                styles.reserveText,
                { color: commande.livraison?.reserve ? '#854D0E' : '#065F46' },
              ]}
            >
              {commande.livraison?.reserve ? 'OUI' : 'NON'}
            </Text>
          </View>
        </View>

        {/* MAGASIN */}
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>MAGASIN</Text>
          <Text style={[styles.cellValue, styles.magasinValue]}>
            {commande.magasin?.nom || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  containerExpanded: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  expandIcon: {
    marginRight: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    minWidth: 100,
    maxWidth: 180,
  },
  cellLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 14,
    color: '#111827',
  },
  dateValue: {
    color: '#D97706',
    fontWeight: '500',
  },
  magasinValue: {
    color: '#D97706',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reserveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  reserveText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
