/**
 * MessagingScreen - Messagerie temps réel (chauffeur et admin/direction)
 * Référence : frontend/src/components/RealTimeMessaging.tsx (titres, expéditeurs, groupes)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../hooks/useMessaging';
import messagingService, { type Conversation, type Message, type ParticipantDirectory } from '../services/messaging.service';
import { isAdminRole } from '../shared/utils/role-helpers';

const DIRECTION_LABEL = 'la direction';

const isGroupConversation = (c: Conversation) =>
  c.type === 'COMMANDE_GROUP' || (c.type === 'PRIVATE' && !!c.chauffeurId && !!c.magasinId);

const formatActivity = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  return isToday(date) ? format(date, 'HH:mm') : format(date, 'dd/MM', { locale: fr });
};

export default function MessagingScreen() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const route = useRoute<any>();
  const {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    isLoadingMessages,
    isConnected,
    error,
    clearError,
    loadConversations,
    openConversation,
    closeConversation,
    sendMessage,
    openDirectionConversation,
  } = useMessaging();

  const [directory, setDirectory] = useState<ParticipantDirectory | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  // Admin : annuaire des interlocuteurs pour titrer les conversations (comme le web)
  useEffect(() => {
    if (isAdmin) messagingService.getParticipantDirectory().then(setDirectory).catch(() => undefined);
  }, [isAdmin]);

  // Ouverture directe depuis une notification push
  const requestedConversationId: string | undefined = route.params?.conversationId;
  useEffect(() => {
    if (requestedConversationId) openConversation(requestedConversationId);
  }, [requestedConversationId, openConversation]);

  const magasinName = (c: Conversation) =>
    c.magasin?.nom || (c.magasinId && directory?.magasins.get(c.magasinId)) || 'Magasin';
  const chauffeurName = (c: Conversation) =>
    (c.chauffeur ? [c.chauffeur.prenom, c.chauffeur.nom].filter(Boolean).join(' ') : '')
    || (c.chauffeurId && directory?.chauffeurs.get(c.chauffeurId)) || 'Chauffeur';

  const getConversationTitle = (c: Conversation): string => {
    if (c.type === 'COMMANDE_GROUP') {
      return c.commande?.numeroCommande ? `Groupe - Commande ${c.commande.numeroCommande}` : (c.name || 'Groupe commande');
    }
    if (c.type === 'MAGASIN_DIRECTION') {
      return isAdmin ? `Discussion avec ${magasinName(c)}` : `Discussion avec ${DIRECTION_LABEL}`;
    }
    if (isGroupConversation(c)) {
      return isAdmin ? `Groupe - ${chauffeurName(c)} ↔ ${magasinName(c)}` : `Groupe - ${magasinName(c)}`;
    }
    if (c.type === 'PRIVATE') {
      if (!isAdmin) return `Discussion avec ${DIRECTION_LABEL}`;
      const other = c.participantIds.find(id => id !== user?.id && id !== 'DIRECTION');
      const name = other && (directory?.magasins.get(other) || directory?.chauffeurs.get(other));
      if (name) return `Discussion avec ${name}`;
    }
    return c.name || 'Conversation';
  };

  const getSenderName = (m: Message, c: Conversation): string => {
    if (m.senderId === user?.id) return 'Moi';
    if (m.senderType === 'SYSTEM') return 'Système';
    if (m.senderType === 'DIRECTION') return 'Direction';
    if (m.senderType === 'MAGASIN') return directory?.magasins.get(m.senderId) || c.magasin?.nom || 'Magasin';
    if (m.senderType === 'CHAUFFEUR') {
      return directory?.chauffeurs.get(m.senderId)
        || (c.chauffeur?.id === m.senderId ? chauffeurName(c) : 'Chauffeur');
    }
    return m.senderType;
  };

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => getConversationTitle(c).toLowerCase().includes(q));
  }, [conversations, search, directory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage(draft);
    setSending(false);
    if (ok) setDraft('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const errorBanner = error ? (
    <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
      <Ionicons name="alert-circle" size={16} color="#B91C1C" />
      <Text style={styles.errorText}>{error}</Text>
    </TouchableOpacity>
  ) : null;

  // ── Fil de discussion ──
  if (selectedConversation) {
    const conv = selectedConversation;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={closeConversation} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.threadTitle} numberOfLines={1}>{getConversationTitle(conv)}</Text>
            {isGroupConversation(conv) && <Text style={styles.groupBadge}>👥 Groupe</Text>}
          </View>
          <View style={[styles.dot, isConnected ? styles.dotOnline : styles.dotOffline]} />
        </View>
        {errorBanner}

        {isLoadingMessages ? (
          <ActivityIndicator style={{ flex: 1 }} color="#E11D48" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun message. Écrivez le premier !</Text>}
            renderItem={({ item }) => {
              const mine = item.senderId === user?.id;
              const system = item.senderType === 'SYSTEM' || item.messageType === 'SYSTEM_NOTIFICATION';
              if (system) {
                return <Text style={styles.systemMessage}>{item.content}</Text>;
              }
              return (
                <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                    {!mine && <Text style={styles.sender}>{getSenderName(item, conv)}</Text>}
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
                    <Text style={[styles.time, mine && styles.timeMine]}>{format(new Date(item.sentAt), 'HH:mm')}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {conv.isActive ? (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Votre message…"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!draft.trim() || sending}
            >
              {sending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="send" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.inactive}>Conversation clôturée</Text>
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── Liste des conversations ──
  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une conversation"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={[styles.dot, isConnected ? styles.dotOnline : styles.dotOffline]} />
      </View>
      {errorBanner}

      {!isAdmin && (
        <TouchableOpacity style={styles.directionButton} onPress={openDirectionConversation}>
          <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.directionButtonText}>Écrire à la direction</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#E11D48" />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={c => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E11D48" colors={['#E11D48']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune conversation</Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = item._count?.messages || 0;
            return (
              <TouchableOpacity style={styles.row} onPress={() => openConversation(item.id)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{isGroupConversation(item) ? '👥' : '💬'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, unread > 0 && styles.rowTitleUnread]} numberOfLines={1}>
                    {getConversationTitle(item)}
                  </Text>
                  {!!item.commande?.numeroCommande && item.type !== 'COMMANDE_GROUP' && (
                    <Text style={styles.rowSub}>Commande {item.commande.numeroCommande}</Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowTime}>{formatActivity(item.lastMessageAt || item.createdAt)}</Text>
                  {unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOnline: { backgroundColor: '#10B981' },
  dotOffline: { backgroundColor: '#EF4444' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { flex: 1, color: '#B91C1C', fontSize: 13 },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E11D48',
  },
  directionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18 },
  rowTitle: { fontSize: 15, color: '#111827' },
  rowTitleUnread: { fontWeight: '700' },
  rowSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowTime: { fontSize: 12, color: '#9CA3AF' },
  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 16 },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  threadTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  groupBadge: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  messagesContent: { padding: 12, gap: 6 },
  systemMessage: { alignSelf: 'center', fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginVertical: 4, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: '#E11D48', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 4 },
  sender: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
  bubbleText: { fontSize: 15, color: '#111827' },
  bubbleTextMine: { color: '#FFFFFF' },
  time: { fontSize: 10, color: '#9CA3AF', alignSelf: 'flex-end', marginTop: 4 },
  timeMine: { color: '#FECDD3' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#FDA4AF' },
  inactive: { textAlign: 'center', padding: 14, color: '#6B7280', backgroundColor: '#FFFFFF' },
});
