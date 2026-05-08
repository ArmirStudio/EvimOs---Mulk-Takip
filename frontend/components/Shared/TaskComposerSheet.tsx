import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { tr } from '../../app/translations';
import { createThemedStyles, useAppTheme } from '../../app/theme';
import {
  createTeamTask,
  getTeamTask,
  listProperties,
  listTeamMembers,
  updateTeamTask,
} from '../../services/appApi';
import type { TeamMember, TeamTaskType } from '../../services/teamTypes';
import { TEAM_TASK_TYPE_OPTIONS } from '../../utils/teamPresentation';
import BottomSheetModal from './BottomSheetModal';

export type TaskComposerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  taskId?: string | null;
  initialAssigneeId?: string | null;
  initialMembers?: TeamMember[];
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function combineDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

const MONTH_NAMES = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
const DAY_NAMES = ['Pt', 'Sa', 'Ca', 'Pe', 'Cu', 'Ct', 'Pa'];
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * 5;
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

function splitDateTime(value?: string | null) {
  if (!value) {
    return { date: '', time: '09:00' };
  }

  const parsed = new Date(value);
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

function formatDateLabel(value: string) {
  if (!value) {
    return tr.team.taskForm.datePlaceholder;
  }

  try {
    const [year, month, day] = value.split('-').map(Number);
    return `${pad(day)}.${pad(month)}.${year}`;
  } catch {
    return value;
  }
}

function parseDateValue(value: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day || 1);
}

function formatDateValue(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function parseTimeValue(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  return {
    hour: Math.min(Math.max(Number(hourRaw) || 9, 0), 23),
    minute: Math.min(Math.max(Number(minuteRaw) || 0, 0), 59),
  };
}

export default function TaskComposerSheet({
  visible,
  onClose,
  onSaved,
  taskId,
  initialAssigneeId,
  initialMembers = [],
}: TaskComposerSheetProps) {
  const theme = useAppTheme();
  const styles = useStyles();
  const editing = !!taskId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [draftHour, setDraftHour] = useState(9);
  const [draftMinute, setDraftMinute] = useState(0);
  const [employees, setEmployees] = useState<TeamMember[]>(() => initialMembers.filter((member) => member.role === 'employee'));
  const [properties, setProperties] = useState<any[]>([]);

  const [taskType, setTaskType] = useState<TeamTaskType>('property_showing');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [repeatEnabled, setRepeatEnabled] = useState(false);

  const isShowing = taskType === 'property_showing';
  const selectedAssignee = useMemo(
    () => employees.find((member) => member.id === assigneeId) || null,
    [assigneeId, employees]
  );

  const resetForm = useCallback(() => {
    setTaskType('property_showing');
    setTitle('');
    setAssigneeId(initialAssigneeId || '');
    setAssigneePickerOpen(false);
    setPropertyId('');
    setCustomerName('');
    setCustomerPhone('');
    setDate(new Date().toISOString().slice(0, 10));
    setTime('09:00');
    setRepeatEnabled(false);
  }, [initialAssigneeId]);

  useEffect(() => {
    if (!visible || taskId) {
      return;
    }

    setEmployees(initialMembers.filter((member) => member.role === 'employee'));
  }, [initialMembers, taskId, visible]);

  const loadData = useCallback(async () => {
    if (!visible) {
      return;
    }

    try {
      if (!taskId) {
        resetForm();
        setLoading(false);

        Promise.all([
          initialMembers.length ? Promise.resolve({ members: initialMembers }) : listTeamMembers(),
          listProperties(),
        ])
          .then(([memberResponse, propertyResponse]) => {
            setEmployees((memberResponse.members || []).filter((member: TeamMember) => member.role === 'employee'));
            setProperties(propertyResponse.properties || []);
          })
          .catch(() => {
            setEmployees(initialMembers.filter((member) => member.role === 'employee'));
            setProperties([]);
          });
        return;
      }

      setLoading(true);
      const [memberResponse, propertyResponse, task] = await Promise.all([
        listTeamMembers(),
        listProperties(),
        getTeamTask(taskId),
      ]);

      setEmployees((memberResponse.members || []).filter((member: TeamMember) => member.role === 'employee'));
      setProperties(propertyResponse.properties || []);

      if (task) {
        const next = splitDateTime(task.scheduled_at);
        setTaskType(task.task_type);
        setTitle(task.title || '');
        setAssigneeId(task.assignee_id || '');
        setPropertyId(task.property_id || '');
        setCustomerName(task.customer_name || '');
        setCustomerPhone(task.customer_phone || '');
        setDate(next.date);
        setTime(next.time);
        setRepeatEnabled(!!task.repeat_enabled);
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Görev formu yüklenemedi.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [initialMembers, onClose, resetForm, taskId, visible]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!visible) {
      resetForm();
      setEmployees([]);
      setProperties([]);
    }
  }, [resetForm, visible]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !date || !time) return false;
    if (isShowing && (!propertyId || !customerName.trim() || !customerPhone.trim())) return false;
    return true;
  }, [customerName, customerPhone, date, isShowing, propertyId, time, title]);

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setSaving(true);
      const payload: {
        assignee_id: string | null;
        task_type: TeamTaskType;
        title: string;
        description?: string | null;
        property_id: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        scheduled_at: string;
        repeat_enabled: boolean;
      } = {
        assignee_id: assigneeId || null,
        task_type: taskType,
        title: title.trim(),
        property_id: isShowing ? propertyId : null,
        customer_name: isShowing ? customerName.trim() : null,
        customer_phone: isShowing ? customerPhone.trim() : null,
        scheduled_at: combineDateTime(date, time),
        repeat_enabled: repeatEnabled,
      };

      if (!taskId) {
        payload.description = null;
      }

      if (taskId) {
        await updateTeamTask(taskId, payload);
      } else {
        await createTeamTask(payload);
      }

      await onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Görev kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const openDatePicker = () => {
    setCalendarDate(parseDateValue(date));
    setDatePickerVisible(true);
  };

  const openTimePicker = () => {
    const parsed = parseTimeValue(time);
    setDraftHour(parsed.hour);
    setDraftMinute(Math.min(Math.round(parsed.minute / 5) * 5, 55));
    setTimePickerVisible(true);
  };

  const closeInlinePicker = () => {
    setDatePickerVisible(false);
    setTimePickerVisible(false);
  };

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
  const selectedDate = parseDateValue(date);

  const changeCalendarMonth = (delta: number) => {
    setCalendarDate(new Date(calendarYear, calendarMonth + delta, 1));
  };

  const selectCalendarDay = (day: number) => {
    setDate(formatDateValue(calendarYear, calendarMonth, day));
    setDatePickerVisible(false);
  };

  const applyTime = () => {
    setTime(`${pad(draftHour)}:${pad(draftMinute)}`);
    setTimePickerVisible(false);
  };

  const renderWheelItem = (
    item: number,
    selectedValue: number,
    onChange: (value: number) => void,
  ) => {
    const selected = item === selectedValue;
    return (
      <TouchableOpacity style={styles.wheelItem} onPress={() => onChange(item)}>
        <Text style={[styles.wheelItemText, selected && styles.wheelItemTextActive]}>{pad(item)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <BottomSheetModal visible={visible} onClose={saving ? () => undefined : onClose} maxHeightRatio={0.96}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <View style={styles.sheetRoot}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>OFİS GÖREV AKIŞI</Text>
                <Text style={styles.title}>{editing ? tr.team.taskForm.editTitle : tr.team.taskForm.createTitle}</Text>
                <Text style={styles.subtitle}>Duyuru ekranına benzer tek yüzeyden görev oluşturun ve yönetin.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={saving}>
                <MaterialIcons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <>
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.panel}>
                    <Text style={styles.sectionTitle}>{tr.team.taskForm.taskTypeTitle}</Text>
                    <View style={styles.chipGrid}>
                      {TEAM_TASK_TYPE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[styles.chip, taskType === option.key && styles.chipActive]}
                          onPress={() => setTaskType(option.key)}
                        >
                          <MaterialIcons
                            name={option.icon as never}
                            size={18}
                            color={taskType === option.key ? theme.colors.textInverse : theme.colors.primary}
                          />
                          <Text style={[styles.chipText, taskType === option.key && styles.chipTextActive]}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.panel}>
                    <Text style={styles.sectionTitle}>Başlık</Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder={tr.team.taskForm.titlePlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <View style={styles.panel}>
                    <TouchableOpacity
                      style={styles.assigneeHeader}
                      onPress={() => setAssigneePickerOpen((current) => !current)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.assigneeHeaderText}>
                        <Text style={styles.sectionTitle}>Atanacak kişi (opsiyonel)</Text>
                        <Text style={styles.assigneeValue}>{selectedAssignee?.full_name || 'Henüz kişi seçilmedi'}</Text>
                      </View>
                      <MaterialIcons
                        name={assigneePickerOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={24}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    {assigneePickerOpen && (
                      <View style={styles.assigneeCard}>
                        {employees.length === 0 ? (
                          <Text style={styles.emptyAssigneeText}>Ekip üyesi bulunamadı.</Text>
                        ) : (
                          employees.map((member) => {
                            const selected = assigneeId === member.id;
                            return (
                              <TouchableOpacity
                                key={member.id}
                                style={[styles.memberOption, selected && styles.memberOptionActive]}
                                onPress={() => setAssigneeId(selected ? '' : member.id)}
                                activeOpacity={0.85}
                              >
                                <View style={styles.memberAvatar}>
                                  <Text style={styles.memberAvatarText}>{(member.full_name || '?').slice(0, 2).toUpperCase()}</Text>
                                </View>
                                <View style={styles.memberOptionText}>
                                  <Text style={styles.memberName}>{member.full_name}</Text>
                                  <Text style={styles.memberMeta}>{member.email || member.phone || 'Ekip üyesi'}</Text>
                                </View>
                                {selected && <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />}
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.panel}>
                    <Text style={styles.sectionTitle}>{tr.team.taskForm.scheduleTitle}</Text>
                    <View style={styles.scheduleRow}>
                      <TouchableOpacity style={[styles.selectorField, styles.scheduleField]} onPress={openDatePicker}>
                        <Text style={styles.selectorLabel}>Tarih</Text>
                        <Text style={styles.selectorValue}>{formatDateLabel(date)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.selectorField, styles.scheduleField]} onPress={openTimePicker}>
                        <Text style={styles.selectorLabel}>Saat</Text>
                        <Text style={styles.selectorValue}>{time}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isShowing && (
                    <View style={styles.panel}>
                      <Text style={styles.sectionTitle}>{tr.team.taskForm.showingTitle}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {properties.map((property) => (
                          <TouchableOpacity
                            key={property.id}
                            style={[styles.chip, propertyId === property.id && styles.chipActive]}
                            onPress={() => setPropertyId(property.id)}
                          >
                            <Text style={[styles.chipText, propertyId === property.id && styles.chipTextActive]}>
                              {property.address || property.description || 'Mülk'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TextInput
                        style={styles.input}
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder={tr.team.taskForm.customerNamePlaceholder}
                        placeholderTextColor={theme.colors.textMuted}
                      />
                      <TextInput
                        style={styles.input}
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder={tr.team.taskForm.customerPhonePlaceholder}
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>
                  )}

                  <View style={styles.panel}>
                    <View style={styles.switchRow}>
                      <View style={styles.switchText}>
                        <Text style={styles.sectionTitle}>{tr.team.taskForm.repeatLabel}</Text>
                        <Text style={styles.switchHint}>Planlı tekrar gerektiren saha ve ofis rutinleri için açın.</Text>
                      </View>
                      <Switch
                        value={repeatEnabled}
                        onValueChange={setRepeatEnabled}
                        trackColor={{ false: '#D4D4D4', true: theme.colors.primary }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#D4D4D4"
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.submitButton, (!canSubmit || saving) && styles.submitButtonDisabled]}
                    onPress={submit}
                    disabled={!canSubmit || saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={theme.colors.textInverse} />
                    ) : (
                      <Text style={styles.submitButtonText}>{editing ? tr.team.taskForm.updateAction : tr.team.taskForm.createAction}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
            {(datePickerVisible || timePickerVisible) && (
              <View style={styles.inlinePickerLayer}>
                <Pressable style={styles.inlinePickerBackdrop} onPress={closeInlinePicker} />
                {datePickerVisible ? (
                  <View style={styles.inlinePickerCard}>
                    <View style={styles.inlinePickerHeader}>
                      <Text style={styles.inlinePickerTitle}>Tarih seçin</Text>
                      <TouchableOpacity style={styles.inlineCloseButton} onPress={closeInlinePicker}>
                        <MaterialIcons name="close" size={20} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity style={styles.calendarNav} onPress={() => changeCalendarMonth(-1)}>
                        <MaterialIcons name="chevron-left" size={22} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.calendarTitle}>{MONTH_NAMES[calendarMonth]} {calendarYear}</Text>
                      <TouchableOpacity style={styles.calendarNav} onPress={() => changeCalendarMonth(1)}>
                        <MaterialIcons name="chevron-right" size={22} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dayNameRow}>
                      {DAY_NAMES.map((dayName) => (
                        <Text key={dayName} style={styles.dayNameText}>{dayName}</Text>
                      ))}
                    </View>
                    <View style={styles.daysGrid}>
                      {Array.from({ length: emptyDays }).map((_, index) => (
                        <View key={`empty-${index}`} style={styles.dayCell} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        const selected =
                          selectedDate.getDate() === day &&
                          selectedDate.getMonth() === calendarMonth &&
                          selectedDate.getFullYear() === calendarYear;
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[styles.dayCell, selected && styles.dayCellActive]}
                            onPress={() => selectCalendarDay(day)}
                          >
                            <Text style={[styles.dayCellText, selected && styles.dayCellTextActive]}>{day}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={styles.inlinePickerCard}>
                    <View style={styles.inlinePickerHeader}>
                      <Text style={styles.inlinePickerTitle}>Saat seçin</Text>
                      <TouchableOpacity style={styles.inlineCloseButton} onPress={closeInlinePicker}>
                        <MaterialIcons name="close" size={20} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.timePreview}>
                      <Text style={styles.timePreviewLabel}>Seçilen saat</Text>
                      <Text style={styles.timePreviewValue}>{pad(draftHour)}:{pad(draftMinute)}</Text>
                    </View>
                    <View style={styles.timeWheelRow}>
                      <View style={styles.timeWheelColumn}>
                        <Text style={styles.timeWheelLabel}>Saat</Text>
                        <FlatList
                          data={Array.from({ length: 24 }, (_, index) => index)}
                          keyExtractor={(item) => `hour-${item}`}
                          renderItem={({ item }) => renderWheelItem(item, draftHour, setDraftHour)}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={WHEEL_ITEM_HEIGHT}
                          initialScrollIndex={draftHour}
                          getItemLayout={(_, index) => ({ length: WHEEL_ITEM_HEIGHT, offset: WHEEL_ITEM_HEIGHT * index, index })}
                          style={styles.timeWheelList}
                          contentContainerStyle={styles.timeWheelContent}
                          onMomentumScrollEnd={(event) => {
                            const next = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
                            setDraftHour(Math.min(Math.max(next, 0), 23));
                          }}
                        />
                      </View>
                      <Text style={styles.timeSeparator}>:</Text>
                      <View style={styles.timeWheelColumn}>
                        <Text style={styles.timeWheelLabel}>Dakika</Text>
                        <FlatList
                          data={MINUTE_OPTIONS}
                          keyExtractor={(item) => `minute-${item}`}
                          renderItem={({ item }) => renderWheelItem(item, draftMinute, setDraftMinute)}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={WHEEL_ITEM_HEIGHT}
                          initialScrollIndex={Math.min(Math.max(Math.round(draftMinute / 5), 0), MINUTE_OPTIONS.length - 1)}
                          getItemLayout={(_, index) => ({ length: WHEEL_ITEM_HEIGHT, offset: WHEEL_ITEM_HEIGHT * index, index })}
                          style={styles.timeWheelList}
                          contentContainerStyle={styles.timeWheelContent}
                          onMomentumScrollEnd={(event) => {
                            const next = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT) * 5;
                            setDraftMinute(Math.min(Math.max(next, 0), 55));
                          }}
                        />
                      </View>
                    </View>
                    <TouchableOpacity style={styles.applyTimeButton} onPress={applyTime}>
                      <Text style={styles.applyTimeText}>Saati Uygula</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </BottomSheetModal>

    </>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    sheetRoot: { flex: 1, position: 'relative' },
    header: {
      flexDirection: 'row',
      gap: 14,
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 14,
    },
    headerText: { flex: 1 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      marginTop: 6,
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textSecondary,
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface2,
      marginTop: 4,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 24,
      gap: 14,
    },
    panel: {
      gap: 12,
      borderRadius: 22,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    assigneeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    assigneeHeaderText: { flex: 1, gap: 4 },
    assigneeValue: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
    assigneeCard: {
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    emptyAssigneeText: { fontSize: 13, color: theme.colors.textMuted },
    memberOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 58,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    memberOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    memberAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface2,
    },
    memberAvatarText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
    memberOptionText: { flex: 1 },
    memberName: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
    memberMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    input: {
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipRow: {
      gap: 8,
      paddingRight: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: theme.colors.textInverse,
    },
    scheduleRow: {
      flexDirection: 'row',
      gap: 10,
    },
    scheduleField: {
      flex: 1,
    },
    selectorField: {
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 6,
    },
    selectorLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    selectorValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    switchText: {
      flex: 1,
      gap: 6,
    },
    switchHint: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    footer: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 6,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    submitButton: {
      minHeight: 54,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    submitButtonDisabled: {
      opacity: 0.48,
    },
    submitButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textInverse,
    },
    inlinePickerLayer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.modalBackdrop,
      zIndex: 10,
    },
    inlinePickerBackdrop: { ...StyleSheet.absoluteFillObject },
    inlinePickerCard: {
      marginHorizontal: 12,
      marginBottom: 10,
      borderRadius: 24,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.lg,
    },
    inlinePickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12,
    },
    inlinePickerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: theme.colors.textPrimary },
    inlineCloseButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface2,
    },
    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryLight,
      marginBottom: 10,
    },
    calendarNav: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    calendarTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.primary },
    dayNameRow: { flexDirection: 'row', marginBottom: 6 },
    dayNameText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: theme.colors.textMuted },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
    dayCellActive: { backgroundColor: theme.colors.primary },
    dayCellText: { fontSize: 13, color: theme.colors.textPrimary, fontWeight: '700' },
    dayCellTextActive: { color: theme.colors.textInverse },
    timePreview: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    timePreviewLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.textMuted, textTransform: 'uppercase' },
    timePreviewValue: { marginTop: 4, fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary },
    timeWheelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeWheelColumn: { flex: 1, alignItems: 'center', gap: 8 },
    timeWheelLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.textSecondary },
    timeWheelList: {
      width: '100%',
      height: WHEEL_HEIGHT,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    timeWheelContent: { paddingVertical: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2 },
    wheelItem: { height: WHEEL_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
    wheelItemText: { fontSize: 20, fontWeight: '700', color: theme.colors.textMuted },
    wheelItemTextActive: { color: theme.colors.textPrimary, fontWeight: '800' },
    timeSeparator: { marginTop: 22, fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary },
    applyTimeButton: {
      minHeight: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      marginTop: 14,
    },
    applyTimeText: { fontSize: 14, fontWeight: '800', color: theme.colors.textInverse },
  }),
);
