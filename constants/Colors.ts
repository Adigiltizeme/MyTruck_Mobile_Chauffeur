/**
 * Charte Graphique My Truck
 * Couleurs utilisées dans toute l'application mobile
 */

export const Colors = {
  // Couleurs Principales
  primary: '#FF6B35',        // Orange My Truck (boutons principaux, headers)
  secondary: '#4CAF50',      // Vert (succès, livraison confirmée)
  danger: '#F44336',         // Rouge (annulation, erreurs)
  info: '#2196F3',           // Bleu (informations, liens)
  warning: '#FF9800',        // Orange foncé (alertes, attention)

  // Backgrounds
  background: '#F5F5F5',     // Fond écrans
  backgroundWhite: '#FFFFFF', // Fond cartes/containers
  backgroundDark: '#212121',  // Fond mode sombre

  // Texte
  textPrimary: '#212121',    // Texte principal (noir)
  textSecondary: '#757575',  // Texte secondaire (gris)
  textLight: '#FFFFFF',      // Texte sur fond foncé
  textDisabled: '#BDBDBD',   // Texte désactivé

  // Bordures
  border: '#E0E0E0',         // Bordure standard
  borderLight: '#F0F0F0',    // Bordure légère
  borderDark: '#9E9E9E',     // Bordure foncée

  // États
  success: '#4CAF50',        // Succès
  error: '#F44336',          // Erreur
  successLight: '#E8F5E9',   // Fond succès léger
  errorLight: '#FFEBEE',     // Fond erreur léger

  // Phase Retrait (Orange)
  retrait: {
    main: '#FF6B35',
    light: '#FFE0D6',
    dark: '#D45529',
    text: '#FFFFFF',
  },

  // Phase Livraison (Vert)
  livraison: {
    main: '#4CAF50',
    light: '#E8F5E9',
    dark: '#388E3C',
    text: '#FFFFFF',
  },

  // Statuts Commande
  status: {
    enAttente: '#FF9800',    // Orange
    enCours: '#2196F3',      // Bleu
    livre: '#4CAF50',        // Vert
    annule: '#F44336',       // Rouge
  },

  // Icônes
  iconPrimary: '#212121',
  iconSecondary: '#757575',
  iconLight: '#FFFFFF',
  iconOrange: '#FF6B35',
  iconGreen: '#4CAF50',

  // Ombres
  shadow: {
    color: '#000000',
    opacity: 0.1,
  },
};

// Styles d'ombre prédéfinis
export const Shadows = {
  small: {
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Colors.shadow.opacity,
    shadowRadius: 4,
    elevation: 2, // Android
  },
  medium: {
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Colors.shadow.opacity + 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Colors.shadow.opacity + 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Bordures arrondies
export const BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xl: 16,
  full: 9999, // Pour les boutons ronds
};

// Espacement
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tailles de police
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Poids de police
export const FontWeights = {
  regular: '400' as '400',
  medium: '500' as '500',
  semibold: '600' as '600',
  bold: '700' as '700',
};
