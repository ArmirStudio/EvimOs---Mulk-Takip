import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { createThemedStyles, useAppTheme } from '../../app/theme';
import type { TeamMeeting } from '../../services/teamTypes';
import { cancelMeeting, completeMeeting, createMeeting } from '../../services/appApi';
import { CompactDatePicker } from './CompactDatePicker';
import WheelTimePickerSheet from './WheelTimePickerSheet';

type Props = {
  meetings: TeamMeeting[];
  loading: boolean;
  error: string | null;
  isManager: boolean;
  onRefresh: () => void;
};

function formatMeetingDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateLabel(value: string): string {
  if (!value) {
    return 'Tarih seçin';
  }

  try {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function MeetingStatusBadge({ status }: { status: TeamMeeting['status'] }) {
  const theme = useAppTheme();
  const config = {
    scheduled: { label: 'Planlandı', color: theme.colors.primary, bg: theme.colors.primaryLight },
    completed: { label: 'Tamamlandı', color: theme.colors.success, bg: theme.colors.successLight },
    cancelled: { label: 'İptal', color: theme.colors.textMuted, bg: theme.colors.surface2 },
  }[status] ?? { label: status, color: theme.colors.textMuted, bg: theme.colors.surface2 };

  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: config.bg }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: config.color }}>{config.label}</Text>
    </View>
  );
}

export default function TeamMeetingsPanel({ meetings, loading, error, isManager, onRefresh }: Props) {
  const theme = useAppTheme();
  const styles = useStyles();

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setScheduledDate('');
    setScheduledTime('09:00');
    setNotes('');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Başlık gerekli', 'Lütfen toplantı başlığını girin.');
      return;
    }
    if (!scheduledDate.trim() || !scheduledTime.trim()) {
      Alert.alert('Tarih/saat gerekli', 'Lütfen toplantı tarih ve saatini seçin.');
      return;
    }

    const [year, month, day] = scheduledDate.split('-');
    const [hour, minute] = scheduledTime.split(':');
    if (!day || !month || !year || !hour || !minute) {
      Alert.alert('Geçersiz format', 'Toplantı tarihi veya saati çözümlenemedi.');
      return;
    }
    const isoDate = new Date(
      Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)
    ).toISOString();

    setSubmitting(true);
    try {
      await createMeeting({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_at: isoDate,
        notes: notes.trim() || null,
      });
      closeModal();
      onRefresh();
    } catch (e: any) {
      Alert.alert('Kaydedilemedi', e?.detail || e?.message || 'Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = (meeting: TeamMeeting) => {
    Alert.alert('Toplantıyı tamamla', `"${meeting.title}" toplantısını tamamlandı olarak işaretlemek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Tamamla',
        onPress: async () => {
          try {
            await completeMeeting(meeting.id);
            onRefresh();
          } catch (e: any) {
            Alert.alert('Hata', e?.detail || e?.message || 'İşlem başarısız.');
          }
        },
      },
    ]);
  };

  const handleCancel = (meeting: TeamMeeting) => {
    Alert.alert('Toplantıyı iptal et', `"${meeting.title}" toplantısını iptal etmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelMeeting(meeting.id);
            onRefresh();
          } catch (e: any) {
            Alert.alert('Hata', e?.detail || e?.message || 'İşlem başarısız.');
          }
        },
      },
    ]);
  };

  const upcoming = meetings.filter(m => m.status === 'scheduled');
  const past = meetings.filter(m => m.status !== 'scheduled');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={32} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isManager && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <MaterialIcons name="add" size={18} color={theme.colors.textInverse} />
          <Text style={styles.addBtnText}>Toplantı Ekle</Text>
        </TouchableOpacity>
      )}

      {meetings.length === 0 && (
        <View style={styles.center}>
          <MaterialIcons name="event-available" size={40} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>Henüz toplantı yok</Text>
          {isManager && (
            <Text style={styles.emptyHint}>Yukarıdaki butona basarak toplantı planlayabilirsiniz.</Text>
          )}
        </View>
      )}

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Yaklaşan</Text>
          {upcoming.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              isManager={isManager}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Geçmiş</Text>
          {past.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              isManager={false}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.sheet}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Yeni Toplantı</Text>
                  <TouchableOpacity onPress={closeModal} disabled={submitting}>
                    <MaterialIcons name="close" size={22} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Başlık *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Toplantı başlığı"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Planlama *</Text>
                <View style={styles.scheduleRow}>
                  <TouchableOpacity style={[styles.selectorField, styles.scheduleField]} onPress={() => setDatePickerVisible(true)}>
                    <Text style={styles.selectorLabel}>Tarih</Text>
                    <Text style={styles.selectorValue}>{formatDateLabel(scheduledDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.selectorField, styles.scheduleField]} onPress={() => setTimePickerVisible(true)}>
                    <Text style={styles.selectorLabel}>Saat</Text>
                    <Text style={styles.selectorValue}>{scheduledTime}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="İsteğe bağlı açıklama"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                />

                <Text style={styles.fieldLabel}>Notlar</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Gündem, hatırlatmalar…"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator color={theme.colors.textInverse} />
                    : <Text style={styles.submitBtnText}>Kaydet</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
      <CompactDatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setScheduledDate}
        currentValue={scheduledDate}
      />
      <WheelTimePickerSheet
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onChange={setScheduledTime}
        value={scheduledTime}
        title="Toplantı saati seçin"
      />
    </View>
  );
}

function MeetingCard({
  meeting,
  isManager,
  onComplete,
  onCancel,
}: {
  meeting: TeamMeeting;
  isManager: boolean;
  onComplete: (m: TeamMeeting) => void;
  onCancel: (m: TeamMeeting) => void;
}) {
  const theme = useAppTheme();
  const styles = useCardStyles();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(v => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.cardRow}>
        <View style={styles.iconBox}>
          <MaterialIcons name="event" size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={expanded ? undefined : 1}>{meeting.title}</Text>
          <Text style={styles.cardDate}>{formatMeetingDate(meeting.scheduled_at)}</Text>
        </View>
        <MeetingStatusBadge status={meeting.status} />
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          {!!meeting.description && <Text style={styles.bodyText}>{meeting.description}</Text>}
          {!!meeting.notes && (
            <View style={styles.notesBox}>
              <MaterialIcons name="sticky-note-2" size={14} color={theme.colors.textMuted} />
              <Text style={styles.notesText}>{meeting.notes}</Text>
            </View>
          )}
          {!!meeting.creator_name && (
            <Text style={styles.creatorText}>Oluşturan: {meeting.creator_name}</Text>
          )}
          {isManager && meeting.status === 'scheduled' && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtnSuccess} onPress={() => onComplete(meeting)}>
                <MaterialIcons name="check-circle-outline" size={16} color={theme.colors.success} />
                <Text style={[styles.actionBtnText, { color: theme.colors.success }]}>Tamamla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnDanger} onPress={() => onCancel(meeting)}>
                <MaterialIcons name="cancel" size={16} color={theme.colors.error} />
                <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>İptal Et</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    container: { paddingBottom: 24 },
    center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
    emptyText: { fontSize: theme.fontSize.base, color: theme.colors.textMuted, textAlign: 'center' },
    emptyHint: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
    retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.primaryLight },
    retryText: { color: theme.colors.primary, fontWeight: theme.fontWeight.bold },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 12, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, paddingHorizontal: 16, paddingVertical: 10 },
    addBtnText: { color: theme.colors.textInverse, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },
    section: { marginBottom: 20 },
    sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
    fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary, marginBottom: 4, marginTop: 12 },
    input: { minHeight: 48, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, paddingHorizontal: 14, fontSize: theme.fontSize.base },
    scheduleRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
    scheduleField: { flex: 1 },
    selectorField: { minHeight: 72, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
    selectorLabel: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    selectorValue: { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
    multiline: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
    submitBtn: { marginTop: 20, minHeight: 52, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: theme.colors.textInverse, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.base },
  })
);

const useCardStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 10 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
    cardDate: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 2 },
    cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: theme.colors.border, gap: 8 },
    bodyText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },
    notesBox: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
    notesText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textMuted, lineHeight: 18 },
    creatorText: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    actionBtnSuccess: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.successLight },
    actionBtnDanger: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.errorLight },
    actionBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },
  })
);
