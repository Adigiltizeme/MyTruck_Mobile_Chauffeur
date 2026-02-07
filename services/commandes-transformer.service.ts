/**
 * Service de transformation des commandes
 * Transforme les données brutes du backend vers le format métier mobile
 * (Similaire à simple-backend.service.ts du frontend web)
 */

import type { Commande } from '../constants/Types';

export const commandesTransformerService = {
  /**
   * Transformer une commande backend en format métier mobile
   * @param backendData - Données brutes du backend
   */
  transformCommande(backendData: any): Commande {
    return {
      ...backendData,

      // ✅ Structure dates (comme frontend web)
      dates: {
        commande: backendData.dateCommande,
        livraison: backendData.dateLivraison,
        misAJour: backendData.updatedAt || backendData.dateCommande, // Date de dernière mise à jour
      },

      // ✅ Structure livraison
      livraison: backendData.livraison || {
        creneau: backendData.creneauLivraison || '',
        vehicule: backendData.categorieVehicule || '',
        equipiers: backendData.nombreEquipiers || 0,
        commentaireEnlevement: backendData.commentaireEnlevement || '',
        commentaireLivraison: backendData.commentaireLivraison || '',
        reserve: backendData.reserve || false,
        remarques: backendData.remarques || '',
      },
    };
  },

  /**
   * Transformer un tableau de commandes
   * @param backendCommandes - Tableau de commandes brutes du backend
   */
  transformCommandes(backendCommandes: any[]): Commande[] {
    if (!Array.isArray(backendCommandes)) {
      console.warn('⚠️ [TRANSFORMER] backendCommandes n\'est pas un tableau');
      return [];
    }

    return backendCommandes.map((cmd) => this.transformCommande(cmd));
  },
};

export default commandesTransformerService;
