const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// nativewind/metro utilise des dynamic imports ESM qui échouent sur Windows
// (les chemins absolus C:\ ne sont pas des URL valides pour le loader ESM de Node.js).
// Sur Windows (dev local) : fallback sans withNativeWind — le preset babel suffit.
// Sur Linux (EAS build) : withNativeWind fonctionne normalement.
try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { input: './global.css' });
} catch {
  module.exports = config;
}
