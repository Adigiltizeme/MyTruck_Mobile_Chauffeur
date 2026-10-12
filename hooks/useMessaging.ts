/**
 * useMessaging — porté de frontend/src/hooks/useMessaging.ts
 * Conversations + messages + temps réel (new-message, new-conversation), envoi via l'API.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage.service';
import { API_BASE_URL } from '../constants/API';
import messagingService, { type Conversation, type Message } from '../services/messaging.service';

const byDate = (a: Message, b: Message) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();

export const useMessaging = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
  const selectedIdRef = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    const res = await messagingService.getConversations();
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a, b) =>
        new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
      setConversations(sorted);
      setError(null);
    } else {
      setError(res.error || 'Erreur lors du chargement des conversations');
    }
    setIsLoading(false);
  }, [user?.id]);

  const loadConversationsRef = useRef(loadConversations);
  useEffect(() => { loadConversationsRef.current = loadConversations; });

  const openConversation = useCallback(async (conversationId: string) => {
    selectedIdRef.current = conversationId;
    setIsLoadingMessages(true);
    const res = await messagingService.getConversation(conversationId);
    setIsLoadingMessages(false);
    if (!res.success || !res.data) {
      setError(res.error || 'Conversation introuvable');
      return;
    }
    setSelectedConversation(res.data);
    setMessages([...(res.data.messages || [])].sort(byDate));

    socketRef.current?.emit('join-conversation', { conversationId, userId: user?.id });

    await messagingService.markAsRead(conversationId);
    setConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, _count: { messages: 0 } } : c)));
  }, [user?.id]);

  const closeConversation = useCallback(() => {
    const id = selectedIdRef.current;
    if (id) socketRef.current?.emit('leave-conversation', { conversationId: id, userId: user?.id });
    selectedIdRef.current = null;
    setSelectedConversation(null);
    setMessages([]);
    loadConversationsRef.current();
  }, [user?.id]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    const conversationId = selectedIdRef.current;
    const text = content.trim();
    if (!conversationId || !text) return false;
    const res = await messagingService.sendMessage(conversationId, text);
    if (!res.success || !res.data) {
      setError(res.error || "Erreur lors de l'envoi du message");
      return false;
    }
    const sent = res.data;
    setMessages(prev => (prev.some(m => m.id === sent.id) ? prev : [...prev, sent].sort(byDate)));
    return true;
  }, []);

  /** Chauffeur : conversation avec la direction (créée si besoin, sans doublon côté serveur) */
  const openDirectionConversation = useCallback(async () => {
    const res = await messagingService.openDirectionConversation();
    if (res.success && res.data?.id) {
      await loadConversationsRef.current();
      await openConversation(res.data.id);
    } else {
      setError(res.error || "Impossible d'ouvrir la conversation avec la direction");
    }
  }, [openConversation]);

  // ── WebSocket ──
  useEffect(() => {
    if (!user?.id) return;
    let disposed = false;

    StorageService.getToken().then((token) => {
      if (!token || disposed) return;
      const socket = io(API_BASE_URL, {
        auth: { token },
        transports: ['polling', 'websocket'], // polling d'abord (Railway)
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        // Après une reconnexion, réécouter la conversation ouverte
        if (selectedIdRef.current) {
          socket.emit('join-conversation', { conversationId: selectedIdRef.current, userId: user.id });
        }
      });
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));

      socket.on('new-message', (data: { message: Message }) => {
        const message = data?.message;
        if (!message) return;
        if (message.conversationId === selectedIdRef.current) {
          setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message].sort(byDate)));
          if (message.senderId !== user.id) messagingService.markAsRead(message.conversationId);
        }
        const isUnread = message.conversationId !== selectedIdRef.current && message.senderId !== user.id;
        setConversations(prev => prev.map(c => (c.id === message.conversationId
          ? {
            ...c,
            lastMessageAt: message.sentAt,
            _count: { messages: (c._count?.messages || 0) + (isUnread ? 1 : 0) },
          }
          : c)));
      });

      socket.on('new-conversation', () => loadConversationsRef.current());
      socket.on('message-error', (data: { error?: string }) => setError(data?.error || 'Erreur de messagerie'));

      socketRef.current = socket;
    });

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id]);

  // ── Chargement initial + retour au premier plan ──
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') return;
      loadConversationsRef.current();
      if (selectedIdRef.current) openConversation(selectedIdRef.current);
    });
    return () => sub.remove();
  }, [openConversation]);

  return {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    isLoadingMessages,
    isConnected,
    error,
    clearError: () => setError(null),
    loadConversations,
    openConversation,
    closeConversation,
    sendMessage,
    openDirectionConversation,
  };
};

export default useMessaging;
