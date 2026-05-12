import { Ionicons } from '@expo/vector-icons';
import type { AppThemeTokens } from '../app/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export const brand = {
  appName: 'EvimOs',
  fullName: 'EvimOs - Mülk Yönetim',
  shortTitle: 'Mülk Yönetim',
  tagline: 'Sakin, görünür ve güvenilir mülk yönetimi',
  heroEyebrow: 'Operasyonları sadeleştirin',
  heroTitle: 'Kira, bakım ve belge akışını tek merkezde toplayın.',
  heroSubtitle:
    'EvimOs, emlak ofisi, ev sahibi ve kiracı arasındaki günlük mülk operasyonlarını sakin, görünür ve güvenilir bir akışta birleştirir.',
  heroFootnote: 'Tek oturum. Tek operasyon zemini. Daha az dağınıklık.',
  loginEyebrow: 'Güvenli giriş',
  loginTitle: 'Yetkili kullanıcılar için tek erişim noktası.',
  loginSubtitle:
    'Ofis ekibi, ev sahipleri ve kiracılar aynı marka dili içinde kendi panellerine buradan ulaşır.',
  loginHelper:
    'Makbuz, bakım, ekip ve belge hareketleri oturum açtıktan sonra rolünüze göre şekillenir.',
} as const;

export const brandColors = {
  // Logo colors
  copperDark: '#8B6F47',
  copperMain: '#C8925A',
  copperLight: '#D4A574',
  greenDark: '#2D6A4F',
  greenMain: '#40916C',
  greenLight: '#52B788',
  brownDark: '#6B5C4D',
} as const;

export const publicSurface: Record<string, string> = {
  heroPanel: '#F4EEE4',
  heroPanelStrong: '#ECE3D8',
  heroTint: 'rgba(35, 83, 83, 0.08)',
  heroTintStrong: 'rgba(35, 83, 83, 0.14)',
  accentSoft: '#EADBC7',
  accentStrong: '#C8925A',
  panel: '#FFFDFC',
  panelBorder: 'rgba(35, 83, 83, 0.12)',
  panelShadow: 'rgba(28, 28, 24, 0.08)',
  chipBg: '#E8F0EF',
  chipText: '#235353',
  warmText: '#6B5C4D',
  fieldBg: '#FFFCF8',
  fieldBorder: '#D6DDD8',
  fieldFocus: '#235353',
  fieldDangerBg: '#FFF1EF',
  fieldDangerBorder: '#E8B5AE',
} as const;

export type PublicSurface = typeof publicSurface;

function isDarkTheme(theme: AppThemeTokens): boolean {
  const hex = theme.colors.background.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  return lum < 128;
}

export function getPublicSurface(theme: AppThemeTokens): PublicSurface {
  if (!isDarkTheme(theme)) return publicSurface;
  return {
    heroPanel: theme.colors.surface,
    heroPanelStrong: theme.colors.surface2,
    heroTint: 'rgba(160, 207, 207, 0.10)',
    heroTintStrong: 'rgba(160, 207, 207, 0.18)',
    accentSoft: theme.colors.surface2,
    accentStrong: theme.colors.copper,
    panel: theme.colors.surface,
    panelBorder: theme.colors.border,
    panelShadow: 'rgba(0, 0, 0, 0.45)',
    chipBg: theme.colors.primaryLight,
    chipText: theme.colors.primary,
    warmText: theme.colors.textSecondary,
    fieldBg: theme.colors.surface2,
    fieldBorder: theme.colors.border,
    fieldFocus: theme.colors.primary,
    fieldDangerBg: theme.colors.errorLight,
    fieldDangerBorder: theme.colors.error,
  };
}

export const landingHighlights: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'layers-outline',
    title: 'Tek akış',
    description: 'Makbuz, bakım ve iletişim kayıtları tek operasyon katmanında toplanır.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Güvenilir görünürlük',
    description: 'Kim ne yaptı, hangi kayıt bekliyor, hangi adım tamamlandı net biçimde izlenir.',
  },
  {
    icon: 'time-outline',
    title: 'Daha az sürtünme',
    description: 'Günlük saha trafiği daha az arama, daha az kayıp bağlam ve daha hızlı karar ile ilerler.',
  },
];

export const landingRoles: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'business-outline',
    title: 'Emlak ofisi',
    description: 'Portföy, ekip ve müşteri operasyonlarını tek bakışta yönetin.',
  },
  {
    icon: 'home-outline',
    title: 'Ev sahibi',
    description: 'Ödeme, bakım ve mülk durumu güncellemelerini daha sakin takip edin.',
  },
  {
    icon: 'person-outline',
    title: 'Kiracı',
    description: 'Arıza ve ödeme kayıtlarını güvenli, anlaşılır ve hızlı bir akışla iletin.',
  },
];

export const landingProof: { label: string; value: string }[] = [
  { label: 'Ödeme akışı', value: 'Makbuz ve kira takibi aynı panelde' },
  { label: 'Bakım akışı', value: 'Talep, not ve durum hareketi görünür' },
  { label: 'Belge akışı', value: 'Sözleşme ve dokümanlara merkezi erişim' },
];
