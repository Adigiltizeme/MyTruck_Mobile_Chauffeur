/**
 * Appel téléphonique et navigation GPS (source unique pour toute l'app)
 */

import { Alert, ActionSheetIOS, Linking, Platform } from 'react-native';

export const callPhone = (phone: string) => {
  const cleaned = phone.replace(/\s/g, '');
  Linking.openURL(`tel:${cleaned}`).catch(() =>
    Alert.alert('Erreur', "Impossible de passer l'appel")
  );
};

const openWithFallback = (url: string, fallback: string) =>
  Linking.openURL(url).catch(() =>
    Linking.openURL(fallback)
      .catch(() => Alert.alert('Erreur', "Impossible d'ouvrir la navigation"))
  );

/** Destination : adresse postale ou coordonnées "lat,lng". */
export const openMaps = (destination: string) => {
  if (!destination) {
    Alert.alert('Adresse manquante', 'Aucune adresse disponible pour la navigation');
    return;
  }
  const encoded = encodeURIComponent(destination);

  // Android : geo: déclenche déjà le sélecteur natif d'applications
  if (Platform.OS !== 'ios') {
    openWithFallback(`geo:0,0?q=${encoded}`, `https://maps.google.com/?q=${encoded}`);
    return;
  }

  // iOS : pas de sélecteur système → proposer les apps de navigation installées
  // (schémas déclarés dans LSApplicationQueriesSchemes de app.json, requis par canOpenURL)
  const apps = [
    { label: 'Plans', url: `maps://?daddr=${encoded}`, fallback: `https://maps.apple.com/?daddr=${encoded}`, always: true },
    { label: 'Google Maps', url: `comgooglemaps://?daddr=${encoded}&directionsmode=driving`, fallback: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`, always: false },
    { label: 'Waze', url: `waze://?q=${encoded}&navigate=yes`, fallback: `https://waze.com/ul?q=${encoded}&navigate=yes`, always: false },
  ];

  Promise.all(apps.map(a => (a.always ? true : Linking.canOpenURL(a.url).catch(() => false))))
    .then((installed) => {
      const choices = apps.filter((_, i) => installed[i]);
      if (choices.length === 1) {
        openWithFallback(choices[0].url, choices[0].fallback);
        return;
      }
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Naviguer avec…',
          message: destination,
          options: [...choices.map(a => a.label), 'Annuler'],
          cancelButtonIndex: choices.length,
        },
        (index: number) => {
          const app = choices[index];
          if (app) openWithFallback(app.url, app.fallback);
        }
      );
    });
};
