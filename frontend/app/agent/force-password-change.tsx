import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createThemedStyles, useAppTheme } from '../theme';
import { useUserData } from '../../hooks/useUserData';
import { supabase } from '../../services/supabase';
import { completeAgentOnboarding } from '../../services/appApi';
import { persistUserData } from '../../services/userSession';
import KeyboardAwareScrollView from '../../components/Shared/KeyboardAwareScrollView';

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: theme.colors.background,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  shieldBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: theme.colors.primary, marginRight: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8 },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  fieldInner: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  fieldIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, letterSpacing: 0.4, marginBottom: 4 },
  fieldInput: { fontSize: 15, fontWeight: '500', color: theme.colors.textPrimary, padding: 0 },
  eyeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: -4, gap: 10 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  matchText: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadows.md,
  },
  submitBtnDisabled: { backgroundColor: theme.colors.surface2, ...theme.shadows.sm },
  submitBtnText: { color: theme.colors.textInverse, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
}));

export default function ForcePasswordChangeScreen() {
  const theme = useAppTheme();
  const s = useStyles();
  const scrollRef = React.useRef<any>(null);
  const newPassRef = React.useRef<TextInput>(null);
  const confirmPassRef = React.useRef<TextInput>(null);
  const { userData } = useUserData();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [strength, setStrength] = useState<0 | 1 | 2 | 3>(0);

  const calcStrength = (pass: string): 0 | 1 | 2 | 3 => {
    if (pass.length === 0) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    return Math.min(score, 3) as 0 | 1 | 2 | 3;
  };

  React.useEffect(() => {
    setStrength(calcStrength(newPass));
  }, [newPass]);

  const strengthColor = [theme.colors.border, theme.colors.error, theme.colors.warning, theme.colors.success][strength];
  const strengthTextColor = [theme.colors.textMuted, theme.colors.errorText, theme.colors.warningText, theme.colors.successText][strength];
  const strengthLabel = ['', 'Zayıf', 'Orta', 'Güçlü'][strength];

  const isMatch = newPass === confirmPass && confirmPass.length > 0;
  const canSubmit = newPass.length >= 8 && isMatch && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (newPass.length < 8) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!isMatch) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
      if (updateError) throw updateError;

      const response = await completeAgentOnboarding();
      if (userData && response.user) {
        const updated = { ...userData, ...response.user };
        await persistUserData(updated);
      }

      router.replace('/agent/dashboard' as never);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Şifre belirlenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <KeyboardAwareScrollView
        scrollRef={scrollRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={s.topBar}>
          <Text style={s.topTitle}>Şifre Oluştur</Text>
        </View>

        <View style={s.heroCard}>
          <View style={s.shieldBox}>
            <MaterialIcons name="shield" size={44} color={theme.colors.primary} />
          </View>
          <Text style={s.heroTitle}>Güvenli Şifrenizi Belirleyin</Text>
          <Text style={s.heroSub}>
            Hesabınız ilk kez kullanıldığı için kişisel şifrenizi oluşturmanız gerekmektedir.
            Bu adım tamamlanmadan uygulamaya erişemezsiniz.
          </Text>
        </View>

        <View style={s.body}>
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionLabel}>YENİ ŞİFRE BELİRLE</Text>
          </View>

          {/* New password */}
          <View style={s.fieldCard}>
            <View style={s.fieldInner}>
              <View style={s.fieldIconBox}>
                <MaterialIcons name="lock-open" size={20} color={theme.colors.primary} />
              </View>
              <View style={s.fieldContent}>
                <Text style={s.fieldLabel}>YENİ ŞİFRE</Text>
                <TextInput
                  ref={newPassRef}
                  style={s.fieldInput}
                  placeholder="En az 8 karakter"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showNew}
                  value={newPass}
                  onChangeText={setNewPass}
                  editable={!saving}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPassRef.current?.focus()}
                />
              </View>
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowNew(v => !v)}>
                <MaterialIcons
                  name={showNew ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Strength bar */}
          {newPass.length > 0 && (
            <View style={s.strengthRow}>
              <View style={s.strengthBars}>
                {[0, 1, 2].map(i => (
                  <View
                    key={i}
                    style={[s.strengthBar, { backgroundColor: i < strength ? strengthColor : theme.colors.border }]}
                  />
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strengthTextColor }]}>{strengthLabel}</Text>
            </View>
          )}

          {/* Confirm password */}
          <View style={s.fieldCard}>
            <View style={s.fieldInner}>
              <View style={s.fieldIconBox}>
                <MaterialIcons name="lock" size={20} color={theme.colors.primary} />
              </View>
              <View style={s.fieldContent}>
                <Text style={s.fieldLabel}>ŞİFRE TEKRAR</Text>
                <TextInput
                  ref={confirmPassRef}
                  style={s.fieldInput}
                  placeholder="Şifrenizi tekrar girin"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showConfirm}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  editable={!saving}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                <MaterialIcons
                  name={showConfirm ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Match banner */}
          {confirmPass.length > 0 && (
            <View style={[s.matchBanner, {
              backgroundColor: isMatch ? theme.colors.successLight : theme.colors.errorLight,
            }]}>
              <MaterialIcons
                name={isMatch ? 'check-circle' : 'cancel'}
                size={20}
                color={isMatch ? theme.colors.success : theme.colors.error}
              />
              <Text style={[s.matchText, {
                color: isMatch ? theme.colors.successText : theme.colors.errorText,
              }]}>
                {isMatch ? 'Şifreler eşleşiyor' : 'Şifreler eşleşmiyor'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <>
                <MaterialIcons
                  name="check"
                  size={18}
                  color={canSubmit ? theme.colors.textInverse : theme.colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <Text style={[s.submitBtnText, !canSubmit && { color: theme.colors.textMuted }]}>
                  Şifremi Belirle ve Devam Et
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
