/**
 * Types TypeScript pour l'application Mobile Chauffeur
 * Correspond aux modèles Backend (Prisma)
 */

// Types de statuts
export type StatutCommande = 'En attente' | 'Confirmée' | 'En cours' | 'Livrée' | 'Annulée';
export type StatutLivraison = 'EN ATTENTE' | 'CONFIRMEE' | 'ENLEVEE' | 'EN COURS DE LIVRAISON' | 'LIVREE' | 'ANNULEE' | 'ECHEC';
export type PhotoType = 'ARTICLE' | 'ENLEVEMENT' | 'LIVRAISON';
export type RapportType = 'ENLEVEMENT' | 'LIVRAISON';

// Utilisateur (Chauffeur)
export interface User {
  id: string;
  email: string;
  role: string;
  chauffeurId?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  token?: string;
}

// Chauffeur
export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  actif: boolean;
}

// Magasin
export interface Magasin {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email?: string;
}

// Client
export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  telephoneSecondaire?: string;
  adresseLigne1: string;
  adresseLigne2?: string;
  codePostal: string;
  ville: string;
  email?: string;
  etage?: string;
  typeAdresse?: string;
}

// Article
export interface Article {
  id: string;
  nombre: number;
  details?: string;
  categories?: string;
  canBeTilted?: boolean;
  dimensions?: ArticleDimension[];
  autresArticles?: number;
}

export interface ArticleDimension {
  id?: string;
  quantite: number;
  longueur?: number;
  largeur?: number;
  hauteur?: number;
  poids?: number;
}

// Photo
export interface Photo {
  id: string;
  url: string;
  filename?: string;
  type: PhotoType;
  commandeId: string;
  createdAt: string;
}

// Rapport Enlèvement/Livraison
export interface RapportEnlevement {
  id: string;
  type: RapportType;
  commentaire?: string;
  signatureChauffeur?: any; // JSON - Base64 image
  signatureMagasin?: any;
  signatureClient?: any;
  commandeId: string;
  createdAt: string;
}

// Livraison Info
export interface LivraisonInfo {
  creneau: string;
  vehicule?: string;
  equipiers?: number;
  commentaireEnlevement?: string;
  commentaireLivraison?: string;
  photosEnlevement?: string[];
  photosLivraison?: string[];
  reserve?: boolean;
  remarques?: string;
}

// Dates Info (structure identique à la version web)
export interface DatesInfo {
  commande?: string;
  livraison?: string;
  misAJour?: {
    commande?: string;
    livraison?: string;
  } | string;
}

// Commande Complète
export interface Commande {
  id: string;
  numeroCommande: string;
  statutCommande: StatutCommande;
  statutLivraison: StatutLivraison;
  dateCommande: string;
  dateLivraison: string;
  heureRetrait?: string;
  heureLivraison?: string;

  // ✅ Dates structure (comme version web)
  dates?: DatesInfo;

  // Relations
  magasin?: Magasin;
  magasinId?: string;

  client?: Client;
  clientId?: string;

  chauffeurs: Chauffeur[];

  articles?: Article[];
  photos?: Photo[];
  rapportsEnlevement?: RapportEnlevement[];
  livraison?: LivraisonInfo;

  // Autres champs
  tarifHT?: number;
  tarifTTC?: number;
  commentaires?: any[];
}

// Données formulaire Photo
export interface PhotoData {
  uri: string;
  type: PhotoType;
  base64?: string;
}

// Données formulaire Signature
export interface SignatureData {
  chauffeur?: string; // Base64
  magasin?: string;   // Base64 (pour retrait)
  client?: string;    // Base64 (pour livraison)
}

// Données formulaire Rapport
export interface RapportFormData {
  type: RapportType;
  commentaire?: string;
  signatures: SignatureData;
  photo?: PhotoData;
}

// Réponse API Login
export interface LoginResponse {
  token: string;
  user: User;
}

// Réponse API générique
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// État Auth Context
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// Props Navigation
export type RootStackParamList = {
  Login: undefined;
  Main: undefined; // Bottom Tabs Navigator
  Dashboard: undefined;
  Retrait: { commandeId: string };
  Livraison: { commandeId: string };
};
