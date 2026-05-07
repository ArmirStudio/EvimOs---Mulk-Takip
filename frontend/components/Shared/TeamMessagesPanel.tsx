import React, { useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { tr } from '../../app/translations';
import { createThemedStyles, useAppTheme } from '../../app/theme';
import type { TeamMessage, TeamMessageReadStatus } from '../../services/teamTypes';

type DaySeparator = { type: 'day'; label: string; key: string };
type ListItem = TeamMessage | DaySeparator;

type Props = {
  flatListRef?: React.RefObject<FlatList<any>>;
  messages: TeamMessage[];
  loading: boolean;
  error: string | null;
  draft: string;
  submitting: boolean;
  currentUserId?: string | null;
  replyingTo?: TeamMessage | null;
  readStatus?: TeamMessageReadStatus[];
  onChangeDraft: (value: string) => void;
  onRetry: () => void;
  onSend: () => void;
  onReply?: (message: TeamMessage) => void;
  onCancelReply?: () => void;
};

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugün';
  if (d.toDateString() === yesterday.toDateString()) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMessageTime(value?: string | null): string {
  if (!value) return tr.team.messages.now;
  const d = new Date(value);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function buildListItems(messages: TeamMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDay = '';
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: 'day', label: formatDayLabel(msg.created_at), key: `day_${day}` });
      lastDay = day;
    }
    items.push(msg);
  }
  return items;
}

function getReadCount(
  message: TeamMessage,
  readStatus: TeamMessageReadStatus[],
  currentUserId: string
): number {
  return readStatus.filter(
    (r) =>
      r.user_id !== currentUserId &&
      new Date(r.last_read_at) >= new Date(message.created_at)
  ).length;
}

export default function TeamMessagesPanel({
  flatListRef,
  messages,
  loading,
  error,
  draft,
  submitting,
  currentUserId,
  replyingTo,
  readStatus = [],
  onChangeDraft,
  onRetry,
  onSend,
  onReply,
  onCancelReply,
}: Props) {
  const theme = useAppTheme();
  const styles = useStyles();
  const inputRef = useRef<TextInput>(null);

  const listItems = buildListItems(messages);

  const renderStateCard = ({
    icon,
    title,
    description,
    actionLabel,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    description: string;
    actionLabel?: string;
  }) => (
    <View style={styles.stateCard}>
      <MaterialIcons name={icon} size={34} color={theme.colors.textMuted} />
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{description}</Text>
      {actionLabel ? (
        <TouchableOpacity style={styles.secondaryAction} onPress={onRetry}>
          <MaterialIcons name="refresh" size={16} color={theme.colors.primary} />
          <Text style={styles.secondaryActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if ('type' in item && item.type === 'day') {
      return (
        <View style={styles.daySeparatorRow}>
          <View style={styles.daySeparatorLine} />
          <Text style={styles.daySeparatorLabel}>{item.label}</Text>
          <View style={styles.daySeparatorLine} />
        </View>
      );
    }

    const message = item as TeamMessage;
    const isOwn = !!(currentUserId && message.sender_id === currentUserId);
    const readCount = isOwn ? getReadCount(message, readStatus, currentUserId!) : 0;
    const isTemp = message.id.startsWith('temp_');

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onReply?.(message)}
        style={[styles.messageRow, isOwn && styles.messageRowOwn]}
      >
        {!isOwn && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(message.sender_name || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn && (
            <Text style={styles.bubbleSenderName}>
              {message.sender_name || tr.team.messages.authorFallback}
            </Text>
          )}
          {message.reply_to && (
            <View style={styles.replyQuote}>
              <Text style={styles.replyQuoteSender} numberOfLines={1}>
                {message.reply_to.sender_name || tr.team.messages.authorFallback}
              </Text>
              <Text style={styles.replyQuoteBody} numberOfLines={2}>
                {message.reply_to.body}
              </Text>
            </View>
          )}
          <Text style={[styles.bubbleBody, isOwn && styles.bubbleBodyOwn]}>
            {message.body}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
              {formatMessageTime(message.created_at)}
            </Text>
            {isOwn && (
              <View style={styles.readTick}>
                {isTemp ? (
                  <MaterialIcons name="schedule" size={13} color={theme.colors.textMuted} />
                ) : readCount > 0 ? (
                  <>
                    <MaterialIcons name="done-all" size={14} color={theme.colors.primary} />
                  </>
                ) : (
                  <MaterialIcons name="done" size={13} color={theme.colors.textMuted} />
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListContent = () => {
    if (loading && messages.length === 0) {
      return renderStateCard({
        icon: 'forum',
        title: tr.team.messages.loadingTitle,
        description: tr.team.messages.loadingSubtitle,
      });
    }
    if (error && messages.length === 0) {
      return renderStateCard({
        icon: 'forum',
        title: tr.team.messages.errorTitle,
        description: error,
        actionLabel: 'Tekrar dene',
      });
    }
    if (messages.length === 0) {
      return renderStateCard({
        icon: 'forum',
        title: tr.team.messages.emptyTitle,
        description: tr.team.messages.emptySubtitle,
      });
    }
    return null;
  };

  const emptyContent = renderListContent();

  return (
    <View style={styles.container}>
      {error && messages.length > 0 && (
        <View style={styles.inlineWarning}>
          <MaterialIcons name="error-outline" size={18} color={theme.colors.warningText} />
          <Text style={styles.inlineWarningText}>{tr.team.messages.refreshFailed}</Text>
        </View>
      )}

      {emptyContent ? (
        <View style={styles.emptyArea}>{emptyContent}</View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={listItems}
          keyExtractor={(item) => ('type' in item && item.type === 'day' ? (item as DaySeparator).key : (item as TeamMessage).id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {replyingTo && (
        <View style={styles.replyBar}>
          <MaterialIcons name="reply" size={18} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyBarSender} numberOfLines={1}>
              {replyingTo.sender_name || tr.team.messages.authorFallback}
            </Text>
            <Text style={styles.replyBarBody} numberOfLines={1}>
              {replyingTo.body}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.composer}>
        <TextInput
          ref={inputRef}
          style={styles.composerInput}
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={tr.team.messages.composerPlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={2000}
          textAlignVertical="center"
        />
        {draft.trim() ? (
          <TouchableOpacity
            style={[styles.sendBtn, submitting && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <MaterialIcons name="send" size={20} color={theme.colors.textInverse} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderActions}>
            <MaterialIcons name="photo-camera" size={22} color={theme.colors.textMuted} />
            <MaterialIcons name="mic" size={22} color={theme.colors.textMuted} style={{ marginLeft: 14 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyArea: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 4,
    },
    daySeparatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      gap: 8,
    },
    daySeparatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    daySeparatorLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginVertical: 3,
      gap: 8,
    },
    messageRowOwn: {
      flexDirection: 'row-reverse',
    },
    avatarCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    bubble: {
      maxWidth: '76%',
      borderRadius: 18,
      paddingHorizontal: 13,
      paddingVertical: 9,
      gap: 4,
    },
    bubbleOther: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleOwn: {
      backgroundColor: theme.colors.primaryLight,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}33`,
      borderBottomRightRadius: 4,
    },
    bubbleSenderName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 1,
    },
    replyQuote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 8,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: `${theme.colors.primary}11`,
      marginBottom: 4,
      gap: 2,
    },
    replyQuoteSender: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    replyQuoteBody: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    bubbleBody: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    bubbleBodyOwn: {
      color: theme.colors.textPrimary,
    },
    bubbleMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 2,
    },
    bubbleTime: {
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    bubbleTimeOwn: {
      color: theme.colors.textMuted,
    },
    readTick: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inlineWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.warningLight,
    },
    inlineWarningText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.warningText,
      fontWeight: '600',
    },
    stateCard: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 28,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stateTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textPrimary },
    stateText: { fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary, textAlign: 'center' },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.primaryLight,
    },
    secondaryActionText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    replyBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    replyBarSender: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    replyBarBody: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 10,
    },
    composerInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface2,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    placeholderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 8,
    },
  })
);
