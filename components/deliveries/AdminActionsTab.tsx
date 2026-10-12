/**
 * AdminActionsTab - Onglet Actions pour admin / direction
 * Équivalent mobile de AdminActions.tsx + StatusManager.tsx (mode admin) côté web :
 * statuts, dispatch des chauffeurs, suivi GPS + lien de partage, tarif.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Commande, StatutCommande, StatutLivraison } from '../../constants/Types';
import commandesService, { type ChauffeurOption } from '../../services/commandes.service';
import { LiveTrackingMap } from './LiveTrackingMap';

const STATUTS_COMMANDE: StatutCommande[] = ['En attente', 'Confirmée', 'Modifiée', 'Annulée'];
const STATUTS_LIVRAISON: StatutLivraison[] = [
  'EN ATTENTE', 'CONFIRMEE', 'ENLEVEE', 'EN COURS DE LIVRAISON', 'LIVREE', 'ANNULEE', 'ECHEC',
];
// Comme le web : le dispatch n'est proposé qu'avant l'enlèvement
const STATUTS_DISPATCH: StatutLivraison[] = ['EN ATTENTE', 'CONFIRMEE'];
const STATUTS_TERMINAUX: string[] = ['LIVREE', 'ANNULEE', 'ECHEC'];

interface AdminActionsTabProps {
  commande: Commande;
  onChanged?: () => void;
}

interface QuickAction {
  label: string;
  color: string;
  updates: { statutCommande?: StatutCommande; statutLivraison?: StatutLivraison };
}

// Actions rapides qui ne nécessitent pas de preuve terrain (photos/signature = chauffeur)
const getQuickActions = (commande: Commande): QuickAction[] => {
  const actions: QuickAction[] = [];
  if (commande.statutCommande === 'En attente' || commande.statutCommande === 'Modifiée') {
    actions.push({ label: 'Confirmer la commande', color: '#16A34A', updates: { statutCommande: 'Confirmée' } });
  }
  if (commande.statutLivraison === 'EN ATTENTE' && commande.statutCommande === 'Confirmée') {
    actions.push({ label: 'Confirmer prise en charge', color: '#2563EB', updates: { statutLivraison: 'CONFIRMEE' } });
  }
  if (commande.statutLivraison === 'ENLEVEE') {
    actions.push({ label: 'Démarrer livraison', color: '#D97706', updates: { statutLivraison: 'EN COURS DE LIVRAISON' } });
  }
  return actions;
};

export const AdminActionsTab: React.FC<AdminActionsTabProps> = ({ commande, onChanged }) => {
  const [busy, setBusy] = useState(false);

  // ── Statuts avancés ──
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<StatutCommande>(commande.statutCommande);
  const [selectedLivraison, setSelectedLivraison] = useState<StatutLivraison>(commande.statutLivraison);

  // ── Dispatch ──
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurOption[]>([]);
  const [loadingChauffeurs, setLoadingChauffeurs] = useState(false);
  const [selectedChauffeurIds, setSelectedChauffeurIds] = useState<string[]>([]);

  // ── Tarif ──
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [tarifInput, setTarifInput] = useState('');

  const assigned = commande.chauffeurs || [];
  const isCession = commande.type === 'INTER_MAGASIN';
  const quickActions = getQuickActions(commande);
  const canDispatch = STATUTS_DISPATCH.includes(commande.statutLivraison);
  const showTracking = commande.statutLivraison === 'EN COURS DE LIVRAISON'
    || STATUTS_TERMINAUX.includes(commande.statutLivraison);

  const run = useCallback(async (action: () => Promise<{ success: boolean; error?: string }>, successMessage?: string) => {
    setBusy(true);
    try {
      const res = await action();
      if (!res.success) {
        Alert.alert('Action impossible', res.error || 'Erreur inconnue');
        return false;
      }
      if (successMessage) Alert.alert('✅', successMessage);
      onChanged?.();
      return true;
    } finally {
      setBusy(false);
    }
  }, [onChanged]);

  // ── Statuts ──
  const handleQuickAction = (action: QuickAction) => {
    Alert.alert('Confirmation', `${action.label} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => run(() => commandesService.updateStatuts(commande.id, {
          ...action.updates,
          reason: `Action rapide mobile: ${action.label}`,
        })),
      },
    ]);
  };

  const openStatusModal = () => {
    setSelectedCommande(commande.statutCommande);
    setSelectedLivraison(commande.statutLivraison);
    setShowStatusModal(true);
  };

  const submitStatusModal = async () => {
    const updates: { statutCommande?: StatutCommande; statutLivraison?: StatutLivraison; reason: string } = {
      reason: 'Modification manuelle (mobile)',
    };
    if (selectedCommande !== commande.statutCommande) updates.statutCommande = selectedCommande;
    if (selectedLivraison !== commande.statutLivraison) updates.statutLivraison = selectedLivraison;
    if (!updates.statutCommande && !updates.statutLivraison) {
      setShowStatusModal(false);
      return;
    }
    const ok = await run(() => commandesService.updateStatuts(commande.id, updates));
    if (ok) setShowStatusModal(false);
  };

  // ── Dispatch ──
  const openDispatchModal = async () => {
    setSelectedChauffeurIds(assigned.map(c => c.id));
    setShowDispatchModal(true);
    if (chauffeurs.length > 0) return;
    setLoadingChauffeurs(true);
    const res = await commandesService.getChauffeurs();
    setLoadingChauffeurs(false);
    if (res.success && res.data) setChauffeurs(res.data);
    else Alert.alert('Erreur', res.error || 'Impossible de charger les chauffeurs');
  };

  const toggleChauffeur = (id: string) => {
    setSelectedChauffeurIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const saveDispatch = async () => {
    const ok = await run(() => commandesService.assignChauffeurs(commande.id, selectedChauffeurIds));
    if (ok) setShowDispatchModal(false);
  };

  const confirmAssignment = (chauffeurIds: string[], message: string) => {
    Alert.alert('Confirmation', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => run(() => commandesService.assignChauffeurs(commande.id, chauffeurIds)) },
    ]);
  };

  // ── Tarif ──
  const openTarifModal = () => {
    setTarifInput(commande.tarifHT != null ? String(commande.tarifHT) : '');
    setShowTarifModal(true);
  };

  const saveTarif = async () => {
    const value = Number(tarifInput.replace(',', '.'));
    if (!tarifInput.trim() || Number.isNaN(value) || value < 0) {
      Alert.alert('Tarif invalide', 'Saisissez un montant HT positif.');
      return;
    }
    const ok = await run(() => commandesService.updateTarif(commande.id, value));
    if (ok) setShowTarifModal(false);
  };

  // ── Partage du suivi ──
  const shareTracking = async () => {
    setBusy(true);
    try {
      const res = await commandesService.getTrackingShareLink(commande.id);
      if (!res.success || !res.data?.url) {
        Alert.alert('Erreur', res.error || 'Impossible de générer le lien de suivi');
        return;
      }
      const adresse = commande.client?.adresseLigne1;
      const lignes = [
        `📦 Commande : ${commande.numeroCommande}`,
        commande.livraison?.creneau ? `🕐 Créneau : ${commande.livraison.creneau}` : null,
        adresse ? `📍 Livraison : ${adresse}` : null,
        '',
        'Suivez en temps réel :',
        res.data.url,
      ].filter(l => l !== null).join('\n');
      await Share.share({ message: lignes, title: `Suivi livraison ${commande.numeroCommande}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {busy && (
        <View style={styles.busyBar}>
          <ActivityIndicator size="small" color="#E11D48" />
          <Text style={styles.busyText}>Mise à jour…</Text>
        </View>
      )}

      {/* ── Statuts ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Gestion des statuts</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Commande</Text>
          <Text style={styles.value}>{commande.statutCommande}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Livraison</Text>
          <Text style={styles.value}>{commande.statutLivraison}</Text>
        </View>

        {quickActions.map(action => (
          <TouchableOpacity
            key={action.label}
            style={[styles.primaryButton, { backgroundColor: action.color }]}
            onPress={() => handleQuickAction(action)}
            disabled={busy}
          >
            <Text style={styles.primaryButtonText}>{action.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.secondaryButton} onPress={openStatusModal} disabled={busy}>
          <Ionicons name="options-outline" size={16} color="#4338CA" />
          <Text style={styles.secondaryButtonText}>Modification avancée</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Enlèvement et livraison : validés par le chauffeur avec photos et signature.
        </Text>
      </View>

      {/* ── Dispatch ── */}
      {canDispatch && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚛 Gestion dispatching</Text>
          {assigned.length === 0 ? (
            <Text style={styles.empty}>Aucun chauffeur assigné</Text>
          ) : (
            assigned.map(ch => (
              <View key={ch.id} style={styles.chauffeurRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>{[ch.prenom, ch.nom].filter(Boolean).join(' ')}</Text>
                  {!!ch.telephone && <Text style={styles.subValue}>{ch.telephone}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => confirmAssignment(
                    assigned.filter(c => c.id !== ch.id).map(c => c.id),
                    `Retirer ${ch.prenom || ''} ${ch.nom || ''} de cette ${isCession ? 'cession' : 'livraison'} ?`,
                  )}
                  disabled={busy}
                >
                  <Text style={styles.removeText}>Retirer</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.primaryButton, styles.flex1]} onPress={openDispatchModal} disabled={busy}>
              <Text style={styles.primaryButtonText}>{assigned.length > 0 ? 'Modifier les chauffeurs' : 'Dispatcher'}</Text>
            </TouchableOpacity>
            {assigned.length > 0 && (
              <TouchableOpacity
                style={[styles.greyButton, styles.flex1]}
                onPress={() => confirmAssignment([], 'Retirer tous les chauffeurs ?')}
                disabled={busy}
              >
                <Text style={styles.primaryButtonText}>Retirer tous</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Suivi GPS ── */}
      {showTracking && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Suivi GPS</Text>
          <LiveTrackingMap commandeId={commande.id} live={commande.statutLivraison === 'EN COURS DE LIVRAISON'} />
          {!STATUTS_TERMINAUX.includes(commande.statutLivraison) && (
            <TouchableOpacity style={styles.secondaryButton} onPress={shareTracking} disabled={busy}>
              <Ionicons name="share-social-outline" size={16} color="#4338CA" />
              <Text style={styles.secondaryButtonText}>Partager le suivi au client</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Tarif ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Gestion financière</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Tarif HT</Text>
          <Text style={styles.value}>{commande.tarifHT != null ? `${Number(commande.tarifHT).toFixed(2)} €` : 'Non défini'}</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={openTarifModal} disabled={busy}>
          <Ionicons name="cash-outline" size={16} color="#4338CA" />
          <Text style={styles.secondaryButtonText}>Définir le tarif</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal statuts ── */}
      <Modal visible={showStatusModal} transparent animationType="slide" onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Modification avancée</Text>
            <Text style={styles.modalLabel}>Statut commande</Text>
            <View style={styles.chips}>
              {STATUTS_COMMANDE.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, selectedCommande === s && styles.chipActive]} onPress={() => setSelectedCommande(s)}>
                  <Text style={[styles.chipText, selectedCommande === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Statut livraison</Text>
            <View style={styles.chips}>
              {STATUTS_LIVRAISON.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, selectedLivraison === s && styles.chipActive]} onPress={() => setSelectedLivraison(s)}>
                  <Text style={[styles.chipText, selectedLivraison === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.cancelButton, styles.flex1]} onPress={() => setShowStatusModal(false)} disabled={busy}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, styles.flex1]} onPress={submitStatusModal} disabled={busy}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal dispatch ── */}
      <Modal visible={showDispatchModal} transparent animationType="slide" onRequestClose={() => setShowDispatchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.modalTall]}>
            <Text style={styles.modalTitle}>{assigned.length > 0 ? 'Modifier les chauffeurs' : 'Assigner des chauffeurs'}</Text>
            {loadingChauffeurs ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color="#E11D48" />
            ) : (
              <ScrollView style={{ flexGrow: 0 }}>
                {chauffeurs.length === 0 && <Text style={styles.empty}>Aucun chauffeur disponible</Text>}
                {chauffeurs.map(ch => {
                  const checked = selectedChauffeurIds.includes(ch.id);
                  return (
                    <TouchableOpacity key={ch.id} style={styles.checkRow} onPress={() => toggleChauffeur(ch.id)}>
                      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? '#E11D48' : '#9CA3AF'} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.value}>{[ch.prenom, ch.nom].filter(Boolean).join(' ')}</Text>
                        <Text style={styles.subValue}>{[ch.telephone, ch.status].filter(Boolean).join(' · ')}</Text>
                      </View>
                      {assigned.some(a => a.id === ch.id) && <Text style={styles.badge}>Assigné</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <Text style={styles.hint}>{selectedChauffeurIds.length} chauffeur(s) sélectionné(s)</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.cancelButton, styles.flex1]} onPress={() => setShowDispatchModal(false)} disabled={busy}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, styles.flex1]} onPress={saveDispatch} disabled={busy || loadingChauffeurs}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{assigned.length > 0 ? 'Mettre à jour' : 'Assigner'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal tarif ── */}
      <Modal visible={showTarifModal} transparent animationType="slide" onRequestClose={() => setShowTarifModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Définir le tarif</Text>
            <TextInput
              style={styles.input}
              value={tarifInput}
              onChangeText={setTarifInput}
              keyboardType="decimal-pad"
              placeholder="Montant HT (€)"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.cancelButton, styles.flex1]} onPress={() => setShowTarifModal(false)} disabled={busy}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, styles.flex1]} onPress={saveTarif} disabled={busy}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Valider</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  busyBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  busyText: { fontSize: 12, color: '#6B7280' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  subValue: { fontSize: 12, color: '#6B7280' },
  hint: { fontSize: 11, color: '#9CA3AF' },
  empty: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  primaryButton: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  greyButton: {
    backgroundColor: '#4B5563',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  secondaryButtonText: { color: '#4338CA', fontWeight: '600', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  flex1: { flex: 1 },
  chauffeurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 6,
  },
  removeText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalTall: { maxHeight: '85%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: { borderColor: '#E11D48', backgroundColor: '#FFF1F2' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#E11D48', fontWeight: '600' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  badge: {
    fontSize: 11,
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#6B7280', fontWeight: '500', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
});

export default AdminActionsTab;
