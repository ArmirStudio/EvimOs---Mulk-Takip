import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { createThemedStyles, useAppTheme } from '../theme';
import { listTeamMessages, createTeamMessage, markMessagesRead, getMessageReadStatus } from '../../services/appApi';
import { useUserData } from '../../hooks/useUserData';
import type { TeamMessage, TeamMessageReadStatus } from '../../services/teamTypes';
import TeamMessagesPanel from '../../components/Shared/TeamMessagesPanel';

export default function TeamMessagesScreen() {
  const theme = useAppTheme();
  const styles = useStyles();
  const { userData } = useUserData();

  const flatListRef = useRef<FlatList<any>>(null);

  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null);
  const [readStatus, setReadStatus] = useState<TeamMessageReadStatus[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [msgRes, readRes] = await Promise.all([
        listTeamMessages(),
        getMessageReadStatus(),
      ]);
      setMessages((msgRes.messages as TeamMessage[]) || []);
      setReadStatus((readRes.readers as TeamMessageReadStatus[]) || []);
    } catch (e: any) {
      setError(e?.message || 'Mesajlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void markMessagesRead().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 80);
    }
  }, [messages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || submitting) return;

    setDraft('');
    const replyId = replyingTo?.id ?? null;
    setReplyingTo(null);

    const tempId = `temp_${Date.now()}`;
    const tempMessage: TeamMessage = {
      id: tempId,
      office_owner_id: '',
      sender_id: userData?.id ?? null,
      body,
      created_at: new Date().toISOString(),
      sender_name: userData?.full_name ?? 'Sen',
      reply_to_id: replyId,
      reply_to: replyingTo
        ? { id: replyingTo.id, body: replyingTo.body, sender_name: replyingTo.sender_name ?? null }
        : null,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 60);

    setSubmitting(true);
    try {
      await createTeamMessage({ body, reply_to_id: replyId });
      const res = await listTeamMessages();
      setMessages((res.messages as TeamMessage[]) || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 80);
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setReplyingTo(replyId ? messages.find((m) => m.id === replyId) ?? null : null);
      Alert.alert('Gönderilemedi', e?.message || 'Mesaj gönderilemedi. Tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Ekip Mesajları</Text>
        <View style={styles.backBtn} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TeamMessagesPanel
          flatListRef={flatListRef}
          messages={messages}
          loading={loading}
          error={error}
          draft={draft}
          submitting={submitting}
          currentUserId={userData?.id}
          replyingTo={replyingTo}
          readStatus={readStatus}
          onChangeDraft={setDraft}
          onRetry={() => void load()}
          onSend={() => void handleSend()}
          onReply={setReplyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.textPrimary,
    },
  })
);
