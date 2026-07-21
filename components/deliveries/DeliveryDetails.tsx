/**
 * DeliveryDetails - Détails expandable commande
 * 6 onglets : Actions | Informations | Conditions spéciales | Photos articles | Photos commentaires | Chronologie
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { Commande, StatutLivraison, PhotoType } from '../../constants/Types';
import { format } from 'date-fns';
import commandesService from '../../services/commandes.service';

type TabType = 'info' | 'conditions' | 'photos-articles' | 'photos-comments' | 'chronologie' | 'actions';

interface DeliveryDetailsProps {
  commande: Commande;
  onStatusChanged?: () => void;
}

export const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ commande, onStatusChanged }) => {
  const [activeTab, setActiveTab] = useState<TabType>('actions');

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
        {activeTab === 'photos-comments'  && <PhotosCommentsTab commande={commande} />}
        {activeTab === 'chronologie'      && <ChronologieTab commande={commande} />}
        {activeTab === 'actions'          && <ActionsTab commande={commande} onStatusChanged={onStatusChanged} />}
      </View>
    </View>
  );
};

// ─── Onglet Informations ───────────────────────────────────────────────────
const InfoTab: React.FC<{ commande: Commande }> = ({ commande }) => (
  <ScrollView style={styles.tabContent}>
    {/* Magasin */}
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
          {commande.magasin?.adresse
            ? (commande.magasin.codePostal && commande.magasin.ville
                ? `${commande.magasin.adresse}, ${commande.magasin.codePostal} ${commande.magasin.ville}`
                : commande.magasin.adresse)
            : 'N/A'}
        </Text>
      </View>
    </View>

    {/* Client */}
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
      {!!commande.client?.etage && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Étage:</Text>
          <Text style={styles.infoValue}>{commande.client.etage}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Ascenseur:</Text>
        <Text style={styles.infoValue}>
          {commande.client?.typeAdresse === 'Oui' ? 'Oui' : 'Non'}
        </Text>
      </View>
    </View>

    {/* Livraison */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Livraison</Text>
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
        <Text style={styles.infoValue}>
          {String(commande.livraison?.equipiers ?? 0)}
        </Text>
      </View>
    </View>

    {/* Articles */}
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
          {'Dont ' + String(commande.articles![0].autresArticles) + ' autre(s) article(s) (ni les plus grands, ni les plus lourds)'}
        </Text>
      )}
      <Text style={styles.totalArticles}>
        {'Nombre total: ' + String(commande.articles?.[0]?.nombre || 0)}
      </Text>
    </View>

    {/* Chauffeurs */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chauffeur(s)</Text>
      {commande.chauffeurs && commande.chauffeurs.length > 0 ? (
        commande.chauffeurs.map((chauffeur) => (
          <View key={chauffeur.id} style={styles.chauffeurCard}>
            <Text style={styles.chauffeurName}>
              {[chauffeur.prenom, chauffeur.nom].filter(Boolean).join(' ') || 'Chauffeur'}
            </Text>
            {!!chauffeur.telephone && (
              <Text style={[styles.infoValue, styles.phoneLink]}>
                {'📞 ' + chauffeur.telephone}
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noData}>Aucun chauffeur assigné</Text>
      )}
    </View>

    {/* Remarques */}
    {!!commande.livraison?.remarques && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Autres remarques</Text>
        <Text style={styles.infoValue}>{commande.livraison.remarques}</Text>
      </View>
    )}
  </ScrollView>
);

// ─── Onglet Conditions spéciales ──────────────────────────────────────────
const ConditionsTab: React.FC<{ commande: Commande }> = () => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Aucune condition spéciale</Text>
  </View>
);

// ─── Onglet Photos articles ───────────────────────────────────────────────
const PhotosArticlesTab: React.FC<{ commande: Commande }> = () => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Aucune photo article</Text>
  </View>
);

// ─── Onglet Photos commentaires ───────────────────────────────────────────
const PhotosCommentsTab: React.FC<{ commande: Commande }> = () => (
  <View style={styles.tabContent}>
    <Text style={styles.noData}>Aucune photo commentaire</Text>
  </View>
);

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
  // ── Statut local (mise à jour optimiste immédiate) ──
  const [localStatut, setLocalStatut] = useState<string>(commande.statutLivraison);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // ── Rapport (un seul formulaire actif à la fois) ──
  const [activeRapportType, setActiveRapportType] = useState<'ENLEVEMENT' | 'LIVRAISON' | null>(null);
  const [rapportMessage, setRapportMessage] = useState('');
  const [loadingRapport, setLoadingRapport] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  // Synchroniser avec le prop quand le parent recharge les données
  React.useEffect(() => {
    setLocalStatut(commande.statutLivraison);
  }, [commande.statutLivraison]);

  const statut = localStatut;
  const nextAction = getNextAction(statut);
  const isCompleted = statut === 'LIVREE';
  const isCancelled = statut === 'ANNULEE' || statut === 'ECHEC';

  // ── Visibilité contextuelle ──
  const showMagasinContact = ['EN ATTENTE', 'CONFIRMEE'].includes(statut);
  const showClientContact  = ['ENLEVEE', 'EN COURS DE LIVRAISON', 'LIVREE'].includes(statut);
  const canRapportEnlev    = ['CONFIRMEE', 'ENLEVEE'].includes(statut);
  const canRapportLiv      = ['EN COURS DE LIVRAISON', 'LIVREE', 'ECHEC'].includes(statut);

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
    const commandeId   = commande.id;
    const label        = nextAction.label;

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
              setLoadingAction(false);
              onStatusChanged?.();
            } else {
              setLoadingAction(false);
              Alert.alert(
                'Erreur mise à jour',
                res.error || 'Impossible de mettre à jour le statut.\nVérifiez votre connexion.'
              );
            }
          } catch (e: any) {
            setLoadingAction(false);
            Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
          }
        },
      },
    ]);
  }, [nextAction, loadingAction, commande.id, onStatusChanged]);

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
              setLoadingAction(false);
              onStatusChanged?.();
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

  // ── Création rapport ──
  const handleCreateRapport = useCallback(async () => {
    if (!activeRapportType) return;
    if (!rapportMessage.trim()) {
      Alert.alert('Commentaire requis', 'Veuillez saisir un commentaire pour le rapport');
      return;
    }
    setLoadingRapport(true);
    try {
      const chauffeurId = commande.chauffeurs?.[0]?.id;
      const res = await commandesService.createRapport(commande.id, {
        type: activeRapportType,
        message: rapportMessage.trim(),
        chauffeurId,
      });
      if (res.success) {
        setActiveRapportType(null);
        setRapportMessage('');
        Alert.alert('Rapport créé', 'Le rapport a été créé et la réserve My Truck activée.');
        onStatusChanged?.();
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de créer le rapport');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || 'Erreur de connexion');
    } finally {
      setLoadingRapport(false);
    }
  }, [activeRapportType, rapportMessage, commande.id, commande.chauffeurs, onStatusChanged]);

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

  return (
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
                    <Text style={styles.stepDetailText}>{'Étape : ' + step.actionLabel}</Text>
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
                <>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => toggleRapport('LIVRAISON')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="warning-outline" size={15} color="#D97706" />
                    <Text style={[styles.secondaryButtonText, { color: '#D97706' }]}>
                      Signaler un problème
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.echecButton]}
                    onPress={handleEchecLivraison}
                    disabled={loadingAction}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                    <Text style={styles.secondaryButtonText}>Échec de livraison</Text>
                  </TouchableOpacity>
                </>
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

      {/* ── Section Rapports & Réserves (facultatif) ── */}
      {(canRapportEnlev || canRapportLiv) && (
        <View style={styles.rapportSection}>
          <Text style={styles.rapportSectionTitle}>Rapports & Réserves (facultatif)</Text>
          <Text style={styles.rapportSectionNote}>
            Créer un rapport signale un problème et active la réserve My Truck.
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
                  <Text style={styles.rapportFormLabel}>Commentaire *</Text>
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
                  <Text style={[styles.rapportFormLabel, { marginTop: 10 }]}>Photo (optionnelle)</Text>
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
                        (!rapportMessage.trim() || loadingRapport) && styles.actionButtonDisabled,
                      ]}
                      onPress={handleCreateRapport}
                      disabled={!rapportMessage.trim() || loadingRapport}
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
                  <Text style={styles.rapportFormLabel}>Commentaire *</Text>
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
                  <Text style={[styles.rapportFormLabel, { marginTop: 10 }]}>Photo (optionnelle)</Text>
                  <View style={styles.photoButtonRow}>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => handleTakePhoto('LIVRAISON')}
                      disabled={loadingPhoto}
                    >
                      <Ionicons name="camera" size={16} color="#6B7280" />
                      <Text style={styles.photoButtonText}>Caméra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => handlePickPhoto('LIVRAISON')}
                      disabled={loadingPhoto}
                    >
                      <Ionicons name="images" size={16} color="#6B7280" />
                      <Text style={styles.photoButtonText}>Galerie</Text>
                    </TouchableOpacity>
                  </View>
                  {loadingPhoto && (
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
                        (!rapportMessage.trim() || loadingRapport) && styles.actionButtonDisabled,
                      ]}
                      onPress={handleCreateRapport}
                      disabled={!rapportMessage.trim() || loadingRapport}
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
        </View>
      )}

    </ScrollView>
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
  stepDetailText: {
    fontSize: 12,
    color: '#9CA3AF',
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
});
