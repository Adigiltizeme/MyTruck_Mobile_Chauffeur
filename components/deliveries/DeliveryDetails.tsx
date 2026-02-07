/**
 * DeliveryDetails - Détails expandable commande (Duplication exacte web)
 * 6 onglets : Informations | Conditions spéciales | Photos articles | Photos commentaires | Chronologie | Actions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Commande } from '../../constants/Types';
import { format } from 'date-fns';

type TabType = 'info' | 'conditions' | 'photos-articles' | 'photos-comments' | 'chronologie' | 'actions';

interface DeliveryDetailsProps {
  commande: Commande;
}

export const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ commande }) => {
  const [activeTab, setActiveTab] = useState<TabType>('actions');

  // Styles badges statuts
  const getStatutStyle = (statut: string) => {
    if (statut === 'Confirmée' || statut === 'CONFIRMEE') {
      return { bg: '#DBEAFE', text: '#1E3A8A' };
    }
    return { bg: '#D1FAE5', text: '#065F46' };
  };

  const statutCmdStyle = getStatutStyle(commande.statutCommande);
  const statutLivStyle = getStatutStyle(commande.statutLivraison);

  return (
    <View style={styles.container}>
      {/* En-tête avec statuts */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commande #{commande.numeroCommande}</Text>
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, { backgroundColor: statutCmdStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statutCmdStyle.text }]}>
              {commande.statutCommande}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statutLivStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statutLivStyle.text }]}>
              {commande.statutLivraison}
            </Text>
          </View>
        </View>
      </View>

      {/* Onglets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Ionicons name="information-circle-outline" size={18} color={activeTab === 'info' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Informations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'conditions' && styles.tabActive]}
            onPress={() => setActiveTab('conditions')}
          >
            <Ionicons name="warning-outline" size={18} color={activeTab === 'conditions' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'conditions' && styles.tabTextActive]}>
              Conditions spéciales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos-articles' && styles.tabActive]}
            onPress={() => setActiveTab('photos-articles')}
          >
            <Ionicons name="camera-outline" size={18} color={activeTab === 'photos-articles' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'photos-articles' && styles.tabTextActive]}>
              Photos articles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos-comments' && styles.tabActive]}
            onPress={() => setActiveTab('photos-comments')}
          >
            <Ionicons name="chatbubble-outline" size={18} color={activeTab === 'photos-comments' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'photos-comments' && styles.tabTextActive]}>
              Photos commentaires
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'chronologie' && styles.tabActive]}
            onPress={() => setActiveTab('chronologie')}
          >
            <Ionicons name="time-outline" size={18} color={activeTab === 'chronologie' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'chronologie' && styles.tabTextActive]}>
              Chronologie
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
            onPress={() => setActiveTab('actions')}
          >
            <Ionicons name="flash-outline" size={18} color={activeTab === 'actions' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
              Actions
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Contenu selon onglet actif */}
      <View style={styles.content}>
        {activeTab === 'info' && <InfoTab commande={commande} />}
        {activeTab === 'conditions' && <ConditionsTab commande={commande} />}
        {activeTab === 'photos-articles' && <PhotosArticlesTab commande={commande} />}
        {activeTab === 'photos-comments' && <PhotosCommentsTab commande={commande} />}
        {activeTab === 'chronologie' && <ChronologieTab commande={commande} />}
        {activeTab === 'actions' && <ActionsTab commande={commande} />}
      </View>
    </View>
  );
};

// ✅ Onglet Informations (3 sections : Magasin, Client, Livraison)
const InfoTab: React.FC<{ commande: Commande }> = ({ commande }) => (
  <ScrollView style={styles.tabContent}>
    {/* Section Magasin */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Magasin</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Nom:</Text>
        <Text style={styles.infoValue}>{commande.magasin?.nom || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Téléphone:</Text>
        <Text style={[styles.infoValue, styles.phoneLink]}>
          {commande.magasin?.telephone || 'N/A'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Adresse:</Text>
        <Text style={styles.infoValue}>
          {commande.magasin?.adresse ? `${commande.magasin.adresse}, ${commande.magasin.codePostal} ${commande.magasin.ville}` : 'N/A'}
        </Text>
      </View>
    </View>

    {/* Section Client */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Nom:</Text>
        <Text style={styles.infoValue}>
          {commande.client ? `${commande.client.nom} ${commande.client.prenom}` : 'N/A'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Téléphone:</Text>
        <Text style={[styles.infoValue, styles.phoneLink]}>
          {commande.client?.telephone || 'N/A'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Adresse:</Text>
        <Text style={styles.infoValue}>
          {commande.client?.adresseLigne1 || 'N/A'}
        </Text>
      </View>
      {commande.client?.etage && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Étage:</Text>
          <Text style={styles.infoValue}>{commande.client.etage}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Ascenseur:</Text>
        <Text style={styles.infoValue}>{commande.client?.typeAdresse === 'Oui' ? 'Oui' : 'Non'}</Text>
      </View>
    </View>

    {/* Section Livraison */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Livraison</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Date:</Text>
        <Text style={styles.infoValue}>
          {commande.dateLivraison ? format(new Date(commande.dateLivraison), 'dd/MM/yyyy') : 'N/A'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Créneau:</Text>
        <Text style={styles.infoValue}>{commande.livraison?.creneau || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Véhicule:</Text>
        <Text style={styles.infoValue}>{commande.livraison?.vehicule || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Équipiers:</Text>
        <Text style={styles.infoValue}>{commande.livraison?.equipiers || 0}</Text>
      </View>
    </View>

    {/* Section Articles */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Articles</Text>
      {commande.articles && commande.articles.length > 0 && Array.isArray(commande.articles[0].dimensions) ? (
        commande.articles[0].dimensions.map((dim, index) => (
          <View key={index} style={styles.articleCard}>
            <Text style={styles.articleTitle}>
              {index === 0 ? '📦 [Article le plus grand]' : '⚖️ [Article le plus lourd]'} {dim.quantite > 1 ? `(x${dim.quantite})` : ''}
            </Text>
            <View style={styles.dimensionsRow}>
              <Text style={styles.dimensionText}>Longueur: {dim.longueur || 0} cm</Text>
              <Text style={styles.dimensionText}>Largeur: {dim.largeur || 0} cm</Text>
            </View>
            <View style={styles.dimensionsRow}>
              <Text style={styles.dimensionText}>Hauteur: {dim.hauteur || 0} cm</Text>
              <Text style={styles.dimensionText}>Poids: {dim.poids || 0} kg</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noData}>Aucun article avec dimensions</Text>
      )}
      {commande.articles?.[0]?.autresArticles && commande.articles[0].autresArticles > 0 && (
        <Text style={styles.autresArticles}>
          Dont {commande.articles[0].autresArticles} autre(s) article(s) (ni les plus grands, ni les plus lourds)
        </Text>
      )}
      <Text style={styles.totalArticles}>
        Nombre total: {commande.articles?.[0]?.nombre || 0}
      </Text>
    </View>

    {/* Section Chauffeur(s) */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chauffeur(s)</Text>
      {commande.chauffeurs && commande.chauffeurs.length > 0 ? (
        commande.chauffeurs.map((chauffeur) => (
          <View key={chauffeur.id} style={styles.chauffeurCard}>
            <Text style={styles.chauffeurName}>
              {chauffeur.prenom} {chauffeur.nom}
            </Text>
            <Text style={[styles.infoValue, styles.phoneLink]}>
              📞 {chauffeur.telephone}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noData}>Aucun chauffeur assigné</Text>
      )}
    </View>

    {/* Section Autres remarques */}
    {commande.livraison?.remarques && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Autres remarques</Text>
        <Text style={styles.infoValue}>{commande.livraison.remarques}</Text>
      </View>
    )}
  </ScrollView>
);

// ✅ Onglet Conditions spéciales
const ConditionsTab: React.FC<{ commande: Commande }> = ({ commande }) => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Aucune condition spéciale</Text>
  </View>
);

// ✅ Onglet Photos articles
const PhotosArticlesTab: React.FC<{ commande: Commande }> = ({ commande }) => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Aucune photo article</Text>
  </View>
);

// ✅ Onglet Photos commentaires
const PhotosCommentsTab: React.FC<{ commande: Commande }> = ({ commande }) => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Aucune photo commentaire</Text>
  </View>
);

// ✅ Onglet Chronologie
const ChronologieTab: React.FC<{ commande: Commande }> = ({ commande }) => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Chronologie à venir</Text>
  </View>
);

// ✅ Onglet Actions (LE PLUS IMPORTANT)
const ActionsTab: React.FC<{ commande: Commande }> = ({ commande }) => {
  const handleMarquerEnlevee = () => {
    console.log('Marquer enlevée:', commande.id);
    // TODO: Implémenter changement statut
  };

  const canMarkEnlevee = commande.statutLivraison === 'CONFIRMEE';

  return (
    <View style={styles.tabContent}>
      {/* Section Gestion des statuts */}
      <View style={styles.actionSection}>
        <View style={styles.actionHeader}>
          <Ionicons name="stats-chart" size={20} color="#3B82F6" />
          <Text style={styles.actionTitle}>Gestion des statuts</Text>
        </View>

        <View style={styles.statutRow}>
          <Text style={styles.statutLabel}>Statut commande :</Text>
          <View style={[styles.statutBadge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statutBadgeText, { color: '#065F46' }]}>
              {commande.statutCommande}
            </Text>
          </View>
        </View>

        <View style={styles.statutRow}>
          <Text style={styles.statutLabel}>Statut livraison :</Text>
          <View style={[styles.statutBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.statutBadgeText, { color: '#1E3A8A' }]}>
              {commande.statutLivraison}
            </Text>
          </View>
        </View>

        <Text style={styles.actionSubtitle}>Actions rapides :</Text>

        {canMarkEnlevee && (
          <TouchableOpacity style={styles.actionButton} onPress={handleMarquerEnlevee}>
            <Text style={styles.actionButtonText}>Marquer enlevée</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.infoBoxText}>
            Vous pouvez gérer les statuts de livraison
          </Text>
        </View>
      </View>

      {/* Section Rapports/Commentaires */}
      <View style={styles.actionSection}>
        <View style={styles.actionHeader}>
          <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionTitle}>Rapports/Commentaires</Text>
        </View>

        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Rapport Enlèvement</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.infoBoxText}>
            Les rapports permettent de signaler des problèmes et activent la "Réserve My Truck" sans changer automatiquement le statut de livraison. Les photos et modifications sont disponibles dans l'onglet "Photos commentaires".
          </Text>
        </View>

        <Text style={styles.noReportText}>Aucun rapport créé pour cette commande</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingBottom: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabsScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#FFFFFF',
    minHeight: 200,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  phoneLink: {
    color: '#3B82F6',
  },
  articleCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dimensionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dimensionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  autresArticles: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 8,
  },
  totalArticles: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  chauffeurCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  chauffeurName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  noData: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionSection: {
    marginBottom: 24,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statutLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
  },
  statutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statutBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
  },
  noReportText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});
