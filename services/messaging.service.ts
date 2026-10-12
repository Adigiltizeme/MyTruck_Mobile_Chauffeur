/**
 * Service Messagerie — porté de frontend/src/services/messaging.service.ts (mêmes routes backend).
 * L'expéditeur (senderId / senderType) est déterminé côté serveur depuis le JWT.
 */

import apiService from './api.service';
import { MESSAGING_ENDPOINTS, MAGASINS_ENDPOINTS, CHAUFFEURS_ENDPOINTS } from '../constants/API';
import type { ApiResponse } from '../constants/Types';

export type ConversationType = 'MAGASIN_DIRECTION' | 'COMMANDE_GROUP' | 'PRIVATE';
export type SenderType = 'MAGASIN' | 'DIRECTION' | 'CHAUFFEUR' | 'SYSTEM';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  content: string;
  messageType: 'TEXT' | 'DEVIS_REQUEST' | 'DEVIS_RESPONSE' | 'COMMANDE_UPDATE' | 'SYSTEM_NOTIFICATION';
  isRead: boolean;
  readBy: string[];
  sentAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  participantIds: string[];
  magasinId?: string | null;
  commandeId?: string | null;
  chauffeurId?: string | null;
  isActive: boolean;
  lastMessageAt?: string | null;
  createdAt: string;
  messages?: Message[];
  magasin?: { id: string; nom: string } | null;
  commande?: { id: string; numeroCommande: string } | null;
  chauffeur?: { id: string; nom: string; prenom?: string | null } | null;
  _count?: { messages: number };
}

export interface ParticipantDirectory {
  magasins: Map<string, string>;
  chauffeurs: Map<string, string>;
}

// Annuaire admin : assez large pour couvrir tous les magasins/chauffeurs d'une structure
const DIRECTORY_PAGE_SIZE = 500;

const asArray = (data: any): any[] => (Array.isArray(data) ? data : data?.data || []);

export const messagingService = {
  /**
   * Le serveur filtre selon le compte : un chauffeur reçoit les conversations dont il est participant
   * (direction, groupes, magasins) ; un admin, toutes celles de sa structure.
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const res = await apiService.get(MESSAGING_ENDPOINTS.CONVERSATIONS, { isActive: 'true' });
    if (!res.success) return { success: false, data: [], error: res.error };
    return { success: true, data: asArray(res.data) };
  },

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    return apiService.get<Conversation>(MESSAGING_ENDPOINTS.CONVERSATION(id));
  },

  async markAsRead(id: string): Promise<ApiResponse<any>> {
    return apiService.put(MESSAGING_ENDPOINTS.MARK_READ(id), {});
  },

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    return apiService.post<Message>(MESSAGING_ENDPOINTS.MESSAGES, {
      conversationId,
      content,
      messageType: 'TEXT',
    });
  },

  /** Chauffeur : ouvre (ou crée, le serveur évite les doublons) la conversation avec la direction */
  async openDirectionConversation(): Promise<ApiResponse<Conversation>> {
    return apiService.post<Conversation>(MESSAGING_ENDPOINTS.USER_DIRECTION, {});
  },

  /** Admin : noms des magasins et chauffeurs pour titrer les conversations (même méthode que le web) */
  async getParticipantDirectory(): Promise<ParticipantDirectory> {
    const [magasinsRes, chauffeursRes] = await Promise.all([
      apiService.get(MAGASINS_ENDPOINTS.BASE, { take: DIRECTORY_PAGE_SIZE }),
      apiService.get(CHAUFFEURS_ENDPOINTS.BASE, { take: DIRECTORY_PAGE_SIZE }),
    ]);
    const magasins = new Map<string, string>();
    const chauffeurs = new Map<string, string>();
    asArray(magasinsRes.data).forEach((m: any) => magasins.set(m.id, m.nom || m.name || 'Magasin'));
    asArray(chauffeursRes.data).forEach((c: any) =>
      chauffeurs.set(c.id, [c.prenom, c.nom].filter(Boolean).join(' ') || 'Chauffeur'));
    return { magasins, chauffeurs };
  },
};

export default messagingService;
