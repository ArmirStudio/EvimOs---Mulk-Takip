import React, { useState } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  const { userData } = useUserData();
  const [termsOpen, setTermsOpen] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canContinue = acceptedTerms && acceptedKvkk && !submitting;

  const handleAccept = async () => {
    if (!canContinue) return;
    const isFirstLoginAgent = userData?.role === 'agent' && userData?.first_login === true;
    setSubmitting(true);
    try {
      const response = await acceptLegalTerms();
      const nextUserData = {
        ...(userData || {}),
        ...(response.user || {}),
        terms_accepted_at: response.user?.terms_accepted_at,
      } as UserData;
      await persistUserData(nextUserData);
      if (isFirstLoginAgent) {
        router.replace('/agent/force-password-change' as never);
      } else {
        router.replace(routeForRole(nextUserData.role) as never);
      }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.iconBox}>
            <MaterialIcons name="gavel" size={30} color={theme.colors.primary} />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>Armir Studio</Text>
            <View style={styles.brandDot} />
            <Text style={styles.appName}>EvimOs — Mülk Yönetim</Text>
          </View>
          <Text style={styles.title}>Kullanım Koşulları ve Gizlilik</Text>
          <Text style={styles.subtitle}>
            Uygulamaya devam etmek için aşağıdaki koşulları okuyup her ikisini de onaylamanız gerekmektedir.
          </Text>
        </View>

        {/* Kullanım Koşulları */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setTermsOpen(v => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionIconBox}>
              <MaterialIcons name="description" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Kullanım Koşulları</Text>
            <MaterialIcons
              name={termsOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          {termsOpen && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>
                <Text style={styles.boldText}>1. Genel Hükümler{'\n'}</Text>
                Bu uygulama, Armir Studio tarafından geliştirilen EvimOs — Mülk Yönetim platformudur. Uygulamayı
                kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.{'\n\n'}

                <Text style={styles.boldText}>2. Hesap Sorumluluğu{'\n'}</Text>
                Hesabınızla gerçekleştirilen tüm işlemler size aittir. Hesap bilgilerinizi üçüncü şahıslarla
                paylaşmamanız, şifrenizi düzenli olarak güncellemeniz ve yetkisiz erişim durumunda Armir Studio'yu
                derhal bilgilendirmeniz gerekmektedir.{'\n\n'}

                <Text style={styles.boldText}>3. Platform Kullanımı{'\n'}</Text>
                EvimOs; mülk, kira, dekont, bakım ve ekip kayıtlarını rolünüze göre yönetmenizi sağlar. Yanlış,
                eksik veya size ait olmayan kayıt oluşturmamak sizin sorumluluğunuzdadır. Platform yalnızca yasal
                amaçlarla kullanılabilir.{'\n\n'}

                <Text style={styles.boldText}>4. Fikri Mülkiyet{'\n'}</Text>
                Uygulama içeriği, tasarımı, yazılımı ve tüm bileşenleri Armir Studio'nun fikri mülkiyetidir.
                İzinsiz kopyalanması, dağıtılması veya değiştirilmesi yasaktır.{'\n\n'}

                <Text style={styles.boldText}>5. Hizmet Değişiklikleri{'\n'}</Text>
                Armir Studio, önceden haber vermeksizin platformda değişiklik yapma, hizmetleri askıya alma veya
                sonlandırma hakkını saklı tutar. Kullanım koşullarında yapılacak değişiklikler uygulama içinden
                bildirilecektir.{'\n\n'}

                <Text style={styles.boldText}>6. Sorumluluk Sınırlaması{'\n'}</Text>
                Platform "olduğu gibi" sunulmaktadır. Armir Studio, teknik aksaklıklar, veri kaybı veya platform
                kullanımından doğan dolaylı zararlardan sorumlu tutulamaz.
              </Text>
            </View>
          )}
        </View>

        {/* KVKK */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setKvkkOpen(v => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.sectionIconBox, styles.kvkkIconBox]}>
              <MaterialIcons name="security" size={20} color={theme.colors.copper} />
            </View>
            <Text style={styles.sectionTitle}>KVKK / Gizlilik Politikası</Text>
            <MaterialIcons
              name={kvkkOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          {kvkkOpen && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>
                <Text style={styles.boldText}>Veri Sorumlusu{'\n'}</Text>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla
                hareket eden Armir Studio, kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda işlemektedir.{'\n\n'}

                <Text style={styles.boldText}>İşlenen Kişisel Veriler{'\n'}</Text>
                • Ad, soyad, e-posta adresi, telefon numarası{'\n'}
                • Konum bilgileri (şehir, ilçe){'\n'}
                • Mülk ve kira kayıtları, dekontlar{'\n'}
                • Uygulama içi işlem geçmişi ve operasyon hareketleri{'\n'}
                • Profil fotoğrafı ve iletişim tercihleri{'\n\n'}

                <Text style={styles.boldText}>Veri İşleme Amaçları{'\n'}</Text>
                Kişisel verileriniz; uygulama işlevlerinin yerine getirilmesi, yetki kontrolü, müşteri desteği,
                yasal yükümlülüklerin karşılanması ve hizmet kalitesinin iyileştirilmesi amacıyla işlenmektedir.{'\n\n'}

                <Text style={styles.boldText}>Veri Güvenliği{'\n'}</Text>
                Verileriniz, endüstri standardı şifreleme ve güvenlik önlemleriyle korunmaktadır. Yetkisiz erişime
                karşı teknik ve idari tedbirler alınmaktadır. Verileriniz üçüncü taraflarla yalnızca yasal
                zorunluluk veya açık rızanız bulunduğu durumlarda paylaşılmaktadır.{'\n\n'}

                <Text style={styles.boldText}>Haklarınız (KVKK Madde 11){'\n'}</Text>
                Kişisel verilerinize ilişkin; bilgi talep etme, düzeltme isteme, silme veya yok etme talep etme,
                işlemeye itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Bu haklarınızı
                kullanmak için destek@armirstudio.com adresine başvurabilirsiniz.{'\n\n'}

                <Text style={styles.boldText}>Veri Saklama Süresi{'\n'}</Text>
                Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve hizmet ilişkisinin devamı süresince
                saklanmaktadır. İlişkinin sona ermesinin ardından yasal yükümlülükler kapsamında belirlenen
                süreler dışında silinmektedir.
              </Text>
            </View>
          )}
        </View>

        {/* Checkboxes */}
        <TouchableOpacity
          style={[styles.checkRow, acceptedTerms && styles.checkRowActive]}
          onPress={() => setAcceptedTerms(v => !v)}
          activeOpacity={0.85}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
        >
          <Ionicons
            name={acceptedTerms ? 'checkbox' : 'square-outline'}
            size={24}
            color={acceptedTerms ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text style={styles.checkText}>
            Kullanım Koşullarını okudum, anladım ve kabul ediyorum.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkRow, acceptedKvkk && styles.checkRowActive]}
          onPress={() => setAcceptedKvkk(v => !v)}
          activeOpacity={0.85}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedKvkk }}
        >
          <Ionicons
            name={acceptedKvkk ? 'checkbox' : 'square-outline'}
            size={24}
            color={acceptedKvkk ? theme.colors.copper : theme.colors.textMuted}
          />
          <Text style={styles.checkText}>
            KVKK kapsamında kişisel verilerimin işlenmesine onay veriyorum.
          </Text>
        </TouchableOpacity>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.primaryButton, !canContinue && styles.disabled]}
          onPress={handleAccept}
          disabled={!canContinue}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Devam Et</Text>
              <MaterialIcons name="arrow-forward" size={20} color={theme.colors.textInverse} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    scroll: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 40,
      gap: 14,
    },
    headerBox: {
      gap: 8,
      paddingBottom: 4,
    },
    iconBox: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    brandDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.colors.copper,
    },
    appName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textSecondary,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 18,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    sectionIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kvkkIconBox: {
      backgroundColor: '#FDF4EC',
    },
    sectionTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: 0.1,
    },
    sectionBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 2,
    },
    bodyText: {
      fontSize: 13,
      lineHeight: 21,
      color: theme.colors.textSecondary,
    },
    boldText: {
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 14,
      padding: 14,
      minHeight: 56,
      ...theme.shadows.sm,
    },
    checkRowActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    checkText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textPrimary,
      fontWeight: '600',
      lineHeight: 20,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 4,
      ...theme.shadows.md,
    },
    primaryButtonText: {
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    secondaryButton: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    disabled: { opacity: 0.45 },
  })
);
