/**
 * Service de transformation des commandes
 * Transforme les données brutes du backend vers le format métier mobile
 * (Similaire à simple-backend.service.ts du frontend web)
 */

import type { Commande } from '../constants/Types';

/**
 * Extrait et normalise les dimensions depuis les données backend.
 * Gère les deux formats possibles :
 * - String JSON (commandes : stockées avec JSON.stringify côté backend)
 * - Array JS   (cessions : stockées directement côté backend)
 */
function extractDimensions(backendData: any): any[] {
  try {
    if (!backendData.articles || backendData.articles.length === 0) return [];

    const dimensionsRaw = backendData.articles[0].dimensions;

    if (Array.isArray(dimensionsRaw)) return dimensionsRaw;

    if (typeof dimensionsRaw === 'string') {
      const parsed = JSON.parse(dimensionsRaw);
      return Array.isArray(parsed) ? parsed : [];
    }

    if (dimensionsRaw && typeof dimensionsRaw === 'object' && !Array.isArray(dimensionsRaw)) {
      // Objet unique — l'envelopper dans un tableau
      if (dimensionsRaw.nom || dimensionsRaw.quantite) return [dimensionsRaw];
    }

    return [];
  } catch {
    return [];
  }
}

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

    // ── Articles ──────────────────────────────────────────────────────────
    const dimensions = extractDimensions(backendData);
    const rawArticle = backendData.articles?.[0];

    // Fallback nombre : si le champ DB est 0 / absent, calcule depuis dimensions
    const nombreFromDimensions = dimensions.reduce(
      (sum: number, d: any) => sum + (Number(d.quantite) || 1),
      0
    );
    const nombre: number =
      rawArticle?.nombre && rawArticle.nombre > 0
        ? rawArticle.nombre
        : nombreFromDimensions;

    const articles = rawArticle
      ? [{
          id: rawArticle.id || '',
          nombre,
          details: rawArticle.details || '',
          categories: rawArticle.categories || [],
          dimensions,
          autresArticles: rawArticle.autresArticles || 0,
          canBeTilted: rawArticle.canBeTilted || false,
        }]
      : undefined;

    return {
      ...backendData,

      // ✅ Type de commande (CLIENT ou INTER_MAGASIN)
      type: backendData.type || 'CLIENT',

      // ✅ Articles normalisés (dimensions parsées + nombre calculé en fallback)
      articles,

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

      // ✅ Cessions : magasin demandeur (destination)
      magasinDestination: backendData.magasinDestination || null,

      // ✅ Cessions : motif et priorité
      motifCession: backendData.motifCession || '',
      prioriteCession: backendData.prioriteCession || '',
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
