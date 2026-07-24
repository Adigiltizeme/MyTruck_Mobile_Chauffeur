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
    // Extraire URLs photos par type depuis backendData.photos (Photo[])
    const rawPhotos: any[] = backendData.photos || [];
    const photosEnlevement = rawPhotos
      .filter((p) => p.type === 'ENLEVEMENT')
      .map((p) => p.url as string);
    const photosLivraison = rawPhotos
      .filter((p) => p.type === 'LIVRAISON')
      .map((p) => p.url as string);

    return {
      ...backendData,

      // ✅ Aplatir la table de jonction ChauffeurSurCommande → tableau Chauffeur plat
      // Backend retourne: [{ commandeId, chauffeurId, chauffeur: { id, nom, prenom, ... } }]
      // Mobile attend:    [{ id, nom, prenom, telephone, ... }]
      chauffeurs: (backendData.chauffeurs || []).map((c: any) => c.chauffeur || c),

      // ✅ Structure dates (comme frontend web)
      dates: {
        commande: backendData.dateCommande,
        livraison: backendData.dateLivraison,
        misAJour: backendData.updatedAt || backendData.dateCommande,
      },

      // ✅ Structure livraison — peuple photosEnlevement/photosLivraison depuis photos[]
      livraison: backendData.livraison || {
        creneau: backendData.creneauLivraison || '',
        vehicule: backendData.categorieVehicule || '',
        equipiers: backendData.optionEquipier || 0,
        reserve: backendData.reserveTransport || false,
        remarques: backendData.remarques || '',
        photosEnlevement,
        photosLivraison,
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
