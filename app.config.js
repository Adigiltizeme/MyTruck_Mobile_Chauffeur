// Étend app.json : la clé Google Maps Android (carte de suivi admin) vient de l'environnement EAS,
// jamais en clair dans le dépôt. iOS utilise Apple Plans et n'en a pas besoin.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android?.config || {}),
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    },
  },
});
