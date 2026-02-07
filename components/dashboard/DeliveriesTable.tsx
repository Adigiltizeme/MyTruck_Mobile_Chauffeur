/**
 * DeliveriesTable - Tableau livraisons récentes (Mobile)
 * Version simplifiée : Client, Magasin, Statut, Date/Heure, EyeIcon
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import type { Commande } from '../../constants/Types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ FONCTIONS HELPER : Mêmes que DeliveriesTable web
const getStatusDatesCache = async () => {
  try {
    const cached = await AsyncStorage.getItem('statusDatesCache');
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const getStatusDateFromCache = async (
  commandeId: string,
  statusType: 'commande' | 'livraison',
  status: string
): Promise<string | null> => {
  const cache = await getStatusDatesCache();
  return cache[commandeId]?.[statusType]?.[status] || null;
};

const getUpdateDateForStatus = (commande: Commande, statusType: 'commande' | 'livraison'): string | null => {
  const misAJour = commande?.dates?.misAJour;

  if (!misAJour) {
    return null;
  }

  // Nouveau format (objet avec commande/livraison séparées)
  if (typeof misAJour === 'object' && misAJour !== null) {
    return statusType === 'commande' ? misAJour.commande || null : misAJour.livraison || null;
  }

  // Ancien format (string)
  return typeof misAJour === 'string' ? misAJour : null;
};

const getSmartStatusDate = async (
  commande: Commande,
  statusType: 'commande' | 'livraison',
  currentStatus: string
): Promise<Date> => {
  // 1. D'abord essayer depuis le cache local
  const cachedDate = await getStatusDateFromCache(commande.id, statusType, currentStatus);
  if (cachedDate) {
    return new Date(cachedDate);
  }

  // 2. Si pas dans le cache, logique intelligente selon le statut
  if (statusType === 'commande') {
    const isDefaultStatus = !currentStatus || currentStatus === 'En attente';
    if (isDefaultStatus) {
      // Pour statut par défaut, utiliser date de commande
      return commande?.dates?.commande
        ? new Date(commande.dates.commande)
        : commande.dateCommande
        ? new Date(commande.dateCommande)
        : new Date();
    } else {
      // Pour autres statuts, essayer dates.misAJour puis fallback dateCommande
      const updateDate = getUpdateDateForStatus(commande, 'commande');
      return updateDate
        ? new Date(updateDate)
        : commande?.dates?.commande
        ? new Date(commande.dates.commande)
        : commande.dateCommande
        ? new Date(commande.dateCommande)
        : new Date();
    }
  } else {
    // livraison
    const isDefaultStatus = !currentStatus || currentStatus === 'EN ATTENTE';
    if (isDefaultStatus) {
      // Pour EN_ATTENTE, utiliser dateLivraison (date planifiée)
      return commande.dateLivraison ? new Date(commande.dateLivraison) : new Date();
    } else {
      // Pour autres statuts (LIVREE, EN_COURS, etc.), utiliser date mise à jour ou date commande
      const updateDate = getUpdateDateForStatus(commande, 'livraison');
      return updateDate
        ? new Date(updateDate)
        : commande?.dates?.commande
        ? new Date(commande.dates.commande)
        : commande.dateCommande
        ? new Date(commande.dateCommande)
        : new Date();
    }
  }
};

interface DeliveryRowProps {
  commande: Commande;
  onPress: (commandeId: string) => void;
}

const DeliveryRow: React.FC<DeliveryRowProps> = ({ commande, onPress }) => {
  const [statusDate, setStatusDate] = useState<Date>(new Date());
  const [realTime, setRealTime] = useState<string>('--:--');

  const STATUS_STYLES: Record<string, { background: string; text: string }> = {
    'EN ATTENTE': { background: '#93C5FD', text: '#1E3A8A' },
    'CONFIRMEE': { background: '#A5B4FC', text: '#312E81' },
    'ENLEVEE': { background: '#C4B5FD', text: '#4C1D95' },
    'EN COURS DE LIVRAISON': { background: '#FDE047', text: '#713F12' },
    'LIVREE': { background: '#86EFAC', text: '#14532D' },
    'ANNULEE': { background: '#FCA5A5', text: '#7F1D1D' },
    'ECHEC': { background: '#FCA5A5', text: '#7F1D1D' },
  };

  const currentLivraisonStatus = commande.statutLivraison || 'EN ATTENTE';

  useEffect(() => {
    // 🔍 DEBUG: Afficher structure dates de la commande
    console.log('🔍 [DeliveryRow] Commande:', commande.id);
    console.log('🔍 [DeliveryRow] Statut:', currentLivraisonStatus);
    console.log('🔍 [DeliveryRow] dates:', commande.dates);
    console.log('🔍 [DeliveryRow] dateCommande:', commande.dateCommande);
    console.log('🔍 [DeliveryRow] dateLivraison:', commande.dateLivraison);

    getSmartStatusDate(commande, 'livraison', currentLivraisonStatus).then((date) => {
      console.log('🔍 [DeliveryRow] Date calculée:', date);
      setStatusDate(date);
      setRealTime(format(date, 'HH:mm')); // ✅ Pré-formatter l'heure comme dans le web
    });
  }, [commande.id, currentLivraisonStatus]);

  const statusStyle = STATUS_STYLES[currentLivraisonStatus] || {
    background: '#E5E7EB',
    text: '#374151',
  };

  return (
    <View style={styles.tableRow}>
      {/* Référence */}
      <Text style={[styles.cell, styles.referenceCell]} numberOfLines={1}>
        {commande.numeroCommande || 'N/A'}
      </Text>

      {/* Client */}
      <Text style={[styles.cell, styles.clientCell]} numberOfLines={1}>
        {commande.client ? `${commande.client.nom} ${commande.client.prenom}` : 'Non spécifié'}
      </Text>

      {/* Magasin */}
      <Text style={[styles.cell, styles.magasinCell]} numberOfLines={1}>
        {commande.magasin?.nom || 'Non spécifié'}
      </Text>

      {/* Chauffeur */}
      <Text style={[styles.cell, styles.chauffeurCell]} numberOfLines={1}>
        {commande.chauffeurs?.length > 0
          ? `${commande.chauffeurs[0].prenom} ${commande.chauffeurs[0].nom}`.trim()
          : 'Non spécifié'}
      </Text>

      {/* Statut */}
      <View style={[styles.cell, styles.statutCell]}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusStyle.background },
          ]}
        >
          <Text
            style={[styles.statusText, { color: statusStyle.text }]}
            numberOfLines={1}
          >
            {currentLivraisonStatus}
          </Text>
        </View>
      </View>

      {/* Date/Heure */}
      <View style={[styles.cell, styles.dateCell]}>
        <Text style={styles.dateText}>{format(statusDate, 'dd/MM')}</Text>
        <Text style={styles.timeText}>{realTime}</Text>
      </View>

      {/* Action (EyeIcon) */}
      <TouchableOpacity
        style={[styles.cell, styles.actionCell]}
        onPress={() => onPress(commande.id)}
      >
        <Ionicons name="eye-outline" size={24} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );
};

interface DeliveriesTableProps {
  commandes: Commande[];
  onCommandePress: (commandeId: string) => void;
}

export const DeliveriesTable: React.FC<DeliveriesTableProps> = ({ commandes, onCommandePress }) => {
  // ✅ 10 livraisons récentes
  const recentDeliveries = commandes.slice(0, 10);

  if (recentDeliveries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune livraison à afficher</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Livraisons récentes</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.referenceCell]}>Référence</Text>
            <Text style={[styles.headerCell, styles.clientCell]}>Client</Text>
            <Text style={[styles.headerCell, styles.magasinCell]}>Magasin</Text>
            <Text style={[styles.headerCell, styles.chauffeurCell]}>Chauffeur</Text>
            <Text style={[styles.headerCell, styles.statutCell]}>Statut</Text>
            <Text style={[styles.headerCell, styles.dateCell]}>Date/Heure</Text>
            <Text style={[styles.headerCell, styles.actionCell]}>Détails</Text>
          </View>

          {/* Rows */}
          {recentDeliveries.map((commande, index) => (
            <DeliveryRow
              key={`delivery-${commande.id}-${index}`}
              commande={commande}
              onPress={onCommandePress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 14,
    color: '#111827',
    justifyContent: 'center',
  },
  referenceCell: {
    width: 100,
    paddingRight: 8,
  },
  clientCell: {
    width: 120,
    paddingRight: 8,
  },
  magasinCell: {
    width: 120,
    paddingRight: 8,
  },
  chauffeurCell: {
    width: 120,
    paddingRight: 8,
  },
  statutCell: {
    width: 150,
    paddingRight: 8,
  },
  dateCell: {
    width: 80,
    paddingRight: 8,
  },
  actionCell: {
    width: 60,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default DeliveriesTable;
