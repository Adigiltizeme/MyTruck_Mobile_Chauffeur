/**
 * Envoi du lien de suivi en direct au destinataire de la livraison (source unique admin + chauffeur).
 * SMS ou WhatsApp s'ouvrent déjà adressés au client, message prêt : il ne reste qu'à envoyer.
 */

import { Alert, ActionSheetIOS, Linking, Platform, Share } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Commande } from '../constants/Types';
import commandesService from '../services/commandes.service';

// Indicatif appliqué aux numéros nationaux (06…) pour WhatsApp, qui exige le format international
const DEFAULT_COUNTRY_CODE = '33';

/** Destinataire : le client, ou le magasin demandeur pour une cession. */
function recipientPhone(commande: Commande): string | undefined {
  return commande.type === 'INTER_MAGASIN'
    ? commande.magasinDestination?.telephone
    : commande.client?.telephone || commande.client?.telephoneSecondaire;
}

function buildMessage(commande: Commande, url: string): string {
  const magasin = commande.magasin?.nom;
  const jour = commande.dateLivraison ? format(new Date(commande.dateLivraison), 'EEEE d MMMM', { locale: fr }) : '';
  const creneau = commande.livraison?.creneau;
  const quand = [jour, creneau].filter(Boolean).join(', ');
  const intro = `Bonjour, votre livraison${magasin ? ` ${magasin}` : ''}${quand ? ` est prévue ${quand}` : ' est en route'}.`;
  return `${intro}\nSuivez votre chauffeur en temps réel : ${url}`;
}

function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return DEFAULT_COUNTRY_CODE + digits.slice(1);
  return digits;
}

const openOrAlert = (url: string, appName: string) =>
  Linking.openURL(url).catch(() => Alert.alert('Erreur', `Impossible d'ouvrir ${appName}`));

/** Génère le lien puis propose SMS / WhatsApp (adressés au destinataire) ou un autre moyen. */
export async function shareTrackingWithRecipient(commande: Commande): Promise<void> {
  const res = await commandesService.getTrackingShareLink(commande.id);
  if (!res.success || !res.data?.url) {
    Alert.alert('Erreur', res.error || 'Impossible de générer le lien de suivi');
    return;
  }
  const message = buildMessage(commande, res.data.url);
  const phone = recipientPhone(commande)?.replace(/\s/g, '');
  const other = () => Share.share({ message }).catch(() => undefined);

  if (!phone) {
    await other();
    return;
  }

  const body = encodeURIComponent(message);
  const channels = [
    { label: 'SMS', run: () => openOrAlert(`sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${body}`, 'les messages') },
    { label: 'WhatsApp', run: () => openOrAlert(`https://wa.me/${toWhatsAppNumber(phone)}?text=${body}`, 'WhatsApp') },
    { label: 'Autre…', run: other },
  ];

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Envoyer le suivi',
        message: phone,
        options: [...channels.map(c => c.label), 'Annuler'],
        cancelButtonIndex: channels.length,
      },
      (index: number) => channels[index]?.run(),
    );
    return;
  }
  // Android : trois boutons au plus, on ferme en touchant à côté
  Alert.alert('Envoyer le suivi', phone, channels.map(c => ({ text: c.label, onPress: c.run })), { cancelable: true });
}
