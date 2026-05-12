import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createThemedStyles, useAppTheme } from './theme';
import { acceptLegalTerms } from '../services/appApi';
import { persistUserData, type UserData } from '../services/userSession';
import { signOut, useUserData } from '../hooks/useUserData';

function routeForRole(role?: string | null) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'agent' || role === 'employee') return '/agent/dashboard';
  if (role === 'landlord') return '/landlord/dashboard';
  return '/tenant/dashboard';
}

export default function LegalAcceptanceScreen() {
  const theme = useAppTheme();
  const styles = useStyles();
  const { userData, loading } = useUserData();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayName = useMemo(
    () => userData?.full_name || userData?.email || 'Kullanici',
    [userData?.email, userData?.full_name]
  );

  const handleAccept = async () => {
    if (!accepted || submitting) return;
    setSubmitting(true);
    try {
      const response = await acceptLegalTerms();
      const nextUserData = {
        ...(userData || {}),
        ...(response.user || {}),
        terms_accepted_at: response.user?.terms_accepted_at,
        first_login: false,
      } as UserData;
      await persistUserData(nextUserData);
      router.replace(routeForRole(nextUserData.role) as never);
    } catch (error: any) {
      Alert.alert('Hata', error?.detail || error?.message || 'Kabul kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="document-text-outline" size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Kullanim sartlari ve gizlilik</Text>
          <Text style={styles.subtitle}>
            {displayName}, devam etmek icin uygulama kosullarini okuyup kabul etmeniz gerekir.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kullanim Sartlari</Text>
          <Text style={styles.bodyText}>
            EvimOs, mulk, kira, dekont, bakim ve ekip kayitlarini rolunuze gore yonetmenizi saglar.
            Hesabinizla yapilan islemler size veya yetkili oldugunuz ofise baglanir. Yanlis, eksik
            veya size ait olmayan kayit olusturmamak sizin sorumlulugunuzdadir.
          </Text>
          <Text style={styles.sectionTitle}>Gizlilik</Text>
          <Text style={styles.bodyText}>
            Kisisel bilgiler, iletisim bilgileri, mulk kayitlari, belgeler ve operasyon hareketleri
            yalnizca uygulama islevleri, yetki kontrolu ve destek surecleri icin kullanilir. Yetkiniz
            olmayan kayitlara erisim kisitlanir.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted((value) => !value)}
          activeOpacity={0.85}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
        >
          <Ionicons
            name={accepted ? 'checkbox' : 'square-outline'}
            size={24}
            color={accepted ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text style={styles.checkText}>Okudum, anladim ve kabul ediyorum.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, (!accepted || submitting) && styles.disabled]}
          onPress={handleAccept}
          disabled={!accepted || submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>Devam Et</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Cikis yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flexGrow: 1, padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.lg },
    header: { gap: theme.spacing.sm },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
    subtitle: { fontSize: theme.fontSize.base, lineHeight: 22, color: theme.colors.textSecondary },
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
    bodyText: { fontSize: theme.fontSize.sm, lineHeight: 21, color: theme.colors.textSecondary },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      minHeight: 56,
    },
    checkText: { flex: 1, fontSize: theme.fontSize.base, color: theme.colors.textPrimary, fontWeight: theme.fontWeight.semibold },
    primaryButton: {
      minHeight: 56,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: { color: theme.colors.textInverse, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold },
    secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    secondaryButtonText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
    disabled: { opacity: 0.55 },
  })
);
