/**
 * DeliveryDetails - Détails expandable commande
 * 6 onglets : Actions | Informations | Conditions spéciales | Photos articles | Photos commentaires | Chronologie
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Platform,
  Image,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { Commande, StatutLivraison, PhotoType } from '../../constants/Types';
import { gpsTrackingService, type TrackingStatus } from '../../services/gps-tracking.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import commandesService from '../../services/commandes.service';
import { uploadPhotoToCloudinary, uploadBase64ToCloudinary } from '../../services/cloudinary.service';
import { useAuth } from '../../contexts/AuthContext';
import SignatureCanvas from 'react-native-signature-canvas';

type TabType = 'info' | 'conditions' | 'photos-articles' | 'photos-comments' | 'chronologie' | 'actions';

interface DeliveryDetailsProps {
  commande: Commande;
  onStatusChanged?: () => void;
}

export const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ commande, onStatusChanged }) => {
  const [activeTab, setActiveTab] = useState<TabType>('actions');

  return (
    <View style={styles.container}>
      {/* En-tête avec statuts */}
      {/* <View style={styles.header}>
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
      </View> */}

      {/* Onglets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabsContainer}>
          {(
            [
              { key: 'actions', label: 'Actions', icon: 'flash-outline' },
              { key: 'info', label: 'Informations', icon: 'information-circle-outline' },
              { key: 'conditions', label: 'Conditions spéciales', icon: 'warning-outline' },
              { key: 'photos-articles', label: 'Photos articles', icon: 'camera-outline' },
              { key: 'photos-comments', label: 'Photos commentaires', icon: 'chatbubble-outline' },
              { key: 'chronologie', label: 'Chronologie', icon: 'time-outline' },
            ] as { key: TabType; label: string; icon: string }[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#3B82F6' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Contenu selon onglet actif */}
      <View style={styles.content}>
        {activeTab === 'info'             && <InfoTab commande={commande} />}
        {activeTab === 'conditions'       && <ConditionsTab commande={commande} />}
        {activeTab === 'photos-articles'  && <PhotosArticlesTab commande={commande} />}
        {activeTab === 'photos-comments'  && <PhotosCommentsTab commande={commande} onStatusChanged={onStatusChanged} />}
        {activeTab === 'chronologie'      && <ChronologieTab commande={commande} />}
        {activeTab === 'actions'          && <ActionsTab commande={commande} onStatusChanged={onStatusChanged} />}
      </View>
    </View>
  );
};

// ─── Bloc magasin réutilisable ─────────────────────────────────────────────
const MagasinBlock: React.FC<{ titre: string; magasin?: Commande['magasin']; vendeur?: string }> = ({ titre, magasin, vendeur }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{titre}</Text>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Nom:</Text>
      <Text style={styles.infoValue}>{magasin?.nom || 'N/A'}</Text>
    </View>
    {vendeur ? (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Vendeur:</Text>
        <Text style={styles.infoValue}>{vendeur}</Text>
      </View>
    ) : null}
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Téléphone:</Text>
      <Text style={[styles.infoValue, styles.phoneLink]}>{magasin?.telephone || 'N/A'}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Adresse:</Text>
      <Text style={styles.infoValue}>
        {magasin?.adresse
          ? (magasin.codePostal && magasin.ville
              ? `${magasin.adresse}, ${magasin.codePostal} ${magasin.ville}`
              : magasin.adresse)
          : 'N/A'}
      </Text>
    </View>
  </View>
);

// ─── Onglet Informations ───────────────────────────────────────────────────
const InfoTab: React.FC<{ commande: Commande }> = ({ commande }) => {
  const isCession = commande.type === 'INTER_MAGASIN';

  return (
    <ScrollView style={styles.tabContent}>
      {isCession ? (
        <>
          {/* Cession : Magasin cédant (origine) */}
          <MagasinBlock
            titre="Magasin cédant (origine)"
            magasin={commande.magasin}
            vendeur={commande.prenomVendeur || commande.magasin?.manager}
          />

          {/* Cession : Magasin demandeur (destination) */}
          <MagasinBlock
            titre="Magasin demandeur (destination)"
            magasin={commande.magasinDestination}
            vendeur={commande.magasinDestination?.manager}
          />
        </>
      ) : (
        <>
          {/* Commande normale : Magasin */}
          <MagasinBlock
            titre="Magasin"
            magasin={commande.magasin}
            vendeur={commande.prenomVendeur || commande.magasin?.manager}
          />

          {/* Commande normale : Client */}
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
              <Text style={styles.infoValue}>{commande.client?.adresseLigne1 || 'N/A'}</Text>
            </View>
            {!!commande.client?.etage && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Étage:</Text>
                <Text style={styles.infoValue}>{commande.client.etage}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ascenseur:</Text>
              <Text style={styles.infoValue}>{commande.client?.ascenseur ? 'Oui' : 'Non'}</Text>
            </View>
          </View>
        </>
      )}

      {/* Livraison / Transport (commun) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isCession ? 'Transport' : 'Livraison'}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {commande.dateLivraison
              ? format(new Date(commande.dateLivraison), 'dd/MM/yyyy')
              : 'N/A'}
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
          <Text style={styles.infoValue}>{String(commande.livraison?.equipiers ?? 0)}</Text>
        </View>
      </View>

      {/* Articles (commun) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles</Text>
        {commande.articles && commande.articles.length > 0 && Array.isArray(commande.articles[0].dimensions) ? (
          commande.articles[0].dimensions.map((dim, index) => (
            <View key={index} style={styles.articleCard}>
              <Text style={styles.articleTitle}>
                {index === 0 ? '📦 [Article le plus grand]' : '⚖️ [Article le plus lourd]'}
                {dim.quantite > 1 ? ` (x${dim.quantite})` : ''}
              </Text>
              <View style={styles.dimensionsRow}>
                <Text style={styles.dimensionText}>{'Longueur: ' + String(dim.longueur || 0) + ' cm'}</Text>
                <Text style={styles.dimensionText}>{'Largeur: ' + String(dim.largeur || 0) + ' cm'}</Text>
              </View>
              <View style={styles.dimensionsRow}>
                <Text style={styles.dimensionText}>{'Hauteur: ' + String(dim.hauteur || 0) + ' cm'}</Text>
                <Text style={styles.dimensionText}>{'Poids: ' + String(dim.poids || 0) + ' kg'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>Aucun article avec dimensions</Text>
        )}
        {(commande.articles?.[0]?.autresArticles ?? 0) > 0 && (
          <Text style={styles.autresArticles}>
            {'Dont ' + String(commande.articles![0].autresArticles) + ' autre(s) article(s)'}
          </Text>
        )}
        <Text style={styles.totalArticles}>
          {'Nombre total: ' + String(commande.articles?.[0]?.nombre || 0)}
        </Text>
      </View>

      {/* Chauffeurs (commun) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chauffeur(s)</Text>
        {commande.chauffeurs && commande.chauffeurs.length > 0 ? (
          commande.chauffeurs.map((chauffeur) => (
            <View key={chauffeur.id} style={styles.chauffeurCard}>
              <Text style={styles.chauffeurName}>
                {[chauffeur.prenom, chauffeur.nom].filter(Boolean).join(' ') || 'Chauffeur'}
              </Text>
              {!!chauffeur.telephone && (
                <Text style={[styles.infoValue, styles.phoneLink]}>{'📞 ' + chauffeur.telephone}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noData}>Aucun chauffeur assigné</Text>
        )}
      </View>

      {/* Remarques (commun) */}
      {!!commande.livraison?.remarques && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remarques</Text>
          <Text style={styles.infoValue}>{commande.livraison.remarques}</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Onglet Conditions spéciales ──────────────────────────────────────────
const ConditionsTab: React.FC<{ commande: Commande }> = ({ commande }) => {
  const isCession = commande.type === 'INTER_MAGASIN';

  const conditions: { label: string; value: string }[] = [];
  if (commande.rueInaccessible)      conditions.push({ label: '🚧 Rue inaccessible',      value: 'Oui' });
  if (commande.hasStairs)            conditions.push({ label: '🪜 Escaliers',              value: commande.stairCount ? `${commande.stairCount} volée(s)` : 'Oui' });
  if (commande.deliveryToUpperFloor) conditions.push({ label: '⬆️ Livraison à l\'étage',  value: 'Oui' });
  if (commande.isDuplex)             conditions.push({ label: '🏠 Duplex',                 value: 'Oui' });
  if (commande.needsAssembly)        conditions.push({ label: '🔧 Montage requis',          value: 'Oui' });
  if (commande.paletteComplete)      conditions.push({ label: '📦 Palette complète',        value: 'Oui' });
  if (commande.parkingDistance)      conditions.push({ label: '🅿️ Distance parking',        value: `${commande.parkingDistance} m` });

  const hasCessionInfo = isCession && (!!commande.motifCession || !!commande.prioriteCession);
  const hasPhysicalConditions = conditions.length > 0;

  if (!hasCessionInfo && !hasPhysicalConditions) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noData}>Aucune condition spéciale</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      {/* Informations cession (INTER_MAGASIN uniquement) */}
      {hasCessionInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations cession</Text>
          {!!commande.motifCession && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { flex: 2 }]}>📋 Motif</Text>
              <Text style={styles.infoValue}>{commande.motifCession}</Text>
            </View>
          )}
          {!!commande.prioriteCession && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { flex: 2 }]}>⚡ Priorité</Text>
              <Text style={[styles.infoValue,
                commande.prioriteCession === 'Urgente' ? { fontWeight: '700', color: '#DC2626' } :
                commande.prioriteCession === 'Planifiée' ? { color: '#2563EB' } : {}
              ]}>
                {commande.prioriteCession}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Conditions physiques (communes) */}
      {hasPhysicalConditions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions spéciales</Text>
          {conditions.map((c, idx) => (
            <View key={idx} style={[styles.infoRow, { paddingVertical: 8, borderBottomWidth: idx < conditions.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }]}>
              <Text style={[styles.infoLabel, { flex: 2 }]}>{c.label}</Text>
              <Text style={[styles.infoValue, { fontWeight: '600', color: '#DC2626' }]}>{c.value}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// ─── Visionneuse Photo (Modal fullscreen) ─────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PhotoViewer: React.FC<{ url: string | null; onClose: () => void }> = ({ url, onClose }) => (
  <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <StatusBar hidden />
    <View style={styles.viewerOverlay}>
      <TouchableOpacity style={styles.viewerClose} onPress={onClose} activeOpacity={0.8}>
        <Ionicons name="close-circle" size={36} color="#FFFFFF" />
      </TouchableOpacity>
      {url && (
        <Image
          source={{ uri: url }}
          style={styles.viewerImage}
          resizeMode="contain"
        />
      )}
    </View>
  </Modal>
);

// ─── Onglet Photos articles ───────────────────────────────────────────────
const PhotosArticlesTab: React.FC<{ commande: Commande }> = ({ commande }) => {
  const articlePhotos = (commande.photos || []).filter(p => p.type === 'ARTICLE');
  if (articlePhotos.length === 0) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noData}>Aucune photo article</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.preuvePhotoGrid}>
        {articlePhotos.map((photo, idx) => (
          <Image key={photo.id || idx} source={{ uri: photo.url }} style={styles.preuvePhotoItem} resizeMode="cover" />
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Onglet Photos commentaires ───────────────────────────────────────────
// Calqué sur PhotosCommentaires.tsx (web) : appel getRapports → affiche message + photos par rapport
const PhotosCommentsTab: React.FC<{ commande: Commande; onStatusChanged?: () => void }> = ({ commande, onStatusChanged }) => {
  type RapportsData = {
    enlevement: any[];
    livraison: any[];
    photos: { enlevement: any[]; livraison: any[] };
  };

  const [rapports, setRapports] = useState<RapportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [editingRapportType, setEditingRapportType] = useState<'ENLEVEMENT' | 'LIVRAISON' | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingRapportType, setDeletingRapportType] = useState<'ENLEVEMENT' | 'LIVRAISON' | null>(null);

  const loadRapports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commandesService.getRapports(commande.id);
      if (res.success && res.data) {
        setRapports(res.data as unknown as RapportsData);
      }
    } catch (e) {
      console.error('❌ Erreur chargement rapports:', e);
    } finally {
      setLoading(false);
    }
  }, [commande.id]);

  useEffect(() => {
    loadRapports();
  }, [loadRapports]);

  const handleDeletePhoto = (photo: any) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingPhotoUrl(photo.url);
            try {
              const res = await commandesService.deletePhoto(commande.id, photo.url);
              if (res.success) {
                onStatusChanged?.();
                await loadRapports();
              } else {
                Alert.alert('Erreur', res.error || 'Impossible de supprimer la photo');
              }
            } catch (e: any) {
              Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
            } finally {
              setDeletingPhotoUrl(null);
            }
          },
        },
      ]
    );
  };

  const handleEditRapport = (type: 'ENLEVEMENT' | 'LIVRAISON', rapport: any) => {
    setEditingRapportType(type);
    setEditMessage(rapport.message || '');
  };

  const handleSubmitEdit = async () => {
    if (!editingRapportType) return;
    setLoadingEdit(true);
    try {
      const res = await commandesService.updateRapport(commande.id, editingRapportType, { message: editMessage });
      if (res.success) {
        setEditingRapportType(null);
        await loadRapports();
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de modifier le rapport');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteRapport = (type: 'ENLEVEMENT' | 'LIVRAISON') => {
    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingRapportType(type);
            try {
              const res = await commandesService.deleteRapport(commande.id, type);
              if (res.success) {
                onStatusChanged?.();
                await loadRapports();
              } else {
                Alert.alert('Erreur', res.error || 'Impossible de supprimer le rapport');
              }
            } catch (e: any) {
              Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
            } finally {
              setDeletingRapportType(null);
            }
          },
        },
      ]
    );
  };

  const renderRapportBlock = (rapport: any, type: 'ENLEVEMENT' | 'LIVRAISON') => {
    const photos: any[] = type === 'ENLEVEMENT'
      ? (rapports?.photos?.enlevement || [])
      : (rapports?.photos?.livraison || []);
    const isEnlev = type === 'ENLEVEMENT';
    const borderColor = isEnlev ? '#FDE68A' : '#93C5FD';
    const bgColor    = isEnlev ? '#FFFBEB' : '#EFF6FF';
    const titleColor = isEnlev ? '#D97706' : '#1D4ED8';
    const title      = isEnlev ? "Rapport d'enlèvement" : 'Rapport de livraison';

    return (
      <View style={{ borderWidth: 1, borderColor, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        {/* En-tête */}
        <View style={{ backgroundColor: bgColor, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: borderColor }}>
          <Text style={{ fontWeight: '700', color: titleColor, fontSize: 14 }}>{title}</Text>
        </View>

        <View style={{ padding: 14 }}>
          {/* Date + Chauffeur */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            {!!rapport.createdAt && (
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {format(new Date(rapport.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </Text>
            )}
            {!!rapport.chauffeur && (
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {rapport.chauffeur.prenom} {rapport.chauffeur.nom}
              </Text>
            )}
          </View>

          {/* Message */}
          {!!rapport.message && (
            <Text style={{ fontSize: 14, color: '#111827', marginBottom: photos.length > 0 ? 12 : 0 }}>
              {rapport.message}
            </Text>
          )}

          {/* Photos du rapport */}
          {photos.length > 0 && (
            <View>
              <Text style={styles.photoSectionTitle}>Photos du rapport ({photos.length})</Text>
              <View style={styles.preuvePhotoGrid}>
                {photos.map((photo: any, idx: number) => (
                  <View key={photo.id || idx} style={styles.photoWithDelete}>
                    <TouchableOpacity onPress={() => setViewerUrl(photo.url)} activeOpacity={0.85}>
                      <Image source={{ uri: photo.url }} style={styles.preuvePhotoItem} resizeMode="cover" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deletePhotoButton}
                      onPress={() => handleDeletePhoto(photo)}
                      disabled={deletingPhotoUrl === photo.url}
                    >
                      {deletingPhotoUrl === photo.url
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <Ionicons name="trash-outline" size={12} color="#FFFFFF" />
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Boutons Modifier / Supprimer */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' }}
              onPress={() => handleEditRapport(type, rapport)}
            >
              <Ionicons name="pencil-outline" size={14} color="#1D4ED8" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1D4ED8' }}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, backgroundColor: '#FEF2F2', borderRadius: 6, borderWidth: 1, borderColor: '#FECACA', opacity: deletingRapportType === type ? 0.6 : 1 }}
              onPress={() => handleDeleteRapport(type)}
              disabled={deletingRapportType === type}
            >
              {deletingRapportType === type
                ? <ActivityIndicator size="small" color="#DC2626" />
                : <Ionicons name="trash-outline" size={14} color="#DC2626" />
              }
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.tabContent, { alignItems: 'center', paddingTop: 40 }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.noData, { marginTop: 10 }]}>Chargement des rapports...</Text>
      </View>
    );
  }

  const hasRapports = rapports && (rapports.enlevement.length > 0 || rapports.livraison.length > 0);

  if (!hasRapports) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noData}>Aucun rapport de commentaire.</Text>
        <Text style={[styles.noData, { marginTop: 6, fontSize: 12 }]}>
          Créez un rapport dans l'onglet "Actions" pour qu'il apparaisse ici.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.tabContent}>
        {rapports?.enlevement?.map((rapport: any, idx: number) => (
          <React.Fragment key={rapport.id || `enlev-${idx}`}>
            {renderRapportBlock(rapport, 'ENLEVEMENT')}
          </React.Fragment>
        ))}
        {rapports?.livraison?.map((rapport: any, idx: number) => (
          <React.Fragment key={rapport.id || `liv-${idx}`}>
            {renderRapportBlock(rapport, 'LIVRAISON')}
          </React.Fragment>
        ))}
        <PhotoViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      </ScrollView>

      {/* Modal modification rapport */}
      <Modal visible={editingRapportType !== null} transparent animationType="slide" onRequestClose={() => setEditingRapportType(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
              Modifier le rapport
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              {editingRapportType === 'ENLEVEMENT' ? "Rapport d'enlèvement" : 'Rapport de livraison'}
            </Text>
            <TextInput
              style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top' }}
              value={editMessage}
              onChangeText={setEditMessage}
              placeholder="Commentaire du rapport..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}
                onPress={() => setEditingRapportType(null)}
                disabled={loadingEdit}
              >
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 2, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center', opacity: loadingEdit ? 0.6 : 1 }}
                onPress={handleSubmitEdit}
                disabled={loadingEdit}
              >
                {loadingEdit
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Onglet Chronologie ───────────────────────────────────────────────────
const ChronologieTab: React.FC<{ commande: Commande }> = () => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Chronologie à venir</Text>
  </View>
);

// ─── Onglet Actions — Timeline + GPS + Rapports + Preuves ────────────────

const TIMELINE_STEPS = [
  { status: 'EN ATTENTE',           label: 'Commande en attente',        actionLabel: 'À confirmer' },
  { status: 'CONFIRMEE',            label: 'Prise en charge confirmée',  actionLabel: 'Confirmée' },
  { status: 'ENLEVEE',              label: 'Enlèvement effectué',        actionLabel: 'Enlevée' },
  { status: 'EN COURS DE LIVRAISON', label: 'En cours de livraison',     actionLabel: 'En cours' },
  { status: 'LIVREE',               label: 'Livraison effectuée',        actionLabel: 'Livrée' },
] as const;

const STATUS_ORDER = ['EN ATTENTE', 'CONFIRMEE', 'ENLEVEE', 'EN COURS DE LIVRAISON', 'LIVREE'];

const getNextAction = (
  statut: string
): { label: string; nextStatus: StatutLivraison; color: string } | null => {
  switch (statut) {
    case 'EN ATTENTE':
      return { label: 'Confirmer la prise en charge', nextStatus: 'CONFIRMEE',             color: '#3B82F6' };
    case 'CONFIRMEE':
      return { label: 'Marquer enlevée',              nextStatus: 'ENLEVEE',               color: '#8B5CF6' };
    case 'ENLEVEE':
      return { label: 'Démarrer la livraison',        nextStatus: 'EN COURS DE LIVRAISON', color: '#F59E0B' };
    case 'EN COURS DE LIVRAISON':
      return { label: 'Confirmer la livraison',       nextStatus: 'LIVREE',                color: '#10B981' };
    default:
      return null;
  }
};

const ActionsTab: React.FC<{ commande: Commande; onStatusChanged?: () => void }> = ({
  commande,
  onStatusChanged,
}) => {
  const { user, token } = useAuth();

  // ── Statut local (mise à jour optimiste immédiate) ──
  const [localStatut, setLocalStatut] = useState<string>(commande.statutLivraison);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // ── GPS Tracking ──
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>(() => gpsTrackingService.getStatus());

  // ── Timestamps par statut (chronologie) ──
  const [statusTimestamps, setStatusTimestamps] = useState<Record<string, Date>>(() => {
    const initial: Record<string, Date> = {};
    const misAJour = commande.dates?.misAJour;
    const isObj = typeof misAJour === 'object' && misAJour !== null;

    // EN ATTENTE → date de création commande
    const creationDate = commande.dates?.commande || commande.dateCommande;
    if (creationDate) {
      initial['EN ATTENTE'] = new Date(creationDate);
    }

    // CONFIRMEE → dates.misAJour.commande
    // Correspond à la confirmation de la commande par la direction (même événement business)
    const commandeUpdateDate = isObj ? (misAJour as any).commande : undefined;
    if (commandeUpdateDate) {
      initial['CONFIRMEE'] = new Date(commandeUpdateDate);
    }

    // Dernier statut "done" (juste avant le statut courant) → dates.misAJour.livraison
    // dates.misAJour.livraison = quand le statut courant a démarré = quand le précédent s'est terminé
    const livraisonUpdateDate = isObj ? (misAJour as any).livraison : (misAJour as string | undefined);
    if (livraisonUpdateDate && commande.statutLivraison) {
      const currentIdx = STATUS_ORDER.indexOf(commande.statutLivraison);
      if (currentIdx > 0) {
        const lastDoneStatus = STATUS_ORDER[currentIdx - 1];
        // Ne pas écraser un timestamp déjà initialisé (EN ATTENTE ou CONFIRMEE)
        if (!initial[lastDoneStatus]) {
          initial[lastDoneStatus] = new Date(livraisonUpdateDate);
        }
      }
    }

    return initial;
  });

  // ── Modal photos obligatoires avant ENLEVEE ──
  const [showEnleveeModal, setShowEnleveeModal] = useState(false);
  const [enleveeModalPhotos, setEnleveeModalPhotos] = useState<Array<{ url: string }>>([]);
  const [loadingEnleveeModalPhoto, setLoadingEnleveeModalPhoto] = useState(false);
  const [confirmingEnlevee, setConfirmingEnlevee] = useState(false);

  // ── Modal preuves + signature obligatoires avant LIVREE ──
  const [showLivreeModal, setShowLivreeModal] = useState(false);
  const [livreeModalPhotos, setLivreeModalPhotos] = useState<Array<{ url: string }>>([]);
  const [loadingLivreeModalPhoto, setLoadingLivreeModalPhoto] = useState(false);
  const [confirmingLivree, setConfirmingLivree] = useState(false);
  const livreeSignatureRef = React.useRef<any>(null);

  // ── Rapport (un seul formulaire actif à la fois) ──
  const [activeRapportType, setActiveRapportType] = useState<'ENLEVEMENT' | 'LIVRAISON' | null>(null);
  const [rapportMessage, setRapportMessage] = useState('');
  const [loadingRapport, setLoadingRapport] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [deletingProofPhotoUrl, setDeletingProofPhotoUrl] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // ── Photos rapport (URLs Cloudinary par type) ──
  const [rapportPhotos, setRapportPhotos] = useState<Record<'ENLEVEMENT' | 'LIVRAISON', Array<{ url: string; filename: string }>>>({
    ENLEVEMENT: [],
    LIVRAISON: [],
  });
  const [loadingRapportPhoto, setLoadingRapportPhoto] = useState(false);

  // Synchroniser avec le prop quand le parent recharge les données
  React.useEffect(() => {
    setLocalStatut(commande.statutLivraison);
  }, [commande.statutLivraison]);

  // ── Démarrer le tracking GPS ──
  const startTracking = useCallback(async () => {
    if (!token || gpsTrackingService.isTracking()) return;

    // Chauffeur ID depuis la commande (après aplatissement du transformer) ou depuis l'utilisateur
    const chauffeurId = commande.chauffeurs?.[0]?.id || user?.chauffeurId || user?.id;
    if (!chauffeurId) return;

    const chauffeurName = [user?.prenom, user?.nom].filter(Boolean).join(' ') ||
      [commande.chauffeurs?.[0]?.prenom, commande.chauffeurs?.[0]?.nom].filter(Boolean).join(' ') ||
      'Chauffeur';

    const result = await gpsTrackingService.start(
      { chauffeurId, chauffeurName, commandeId: commande.id, token },
      setTrackingStatus,
    );

    if (!result.success) {
      Alert.alert('GPS non disponible', result.error || 'Impossible de démarrer le suivi GPS');
    }
  }, [commande.id, commande.chauffeurs, user, token]);

  // Auto-démarrer le tracking si la commande est déjà EN COURS DE LIVRAISON au montage
  React.useEffect(() => {
    setTrackingStatus(gpsTrackingService.getStatus());
    if (commande.statutLivraison === 'EN COURS DE LIVRAISON') {
      startTracking();
    }
    // Pas de cleanup : le singleton persiste même si le composant est démonté
    // (chauffeur change d'onglet → tracking continue)
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statut = localStatut;
  const nextAction = getNextAction(statut);
  const isCompleted = statut === 'LIVREE';
  const isCancelled = statut === 'ANNULEE' || statut === 'ECHEC';

  // ── Visibilité contextuelle ──
  const showMagasinContact = ['EN ATTENTE', 'CONFIRMEE'].includes(statut);
  const showClientContact  = ['ENLEVEE', 'EN COURS DE LIVRAISON', 'LIVREE'].includes(statut);
  const canRapportEnlev    = ['CONFIRMEE', 'ENLEVEE'].includes(statut);
  const canRapportLiv      = ['EN COURS DE LIVRAISON', 'ECHEC'].includes(statut);

  // ── Adresses complètes pour navigation ──
  const magasinAddress = commande.magasin
    ? [commande.magasin.adresse, commande.magasin.codePostal, commande.magasin.ville]
        .filter(Boolean).join(' ')
    : '';
  const clientAddress = commande.client
    ? [commande.client.adresseLigne1, commande.client.adresseLigne2, commande.client.codePostal, commande.client.ville]
        .filter(Boolean).join(' ')
    : '';

  const getStepState = (stepStatus: string): 'done' | 'current' | 'future' => {
    const si = STATUS_ORDER.indexOf(stepStatus);
    const ci = STATUS_ORDER.indexOf(statut);
    if (ci === -1) return 'future';
    if (si < ci)   return 'done';
    if (si === ci) return 'current';
    return 'future';
  };

  // ── GPS Navigation ──
  const openMaps = useCallback((address: string) => {
    if (!address) {
      Alert.alert('Adresse manquante', 'Aucune adresse disponible pour la navigation');
      return;
    }
    const encoded = encodeURIComponent(address);
    const nativeUrl = Platform.OS === 'ios'
      ? `maps:?q=${encoded}`
      : `geo:0,0?q=${encoded}`;
    Linking.openURL(nativeUrl).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${encoded}`)
        .catch(() => Alert.alert('Erreur', "Impossible d'ouvrir la navigation"))
    );
  }, []);

  // ── Appel téléphonique ──
  const callPhone = useCallback((phone: string) => {
    const cleaned = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() =>
      Alert.alert('Erreur', "Impossible de passer l'appel")
    );
  }, []);

  // ── Action statut principal ──
  const handleAction = useCallback(async () => {
    if (!nextAction || loadingAction) return;
    const targetStatus = nextAction.nextStatus;

    // ENLEVEE : ouvrir modal photos obligatoires avant changement de statut
    if (targetStatus === 'ENLEVEE') {
      setEnleveeModalPhotos([]);
      setShowEnleveeModal(true);
      return;
    }

    // LIVREE : ouvrir modal preuves + signature obligatoires
    if (targetStatus === 'LIVREE') {
      setLivreeModalPhotos([]);
      setShowLivreeModal(true);
      return;
    }

    // Autres transitions : confirmation simple
    const commandeId = commande.id;
    const label = nextAction.label;

    Alert.alert('Confirmation', label + ' ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setLoadingAction(true);
          try {
            const res = await commandesService.updateStatutLivraison(commandeId, targetStatus);
            if (res.success) {
              setLocalStatut(targetStatus);
              setStatusTimestamps(prev => ({ ...prev, [targetStatus]: new Date() }));
              setLoadingAction(false);
              onStatusChanged?.();
              if (targetStatus === 'EN COURS DE LIVRAISON') {
                startTracking();
              }
            } else {
              setLoadingAction(false);
              Alert.alert('Erreur mise à jour', res.error || 'Impossible de mettre à jour le statut.\nVérifiez votre connexion.');
            }
          } catch (e: any) {
            setLoadingAction(false);
            Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
          }
        },
      },
    ]);
  }, [nextAction, loadingAction, commande.id, onStatusChanged, startTracking]);

  // ── Échec de livraison ──
  const handleEchecLivraison = useCallback(async () => {
    const commandeId = commande.id;
    Alert.alert("Échec de livraison", "Confirmer l'échec de cette livraison ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer échec',
        style: 'destructive',
        onPress: async () => {
          setLoadingAction(true);
          try {
            const res = await commandesService.updateStatutLivraison(commandeId, 'ECHEC');
            if (res.success) {
              setLocalStatut('ECHEC');
              setStatusTimestamps(prev => ({ ...prev, ['ECHEC']: new Date() }));
              setLoadingAction(false);
              onStatusChanged?.();
              gpsTrackingService.stop().then(() => setTrackingStatus('idle'));
            } else {
              setLoadingAction(false);
              Alert.alert('Erreur', res.error || 'Impossible de mettre à jour le statut');
            }
          } catch (e: any) {
            setLoadingAction(false);
            Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
          }
        },
      },
    ]);
  }, [commande.id, onStatusChanged]);

  // ── Modal ENLEVEE : photo (upload immédiat, suivi local) ──
  const handleEnleveeModalPhoto = useCallback(async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission requise', "Veuillez autoriser l'accès à la caméra"); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie photo"); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    }
    if (result.canceled || !result.assets?.[0]) return;
    setLoadingEnleveeModalPhoto(true);
    try {
      const res = await commandesService.uploadPhoto(commande.id, result.assets[0].uri, 'ENLEVEMENT');
      if (res.success) {
        setEnleveeModalPhotos(prev => [...prev, { url: result.assets[0].uri }]);
      } else {
        Alert.alert('Erreur upload', res.error || "Impossible d'uploader la photo");
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingEnleveeModalPhoto(false);
    }
  }, [commande.id]);

  // ── Modal ENLEVEE : confirmer (≥1 photo requise) ──
  const handleConfirmEnlevee = useCallback(async () => {
    if (enleveeModalPhotos.length === 0 || confirmingEnlevee) return;
    setConfirmingEnlevee(true);
    try {
      const res = await commandesService.updateStatutLivraison(commande.id, 'ENLEVEE');
      if (res.success) {
        setLocalStatut('ENLEVEE');
        setStatusTimestamps(prev => ({ ...prev, 'ENLEVEE': new Date() }));
        setShowEnleveeModal(false);
        setEnleveeModalPhotos([]);
        onStatusChanged?.();
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de mettre à jour le statut');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setConfirmingEnlevee(false);
    }
  }, [enleveeModalPhotos, confirmingEnlevee, commande.id, onStatusChanged]);

  // ── Modal LIVREE : photo preuve (upload immédiat, type PREUVE_LIVRAISON) ──
  const handleLivreeModalPhoto = useCallback(async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission requise', "Veuillez autoriser l'accès à la caméra"); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie photo"); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    }
    if (result.canceled || !result.assets?.[0]) return;
    setLoadingLivreeModalPhoto(true);
    try {
      const res = await commandesService.uploadPhoto(commande.id, result.assets[0].uri, 'PREUVE_LIVRAISON');
      if (res.success) {
        setLivreeModalPhotos(prev => [...prev, { url: result.assets[0].uri }]);
      } else {
        Alert.alert('Erreur upload', res.error || "Impossible d'uploader la photo");
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingLivreeModalPhoto(false);
    }
  }, [commande.id]);

  // ── Modal LIVREE : déclencher lecture signature → onOK finalise tout ──
  const handleConfirmLivree = useCallback(() => {
    if (livreeModalPhotos.length === 0) {
      Alert.alert('Photo requise', 'Prenez au moins une photo de preuve avant de confirmer la livraison.');
      return;
    }
    if (confirmingLivree) return;
    setConfirmingLivree(true);
    livreeSignatureRef.current?.readSignature();
  }, [livreeModalPhotos, confirmingLivree]);

  // ── Modal LIVREE : signature reçue → upload + saveSignature + updateStatut ──
  const handleLivreeSignatureOK = useCallback(async (sig: string) => {
    try {
      const { url } = await uploadBase64ToCloudinary(sig, 'signature_client');
      await commandesService.saveSignatureLivraison(commande.id, url);
      const res = await commandesService.updateStatutLivraison(commande.id, 'LIVREE');
      if (res.success) {
        setLocalStatut('LIVREE');
        setStatusTimestamps(prev => ({ ...prev, 'LIVREE': new Date() }));
        gpsTrackingService.stop().then(() => setTrackingStatus('idle'));
        setShowLivreeModal(false);
        setLivreeModalPhotos([]);
        onStatusChanged?.();
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de confirmer la livraison');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de finaliser la livraison');
    } finally {
      setConfirmingLivree(false);
    }
  }, [commande.id, onStatusChanged]);

  // ── Modal LIVREE : canvas vide ──
  const handleLivreeSignatureEmpty = useCallback(() => {
    setConfirmingLivree(false);
    Alert.alert('Signature manquante', 'Faites signer le client ou le magasin avant de confirmer.');
  }, []);

  // ── Toggle formulaire rapport ──
  const toggleRapport = useCallback((type: 'ENLEVEMENT' | 'LIVRAISON') => {
    setActiveRapportType((prev) => {
      if (prev === type) {
        setRapportMessage('');
        return null;
      }
      setRapportMessage('');
      return type;
    });
  }, []);

  // ── Photo rapport : prendre ou choisir, uploader vers Cloudinary ──
  const handleRapportPhoto = useCallback(async (
    type: 'ENLEVEMENT' | 'LIVRAISON',
    source: 'camera' | 'gallery'
  ) => {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission requise', "Veuillez autoriser l'accès à la caméra");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie photo");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    }

    if (result.canceled || !result.assets?.[0]) return;

    setLoadingRapportPhoto(true);
    try {
      const { url, filename } = await uploadPhotoToCloudinary(result.assets[0].uri);
      setRapportPhotos(prev => ({
        ...prev,
        [type]: [...prev[type], { url, filename }],
      }));
    } catch (e: any) {
      Alert.alert('Erreur upload', e?.message || "Impossible d'uploader la photo");
    } finally {
      setLoadingRapportPhoto(false);
    }
  }, []);

  // ── Création rapport ──
  const handleCreateRapport = useCallback(async () => {
    if (!activeRapportType) return;
    const photos = rapportPhotos[activeRapportType];
    const message = rapportMessage.trim();
    if (photos.length === 0 && !message) {
      Alert.alert('Rapport incomplet', 'Ajoutez au moins une photo ou un commentaire pour créer le rapport');
      return;
    }
    setLoadingRapport(true);
    try {
      // Pour un chauffeur, user.id EST l'ID de l'entité Chauffeur (même table)
      const chauffeurId = user?.id || commande.chauffeurs?.[0]?.id;
      // La réserve s'active si photo OU commentaire présent
      const hasReserve = photos.length > 0 || message.length > 0;
      const res = await commandesService.createRapport(commande.id, {
        type: activeRapportType,
        message: message || '',
        chauffeurId,
        photos: photos.length > 0 ? photos : undefined,
      });
      if (res.success) {
        setActiveRapportType(null);
        setRapportMessage('');
        setRapportPhotos({ ENLEVEMENT: [], LIVRAISON: [] });
        Alert.alert(
          'Rapport créé',
          hasReserve
            ? 'Le rapport a été créé et la réserve My Truck activée.'
            : 'Le rapport a été créé sans activation de réserve.'
        );
        onStatusChanged?.();
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de créer le rapport');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingRapport(false);
    }
  }, [activeRapportType, rapportMessage, rapportPhotos, commande.id, commande.chauffeurs, onStatusChanged]);

  // ── Photo : caméra ──
  const handleTakePhoto = useCallback(async (type: PhotoType) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à la caméra");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setLoadingPhoto(true);
    try {
      const res = await commandesService.uploadPhoto(commande.id, result.assets[0].uri, type);
      if (res.success) {
        Alert.alert('Photo ajoutée', 'La photo a été enregistrée avec succès');
        onStatusChanged?.();
      } else {
        Alert.alert('Erreur', res.error || "Impossible d'ajouter la photo");
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingPhoto(false);
    }
  }, [commande.id, onStatusChanged]);

  // ── Photo : galerie ──
  const handlePickPhoto = useCallback(async (type: PhotoType) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie photo");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setLoadingPhoto(true);
    try {
      const res = await commandesService.uploadPhoto(commande.id, result.assets[0].uri, type);
      if (res.success) {
        Alert.alert('Photo ajoutée', 'La photo a été enregistrée avec succès');
        onStatusChanged?.();
      } else {
        Alert.alert('Erreur', res.error || "Impossible d'ajouter la photo");
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingPhoto(false);
    }
  }, [commande.id, onStatusChanged]);

  // ── Supprimer une preuve de livraison ──
  const handleDeleteProofPhoto = useCallback((photoUrl: string) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette preuve ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingProofPhotoUrl(photoUrl);
            try {
              const res = await commandesService.deletePhoto(commande.id, photoUrl);
              if (res.success) {
                onStatusChanged?.();
              } else {
                Alert.alert('Erreur', res.error || 'Impossible de supprimer la photo');
              }
            } catch (e: any) {
              Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
            } finally {
              setDeletingProofPhotoUrl(null);
            }
          },
        },
      ]
    );
  }, [commande.id, onStatusChanged]);

  return (
    <>
    <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">

      {/* ── Section Contact & Navigation (contextuelle selon statut) ── */}
      {(showMagasinContact || showClientContact) && (
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>Contact & Navigation</Text>

          {showMagasinContact && commande.magasin && (
            <View style={styles.contactBlock}>
              <Text style={styles.contactBlockLabel}>
                {'Magasin — ' + commande.magasin.nom}
              </Text>
              <View style={styles.contactButtonRow}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => openMaps(magasinAddress)}
                  disabled={!magasinAddress}
                >
                  <Ionicons name="navigate" size={15} color="#1D4ED8" />
                  <Text style={styles.navButtonText}>Naviguer</Text>
                </TouchableOpacity>
                {!!commande.magasin.telephone && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => callPhone(commande.magasin!.telephone)}
                  >
                    <Ionicons name="call" size={15} color="#065F46" />
                    <Text style={styles.callButtonText}>Appeler</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {showClientContact && commande.client && (
            <View style={[styles.contactBlock, styles.contactBlockNoMargin]}>
              <Text style={styles.contactBlockLabel}>
                {'Client — ' + commande.client.prenom + ' ' + commande.client.nom}
              </Text>
              <View style={styles.contactButtonRow}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => openMaps(clientAddress)}
                  disabled={!clientAddress}
                >
                  <Ionicons name="navigate" size={15} color="#1D4ED8" />
                  <Text style={styles.navButtonText}>Naviguer</Text>
                </TouchableOpacity>
                {!!commande.client.telephone && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => callPhone(commande.client!.telephone)}
                  >
                    <Ionicons name="call" size={15} color="#065F46" />
                    <Text style={styles.callButtonText}>Appeler</Text>
                  </TouchableOpacity>
                )}
                {!!commande.client.telephoneSecondaire && (
                  <TouchableOpacity
                    style={styles.callButtonAlt}
                    onPress={() => callPhone(commande.client!.telephoneSecondaire!)}
                  >
                    <Ionicons name="call-outline" size={15} color="#6B7280" />
                    <Text style={styles.callButtonAltText}>2ème tél.</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Indicateur GPS (visible uniquement EN COURS DE LIVRAISON) ── */}
      {localStatut === 'EN COURS DE LIVRAISON' && (
        <View style={styles.gpsIndicator}>
          <View style={[styles.gpsDot, trackingStatus === 'active' && styles.gpsDotActive]} />
          <Text style={styles.gpsIndicatorText}>
            {trackingStatus === 'active'
              ? '📍 Suivi GPS actif — position partagée'
              : trackingStatus === 'starting'
                ? '⏳ Démarrage du suivi GPS...'
                : '⚠️ Suivi GPS inactif'}
          </Text>
          {trackingStatus === 'idle' && (
            <TouchableOpacity onPress={startTracking} style={styles.gpsRetryButton}>
              <Text style={styles.gpsRetryText}>Activer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Timeline ── */}
      <View style={styles.timelineContainer}>
        <View style={styles.timelineHeader}>
          <Ionicons name="navigate-outline" size={15} color="#3B82F6" />
          <Text style={styles.timelineTitle}>SUIVI DE LIVRAISON</Text>
        </View>

        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={20} color="#DC2626" />
            <Text style={styles.cancelledText}>
              {statut === 'ANNULEE' ? 'Livraison annulée' : 'Échec de livraison'}
            </Text>
          </View>
        ) : (
          TIMELINE_STEPS.map((step, index) => {
            const state  = getStepState(step.status);
            const isLast = index === TIMELINE_STEPS.length - 1;
            const isExp  = expandedStep === step.status;

            return (
              <View key={step.status}>
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={[
                      styles.stepCircle,
                      state === 'done'    && styles.stepCircleDone,
                      state === 'current' && styles.stepCircleCurrent,
                      state === 'future'  && styles.stepCircleFuture,
                    ]}>
                      {state === 'done'    && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                      {state === 'current' && <View style={styles.stepInnerDot} />}
                    </View>
                    {!isLast && (
                      <View style={[styles.stepLine, state === 'done' && styles.stepLineDone]} />
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.stepContent}
                    onPress={() => state === 'done' && setExpandedStep(isExp ? null : step.status)}
                    activeOpacity={state === 'done' ? 0.6 : 1}
                  >
                    <Text style={[
                      styles.stepLabel,
                      state === 'done'    && styles.stepLabelDone,
                      state === 'current' && styles.stepLabelCurrent,
                      state === 'future'  && styles.stepLabelFuture,
                    ]}>
                      {step.label}
                    </Text>
                    {state === 'current' && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>En cours</Text>
                      </View>
                    )}
                    {state === 'done' && (
                      <Ionicons name={isExp ? 'chevron-up' : 'chevron-down'} size={13} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>

                {state === 'done' && isExp && (
                  <View style={styles.stepDetail}>
                    {statusTimestamps[step.status] ? (
                      <View style={styles.stepDetailRow}>
                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                        <Text style={styles.stepDetailText}>
                          {format(statusTimestamps[step.status], "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.stepDetailLabel}>{step.actionLabel}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* ── Boutons d'action statut ── */}
      {!isCompleted && !isCancelled && (
        <View style={styles.actionsContainer}>
          {nextAction ? (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: nextAction.color },
                  loadingAction && styles.actionButtonDisabled,
                ]}
                onPress={handleAction}
                disabled={loadingAction}
                activeOpacity={0.8}
              >
                {loadingAction ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>{nextAction.label}</Text>
                )}
              </TouchableOpacity>

              {statut === 'EN COURS DE LIVRAISON' && (
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.echecButton]}
                  onPress={handleEchecLivraison}
                  disabled={loadingAction}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                  <Text style={styles.secondaryButtonText}>Échec de livraison</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.waitingBanner}>
              <Ionicons name="time-outline" size={16} color="#9CA3AF" />
              <Text style={styles.waitingText}>En attente de confirmation</Text>
            </View>
          )}
        </View>
      )}

      {isCompleted && (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={styles.completedText}>Livraison terminée avec succès</Text>
        </View>
      )}

      {/* ── Section Photos d'enlèvement (ajout supplémentaire, visible dès ENLEVEE) ── */}
      {localStatut === 'ENLEVEE' && (
        <View style={styles.enleveePhotoSection}>
          <Text style={styles.enleveePhotoTitle}>📷 Photos d'enlèvement</Text>
          <Text style={styles.enleveePhotoNote}>
            Ajoutez d'autres photos si nécessaire.
          </Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleTakePhoto('ENLEVEMENT')}
              disabled={loadingPhoto}
            >
              <Ionicons name="camera" size={16} color="#6B7280" />
              <Text style={styles.photoButtonText}>Caméra</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handlePickPhoto('ENLEVEMENT')}
              disabled={loadingPhoto}
            >
              <Ionicons name="images" size={16} color="#6B7280" />
              <Text style={styles.photoButtonText}>Galerie</Text>
            </TouchableOpacity>
          </View>
          {loadingPhoto && (
            <ActivityIndicator size="small" color="#D97706" style={{ marginTop: 6 }} />
          )}
          {(commande.photos || []).filter(p => p.type === 'ENLEVEMENT').length > 0 && (
            <View style={styles.preuvePhotoGrid}>
              {(commande.photos || []).filter(p => p.type === 'ENLEVEMENT').map((photo, idx) => (
                <TouchableOpacity key={photo.id || idx} onPress={() => setViewerUrl(photo.url)} activeOpacity={0.85}>
                  <Image source={{ uri: photo.url }} style={styles.preuvePhotoItem} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Section Rapports & Réserves (facultatif) ── */}
      {(canRapportEnlev || canRapportLiv) && (
        <View style={styles.rapportSection}>
          <Text style={styles.rapportSectionTitle}>Rapports & Réserves (facultatif)</Text>
          <Text style={styles.rapportSectionNote}>
            Créer un rapport signale un problème et active la réserve My Truck (photo et/ou commentaire).
          </Text>

          {/* Rapport d'enlèvement */}
          {canRapportEnlev && (
            <>
              <TouchableOpacity
                style={[
                  styles.rapportToggleButton,
                  activeRapportType === 'ENLEVEMENT' && styles.rapportToggleActiveEnlev,
                ]}
                onPress={() => toggleRapport('ENLEVEMENT')}
              >
                <Ionicons name="clipboard-outline" size={16} color="#D97706" />
                <Text style={styles.rapportEnlevText}>Rapport d'enlèvement</Text>
                <Ionicons
                  name={activeRapportType === 'ENLEVEMENT' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#D97706"
                />
              </TouchableOpacity>

              {activeRapportType === 'ENLEVEMENT' && (
                <View style={styles.rapportForm}>
                  <Text style={styles.rapportFormLabel}>Commentaire (optionnel)</Text>
                  <TextInput
                    style={styles.rapportTextInput}
                    value={rapportMessage}
                    onChangeText={setRapportMessage}
                    placeholder="Ex: Produit abîmé, article manquant, accès difficile..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.rapportFormLabel, { marginTop: 10 }]}>
                    {'Photo (optionnelle)' + (rapportPhotos.ENLEVEMENT.length > 0 ? ` — ${rapportPhotos.ENLEVEMENT.length} ajoutée(s)` : '')}
                  </Text>
                  <View style={styles.photoButtonRow}>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => handleRapportPhoto('ENLEVEMENT', 'camera')}
                      disabled={loadingRapportPhoto}
                    >
                      <Ionicons name="camera" size={16} color="#6B7280" />
                      <Text style={styles.photoButtonText}>Caméra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => handleRapportPhoto('ENLEVEMENT', 'gallery')}
                      disabled={loadingRapportPhoto}
                    >
                      <Ionicons name="images" size={16} color="#6B7280" />
                      <Text style={styles.photoButtonText}>Galerie</Text>
                    </TouchableOpacity>
                  </View>
                  {loadingRapportPhoto && (
                    <ActivityIndicator size="small" color="#D97706" style={{ marginTop: 6 }} />
                  )}
                  <View style={styles.rapportFormActions}>
                    <TouchableOpacity
                      style={styles.rapportCancelButton}
                      onPress={() => { setActiveRapportType(null); setRapportMessage(''); }}
                      disabled={loadingRapport}
                    >
                      <Text style={styles.rapportCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.rapportSubmitButton,
                        { backgroundColor: '#D97706' },
                        ((rapportPhotos.ENLEVEMENT.length === 0 && !rapportMessage.trim()) || loadingRapport) && styles.actionButtonDisabled,
                      ]}
                      onPress={handleCreateRapport}
                      disabled={(rapportPhotos.ENLEVEMENT.length === 0 && !rapportMessage.trim()) || loadingRapport}
                    >
                      {loadingRapport ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.rapportSubmitText}>Créer le rapport</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Rapport de livraison */}
          {canRapportLiv && (
            <>
              <TouchableOpacity
                style={[
                  styles.rapportToggleButton,
                  styles.rapportLivButton,
                  activeRapportType === 'LIVRAISON' && styles.rapportToggleActiveLiv,
                ]}
                onPress={() => toggleRapport('LIVRAISON')}
              >
                <Ionicons name="document-text-outline" size={16} color="#DC2626" />
                <Text style={styles.rapportLivText}>Rapport de livraison</Text>
                <Ionicons
                  name={activeRapportType === 'LIVRAISON' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#DC2626"
                />
              </TouchableOpacity>

              {activeRapportType === 'LIVRAISON' && (
                <View style={[styles.rapportForm, styles.rapportFormLiv]}>
                  <Text style={styles.rapportFormLabel}>Commentaire (optionnel)</Text>
                  <TextInput
                    style={styles.rapportTextInput}
                    value={rapportMessage}
                    onChangeText={setRapportMessage}
                    placeholder="Ex: Client absent, adresse introuvable, produit refusé..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.rapportFormLabel, { marginTop: 10 }]}>
                    {'Photo (optionnelle)' + (rapportPhotos.LIVRAISON.length > 0 ? ` — ${rapportPhotos.LIVRAISON.length} ajoutée(s)` : '')}
                  </Text>
                  <View style={styles.photoButtonRow}>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => handleRapportPhoto('LIVRAISON', 'camera')}
                      disabled={loadingRapportPhoto}
                    >
                      <Ionicons name="camera" size={16} color="#6B7280" />
                      <Text style={styles.photoButtonText}>Caméra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => handleRapportPhoto('LIVRAISON', 'gallery')}
                      disabled={loadingRapportPhoto}
                    >
                      <Ionicons name="images" size={16} color="#6B7280" />
                      <Text style={styles.photoButtonText}>Galerie</Text>
                    </TouchableOpacity>
                  </View>
                  {loadingRapportPhoto && (
                    <ActivityIndicator size="small" color="#DC2626" style={{ marginTop: 6 }} />
                  )}
                  <View style={styles.rapportFormActions}>
                    <TouchableOpacity
                      style={styles.rapportCancelButton}
                      onPress={() => { setActiveRapportType(null); setRapportMessage(''); }}
                      disabled={loadingRapport}
                    >
                      <Text style={styles.rapportCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.rapportSubmitButton,
                        { backgroundColor: '#DC2626' },
                        ((rapportPhotos.LIVRAISON.length === 0 && !rapportMessage.trim()) || loadingRapport) && styles.actionButtonDisabled,
                      ]}
                      onPress={handleCreateRapport}
                      disabled={(rapportPhotos.LIVRAISON.length === 0 && !rapportMessage.trim()) || loadingRapport}
                    >
                      {loadingRapport ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.rapportSubmitText}>Créer le rapport</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* ── Preuves de livraison (statut LIVREE uniquement) ── */}
      {isCompleted && (
        <View style={styles.preuveSection}>
          <Text style={styles.preuveSectionTitle}>Preuves de livraison</Text>
          <Text style={styles.preuveSectionNote}>
            Ajoutez des photos de confirmation (colis déposé, etc.)
          </Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              style={[styles.photoButton, styles.photoButtonGreen]}
              onPress={() => handleTakePhoto('LIVRAISON')}
              disabled={loadingPhoto}
            >
              <Ionicons name="camera" size={18} color="#059669" />
              <Text style={[styles.photoButtonText, { color: '#059669' }]}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, styles.photoButtonGreen]}
              onPress={() => handlePickPhoto('LIVRAISON')}
              disabled={loadingPhoto}
            >
              <Ionicons name="images" size={18} color="#059669" />
              <Text style={[styles.photoButtonText, { color: '#059669' }]}>Depuis la galerie</Text>
            </TouchableOpacity>
          </View>
          {loadingPhoto && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.preuveSectionNote}>Envoi en cours...</Text>
            </View>
          )}
          {/* Photos de preuve + signature côte à côte */}
          {(commande.photos && commande.photos.filter(p => p.type === 'PREUVE_LIVRAISON').length > 0) || commande.signatureClient ? (
            <View style={styles.preuveRowContainer}>
              {/* Grille photos */}
              {commande.photos && commande.photos.filter(p => p.type === 'PREUVE_LIVRAISON').length > 0 && (
                <View style={styles.preuvePhotosCol}>
                  <View style={styles.preuvePhotoGrid}>
                    {commande.photos
                      .filter(p => p.type === 'PREUVE_LIVRAISON')
                      .map((photo, idx) => (
                        <View key={photo.id || idx} style={styles.photoWithDelete}>
                          <TouchableOpacity onPress={() => setViewerUrl(photo.url)} activeOpacity={0.85}>
                            <Image
                              source={{ uri: photo.url }}
                              style={styles.preuvePhotoItem}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deletePhotoButton}
                            onPress={() => handleDeleteProofPhoto(photo.url)}
                            disabled={deletingProofPhotoUrl === photo.url}
                          >
                            {deletingProofPhotoUrl === photo.url
                              ? <ActivityIndicator size="small" color="#FFFFFF" />
                              : <Ionicons name="trash-outline" size={12} color="#FFFFFF" />
                            }
                          </TouchableOpacity>
                        </View>
                      ))}
                  </View>
                </View>
              )}
              {/* Signature à droite */}
              {commande.signatureClient && (
                <View style={styles.signatureDisplayBlock}>
                  <Text style={styles.signatureDisplayLabel}>✍️ Signature</Text>
                  <TouchableOpacity onPress={() => setViewerUrl(commande.signatureClient!)} activeOpacity={0.85}>
                    <Image
                      source={{ uri: commande.signatureClient }}
                      style={styles.signatureDisplayImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}
          <PhotoViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
        </View>
      )}

    </ScrollView>

    {/* ── Modal Photos obligatoires avant ENLEVEE ── */}
    <Modal
      visible={showEnleveeModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => !confirmingEnlevee && setShowEnleveeModal(false)}
    >
      <View style={styles.signatureModalContainer}>
        <View style={styles.signatureModalHeader}>
          <Text style={styles.signatureModalTitle}>📷 Photos d'enlèvement</Text>
          <Text style={styles.signatureModalSubtitle}>
            Prenez au moins une photo avant de confirmer l'enlèvement
          </Text>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Boutons caméra / galerie */}
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              style={[styles.photoButton, { flex: 1 }]}
              onPress={() => handleEnleveeModalPhoto('camera')}
              disabled={loadingEnleveeModalPhoto || confirmingEnlevee}
            >
              <Ionicons name="camera" size={20} color="#6B7280" />
              <Text style={styles.photoButtonText}>Caméra</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, { flex: 1 }]}
              onPress={() => handleEnleveeModalPhoto('gallery')}
              disabled={loadingEnleveeModalPhoto || confirmingEnlevee}
            >
              <Ionicons name="images" size={20} color="#6B7280" />
              <Text style={styles.photoButtonText}>Galerie</Text>
            </TouchableOpacity>
          </View>

          {loadingEnleveeModalPhoto && (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.preuveSectionNote}>Upload en cours...</Text>
            </View>
          )}

          {/* Miniatures photos prises */}
          {enleveeModalPhotos.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.photoSectionTitle, { color: '#059669' }]}>
                ✅ {enleveeModalPhotos.length} photo(s) ajoutée(s)
              </Text>
              <View style={styles.preuvePhotoGrid}>
                {enleveeModalPhotos.map((p, idx) => (
                  <Image key={idx} source={{ uri: p.url }} style={styles.preuvePhotoItem} resizeMode="cover" />
                ))}
              </View>
            </View>
          )}

          {enleveeModalPhotos.length === 0 && !loadingEnleveeModalPhoto && (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Ionicons name="camera-outline" size={48} color="#D1D5DB" />
              <Text style={[styles.noData, { marginTop: 8 }]}>Aucune photo prise</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.signatureModalFooter}>
          <TouchableOpacity
            style={[
              styles.signatureSaveButton,
              { backgroundColor: '#8B5CF6' },
              (enleveeModalPhotos.length === 0 || confirmingEnlevee) && styles.signatureSaveButtonDisabled,
            ]}
            onPress={handleConfirmEnlevee}
            disabled={enleveeModalPhotos.length === 0 || confirmingEnlevee}
            activeOpacity={0.8}
          >
            {confirmingEnlevee
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.signatureSaveButtonText}>Confirmer l'enlèvement</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signatureSkipButton}
            onPress={() => setShowEnleveeModal(false)}
            disabled={confirmingEnlevee}
            activeOpacity={0.7}
          >
            <Text style={styles.signatureSkipButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* ── Modal Preuves + Signature obligatoires avant LIVREE ── */}
    <Modal
      visible={showLivreeModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => !confirmingLivree && setShowLivreeModal(false)}
    >
      <View style={styles.signatureModalContainer}>
        <View style={styles.signatureModalHeader}>
          <Text style={styles.signatureModalTitle}>✅ Finaliser la livraison</Text>
          <Text style={styles.signatureModalSubtitle}>
            Photo(s) obligatoire(s) + signature du client ou magasin
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Section photos de preuve */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={styles.photoSectionTitle}>
              📸 Photos de preuve {livreeModalPhotos.length === 0 ? '(obligatoire)' : `— ${livreeModalPhotos.length} ajoutée(s) ✅`}
            </Text>
            <View style={styles.photoButtonRow}>
              <TouchableOpacity
                style={[styles.photoButton, { flex: 1 }]}
                onPress={() => handleLivreeModalPhoto('camera')}
                disabled={loadingLivreeModalPhoto || confirmingLivree}
              >
                <Ionicons name="camera" size={18} color="#6B7280" />
                <Text style={styles.photoButtonText}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, { flex: 1 }]}
                onPress={() => handleLivreeModalPhoto('gallery')}
                disabled={loadingLivreeModalPhoto || confirmingLivree}
              >
                <Ionicons name="images" size={18} color="#6B7280" />
                <Text style={styles.photoButtonText}>Galerie</Text>
              </TouchableOpacity>
            </View>
            {loadingLivreeModalPhoto && (
              <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 6 }} />
            )}
            {livreeModalPhotos.length > 0 && (
              <View style={styles.preuvePhotoGrid}>
                {livreeModalPhotos.map((p, idx) => (
                  <Image key={idx} source={{ uri: p.url }} style={styles.preuvePhotoItem} resizeMode="cover" />
                ))}
              </View>
            )}
          </View>

          {/* Section signature */}
          <View style={{ padding: 16 }}>
            <Text style={styles.photoSectionTitle}>✍️ Signature (obligatoire)</Text>
            <Text style={[styles.preuveSectionNote, { marginBottom: 8 }]}>
              Faites signer le client ou le magasin destinataire
            </Text>
          </View>
          <View style={styles.signatureCanvasWrapper}>
            <SignatureCanvas
              ref={livreeSignatureRef}
              onOK={handleLivreeSignatureOK}
              onEmpty={handleLivreeSignatureEmpty}
              autoClear={false}
              descriptionText=""
              webStyle={`.m-signature-pad { box-shadow: none; border: none; }
                .m-signature-pad--body { border: none; }
                .m-signature-pad--footer { display: none; }
                body { background: #FFFFFF; }`}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>

        <View style={styles.signatureModalFooter}>
          <TouchableOpacity
            style={[
              styles.signatureSaveButton,
              { backgroundColor: '#10B981' },
              (livreeModalPhotos.length === 0 || confirmingLivree) && styles.signatureSaveButtonDisabled,
            ]}
            onPress={handleConfirmLivree}
            disabled={livreeModalPhotos.length === 0 || confirmingLivree}
            activeOpacity={0.8}
          >
            {confirmingLivree
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.signatureSaveButtonText}>Confirmer la livraison</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signatureSkipButton}
            onPress={() => setShowLivreeModal(false)}
            disabled={confirmingLivree}
            activeOpacity={0.7}
          >
            <Text style={styles.signatureSkipButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
</>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
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

  // Infos
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

  // ── Contact & Navigation ──
  contactSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  contactSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  contactBlock: {
    marginBottom: 10,
  },
  contactBlockNoMargin: {
    marginBottom: 0,
  },
  contactBlockLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  contactButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  callButtonAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  callButtonAltText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Timeline
  timelineContainer: {
    marginBottom: 20,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stepCircleFuture: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  stepInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  stepLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginTop: 2,
  },
  stepLineDone: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    minHeight: 22,
    paddingBottom: 8,
  },
  stepLabel: {
    fontSize: 14,
    flex: 1,
  },
  stepLabelDone: {
    color: '#374151',
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  stepLabelFuture: {
    color: '#9CA3AF',
  },
  currentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  stepDetail: {
    marginLeft: 34,
    marginTop: -4,
    marginBottom: 6,
  },
  stepDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  stepDetailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepDetailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Actions statut
  actionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  echecButton: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  secondaryButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  waitingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },

  // ── Photos d'enlèvement supplémentaires (après ENLEVEE) ──
  enleveePhotoSection: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  enleveePhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  enleveePhotoNote: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 10,
  },

  // ── Rapports & Réserves ──
  rapportSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rapportSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  rapportSectionNote: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  rapportToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 6,
  },
  rapportToggleActiveEnlev: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  rapportLivButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rapportToggleActiveLiv: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  rapportEnlevText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  rapportLivText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  rapportForm: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rapportFormLiv: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rapportFormLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  rapportTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
  },
  rapportFormActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rapportCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapportCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  rapportSubmitButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapportSubmitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ── Photos ──
  photoButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  photoButtonGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  // ── Preuves de livraison ──
  preuveSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  preuveSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  preuveSectionNote: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  preuvePhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  preuvePhotoItem: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  photoWithDelete: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239,68,68,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },

  // ── GPS Tracking Indicator ──────────────────────────────────────────────────
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  gpsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
  },
  gpsDotActive: {
    backgroundColor: '#10B981',
  },
  gpsIndicatorText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  gpsRetryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsRetryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Signature Modal ──
  signatureModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  signatureModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  signatureModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  signatureModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  signatureCanvasWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signatureModalFooter: {
    padding: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  signatureSaveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signatureSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signatureSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signatureSkipButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  signatureSkipButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  preuveRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  preuvePhotosCol: {
    flex: 1,
    minWidth: 0,
  },
  signatureDisplayBlock: {
    width: 120,
    flexShrink: 0,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  signatureDisplayLabel: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
    marginBottom: 8,
  },
  signatureDisplayImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
});
