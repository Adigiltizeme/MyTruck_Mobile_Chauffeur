/**
 * Service Commandes
 * Gère les opérations CRUD sur les commandes
 */

import apiService from './api.service';
import commandesTransformerService from './commandes-transformer.service';
import { uploadPhotoToCloudinary } from './cloudinary.service';
import { COMMANDES_ENDPOINTS } from '../constants/API';
import type {
  Commande,
  ApiResponse,
  PhotoType,
  RapportType,
  StatutLivraison,
  StatutCommande,
} from '../constants/Types';

export const commandesService = {
  /**
   * Récupérer les commandes d'un chauffeur
   * @param chauffeurId - ID du chauffeur
   */
  async getCommandesByChauffeur(chauffeurId: string): Promise<ApiResponse<Commande[]>> {
    try {
      console.log('📦 [COMMANDES] Récupération commandes chauffeur:', chauffeurId);

      // Backend retourne { data: Commande[], total: number }
      const response = await apiService.get<{ data: Commande[]; total: number }>(
        COMMANDES_ENDPOINTS.BY_CHAUFFEUR(chauffeurId)
      );

      if (response.success && response.data) {
        // Extraire le tableau de commandes depuis response.data.data
        const commandesRaw = (response.data as any).data || [];
        console.log(`✅ [COMMANDES] ${commandesRaw.length} commandes trouvées`);

        // ✅ Transformer les données backend vers format métier mobile
        const commandes = commandesTransformerService.transformCommandes(commandesRaw);
        console.log('✅ [COMMANDES] Données transformées avec structure dates.misAJour');

        return {
          success: true,
          data: commandes,
        };
      }

      return {
        success: false,
        data: [],
        error: 'Aucune donnée reçue du serveur',
      };
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur récupération commandes:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des commandes',
      };
    }
  },

  /**
   * Récupérer une commande par son ID
   * @param commandeId - ID de la commande
   */
  async getCommandeById(commandeId: string): Promise<ApiResponse<Commande>> {
    try {
      console.log('📦 [COMMANDES] Récupération commande:', commandeId);

      const response = await apiService.get<Commande>(
        COMMANDES_ENDPOINTS.BY_ID(commandeId)
      );

      return response;
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur récupération commande:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de la commande',
      };
    }
  },

  /**
   * Mettre à jour le statut de livraison
   * @param commandeId - ID de la commande
   * @param statutLivraison - Nouveau statut
   */
  async updateStatutLivraison(
    commandeId: string,
    statutLivraison: StatutLivraison
  ): Promise<ApiResponse<Commande>> {
    try {
      console.log('📦 [COMMANDES] Update statut livraison:', commandeId, '→', statutLivraison);

      // Le backend attend { statut: ... } via @Body('statut')
      const response = await apiService.patch<Commande>(
        COMMANDES_ENDPOINTS.UPDATE_STATUT_LIVRAISON(commandeId),
        { statut: statutLivraison }
      );

      if (response.success) {
        console.log('✅ [COMMANDES] Statut livraison mis à jour');
      }

      return response;
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur update statut livraison:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du statut',
      };
    }
  },

  /**
   * Mettre à jour le statut de commande
   * @param commandeId - ID de la commande
   * @param statutCommande - Nouveau statut
   */
  async updateStatutCommande(
    commandeId: string,
    statutCommande: StatutCommande
  ): Promise<ApiResponse<Commande>> {
    try {
      console.log('📦 [COMMANDES] Update statut commande:', commandeId, '→', statutCommande);

      const response = await apiService.patch<Commande>(
        COMMANDES_ENDPOINTS.UPDATE_STATUT_COMMANDE(commandeId),
        { statutCommande }
      );

      if (response.success) {
        console.log('✅ [COMMANDES] Statut commande mis à jour');
      }

      return response;
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur update statut commande:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du statut',
      };
    }
  },

  /**
   * Uploader une photo de livraison
   * @param commandeId - ID de la commande
   * @param photoUri - URI locale de la photo
   * @param type - Type de photo (ENLEVEMENT | LIVRAISON)
   */
  async uploadPhoto(
    commandeId: string,
    photoUri: string,
    type: PhotoType
  ): Promise<ApiResponse<any>> {
    try {
      console.log('📸 [COMMANDES] Upload photo vers Cloudinary:', type, commandeId);

      // Étape 1 : Upload direct vers Cloudinary (comme le web)
      const { url, filename } = await uploadPhotoToCloudinary(photoUri);
      console.log('✅ [COMMANDES] Photo uploadée sur Cloudinary:', url);

      // Étape 2 : Envoyer l'URL JSON au backend (endpoint attendu : { photos: [{url, filename}] })
      const response = await apiService.post(
        COMMANDES_ENDPOINTS.ADD_PHOTO(commandeId),
        { photos: [{ url, filename }] }
      );

      if (response.success) {
        console.log('✅ [COMMANDES] Photo enregistrée en base avec succès');
      }

      return response;
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur upload photo:', error);
      return {
        success: false,
        error: "Erreur lors de l'upload de la photo",
      };
    }
  },

  /**
   * Créer un rapport d'enlèvement ou de livraison
   * @param commandeId - ID de la commande
   * @param rapportData - Données du rapport
   */
  async createRapport(
    commandeId: string,
    rapportData: {
      type: RapportType;
      message?: string;
      chauffeurId?: string;
      photos?: Array<{ url: string; filename?: string }>;
      signatureChauffeur?: string;
      signatureMagasin?: string;
      signatureClient?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      console.log('📝 [COMMANDES] Création rapport:', rapportData.type, commandeId);

      const response = await apiService.post(
        COMMANDES_ENDPOINTS.CREATE_RAPPORT(commandeId),
        rapportData
      );

      if (response.success) {
        console.log('✅ [COMMANDES] Rapport créé avec succès');
      }

      return response;
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur création rapport:', error);
      return {
        success: false,
        error: 'Erreur lors de la création du rapport',
      };
    }
  },

  /**
   * Récupérer les rapports d'une commande
   * @param commandeId - ID de la commande
   */
  async getRapports(commandeId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiService.get(COMMANDES_ENDPOINTS.GET_RAPPORTS(commandeId));
      return response;
    } catch (error) {
      console.error('❌ [COMMANDES] Erreur récupération rapports:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des rapports',
      };
    }
  },
};

export default commandesService;
