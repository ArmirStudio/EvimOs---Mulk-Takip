# Frontend

Mobil istemci Expo Router tabanlidir. Route dosyalari `frontend/app/` altinda, ortak ekran ve bilesenlere `frontend/components/Shared/`, API katmanina `frontend/services/appApi.ts` uzerinden ulasilir.

## Teknoloji Yigini

- **Expo SDK 52** + **Expo Router** (file-based routing)
- **React Native Reanimated v3** — animasyon altyapisi
- **React Native Gesture Handler** — swipe/gesture
- **Supabase JS** — auth ve client-side storage upload
- **expo-blur**, **expo-image-picker**, **expo-image-manipulator**
- **TypeScript** — `npm exec tsc -- --noEmit` ile kontrol edilir

## Auth ve Public Route'lar

- `/login` — e-posta veya telefon + sifre ile giris
- `/forgot-password` — e-posta veya telefonla Supabase reset e-postasi gonderir
- `/set-password` — davet ve sifre sifirlama callback'i sonrasinda yeni sifre belirler
- `/register` — davet kodu ile kayit
- `/invite/[token]` — link tabanli davet kaydi
- `/legal-acceptance` — ilk giriste sozlesme kabul ekrani (blocking)

Root layout aktif kullanicinin `terms_accepted_at` alani bos ise `/legal-acceptance` ekranina yonlendirir. Kabul edilmeden uygulama ici route'lara devam edilmez.

## Agent Zorunlu Sifre Degistirme (Onboarding)

Admin tarafindan olusturulan agent hesabi ilk giris sonrasinda zorunlu sifre degistirme akisindan gecer:

1. Legal acceptance tamamlanir
2. Root layout `needsAgentPasswordChange` guard'i tespit eder:
   - `role === 'agent'`
   - `first_login === true`
   - `terms_accepted_at` dolu
   - `onboarded_at` bos
3. `/agent/force-password-change` ekranina yonlenir
4. Kullanici yeni sifresi belirlenir (`supabase.auth.updateUser`)
5. `PATCH /api/users/me/complete-onboarding` cagrisi `onboarded_at` ve `first_login=false` yazar
6. `/agent/dashboard` acilir

Bu ekranda geri/atlama butonu yoktur.

## Login Akisi

1. Kullanici `/login` ekraninda e-posta veya telefon + sifre girer
2. Telefon girilirse backend `/api/auth/resolve-identifier` ile e-postaya cozulur
3. Supabase `signInWithPassword` ile oturum acilir
4. `buildUserDataForSession()` `public.users` profilini, rol, status ve marka bilgisini yukler
5. `terms_accepted_at` bos ise `/legal-acceptance` ekranina yonlenir
6. Onboarding guard aktif ise `/agent/force-password-change` ekranina yonlenir
7. Tum kosullar gecilmisse rol bazli dashboard acilir

## Tema Sistemi

Renk, spacing, radius, font ve animasyon tokenlari `frontend/app/theme.ts` icindedir.

- `createThemedStyles` + `useAppTheme` ile bilesen stilleri tanimlanir
- Karanlik/acik tema `preferred_theme` kullanici tercihine gore belirlenir
- Animasyon config: `theme.motion` (`springDefault`, `springBouncy`, `springGentle`, `durationFast/Normal/Slow`)

### Golge Tokenlari

`theme.shadows.sm/md/lg` her ikisi de iOS (`shadowX`) ve Android (`elevation`) icin tanimlidir.

## Navigasyon ve Ekran Gecisleri

`frontend/utils/navigationTransitions.ts` route turune gore animasyon atar:

| Tur | Animasyon |
|---|---|
| Ana ekranlar | `animation: 'none'` (ani gecis, alt bar ile tutarli) |
| Detay ekranlar | `animation: 'slide_from_right'` |
| Wizard/form | `animation: 'fade_from_bottom'` |
| Login, root | `animation: 'fade'` |

## Animasyon Mimarisi

### AnimatedScreen

`components/Shared/AnimatedScreen.tsx` — tum ana ekranlar bu sarmalayici ile acilir.

Desteklenen tipler: `fade` (varsayilan), `slide-up`, `slide-right`, `none`.

Parametreler:
```typescript
interface AnimatedScreenProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide-up' | 'slide-right' | 'none';
  delay?: number; // ms
}
```

`fade` animasyonu: opacity 0→1, scale 0.985→1, translateY 12→0, Easing.out(cubic), 300ms.

### AnimatedHeaderScrollView / AnimatedHeaderFlatList

Scroll ile gizlenen/gosterilen header:
- `SCROLL_THRESHOLD = 100px` asildiktan sonra asagi kayinca header gizlenir
- Yukari kayinca header geri gelir
- `stickySubHeader` destegi vardir (filtre satiri vb.)
- `transparentHeader` prop'u header arka planini seffaf yapar (PropertyDetailScreen hero icin)

### BottomSheetModal

`components/Shared/BottomSheetModal.tsx` — tum sheet'ler bu bileseni kullanir.

- **Reanimated 2** tabanlidir (legacy RNAnimated kaldirildi)
- Giris: `withSpring(0, { damping: 28, stiffness: 280, mass: 0.85 })`
- Cikis: `withTiming(WINDOW_HEIGHT, { duration: 240 })` + `runOnJS(setMounted)(false)` ile geciktirilmis unmount
- Backdrop: `withTiming` ile opacity fade-in/out

### ActionSlider

`components/Shared/ActionSlider.tsx` — onay/red kaydirma bileseni.

- Mount'ta 500ms sonra hint animasyonu: sag (+22px) → 0 → sol (-22px) → 0
- Swipe: Pan Gesture + `withSpring`
- Hem onay hem red yonunde haptic feedback
- Triggered olmadan alt satirda yardimci metin gosterilir

### Liste Animasyonlari

`FadeInDown.delay(index * N).duration(M).springify()` ile stagger pattern:

| Ekran | Gecikme |
|---|---|
| PropertiesScreen | 60ms |
| MaintenanceScreen (talepler) | 55ms |
| MaintenanceScreen (dekontlar) | 45ms |
| ReceiptsScreen | 50ms |
| UserListScreen | 45ms |
| LandlordTenantsScreen | 60ms |
| ArchiveScreen | 40ms |

### Expand/Collapse Animasyonu

`TeamExpensesPanel.tsx` harcama karti acma/kapama: `LayoutAnimation.configureNext` (spring + easeInEaseOut).

Android icin `UIManager.setLayoutAnimationEnabledExperimental(true)` set edilmistir.

## Bilesen Kutuphanesi (Shared)

| Bilesen | Aciklama |
|---|---|
| `AnimatedScreen` | Ekran giris animasyonu sarmalayicisi |
| `AnimatedHeaderScrollView` | Scroll-linked gizlenen header + ScrollView |
| `AnimatedHeaderFlatList` | Scroll-linked gizlenen header + FlatList |
| `BottomSheetModal` | Reanimated 2 tabanli sheet modal |
| `ActionSlider` | Onay/red kaydirma karti |
| `AppBottomNav` | Rol bazli alt navigasyon + FAB |
| `DashboardScreen` | Rol bazli dashboard |
| `PropertiesScreen` | Mulk listesi |
| `PropertyDetailScreen` | Mulk detay (hero carousel, seksiyonlar) |
| `MaintenanceScreen` | Talepler ve dekontlar |
| `ReceiptsScreen` | Dekont listesi |
| `ArchiveScreen` | Arsiv ve belge yuzeyi |
| `SettingsScreen` | Profil, ayarlar, rehber ve yasal modaller |
| `TeamHubScreen` | Ekip gorevleri, duyurular, toplantilar, harcamalar |
| `TeamExpensesPanel` | Harcama yonetimi (virgullu decimal input) |
| `ShimmerPlaceholder` | Yukleme iskelet gorunumu |
| `DecimalCurrencyInput` | Virgullu para girisi bileseni |
| `CurrencyInput` | Tamsayi binlik ayracli para girisi bileseni |
| `EvimosSVGLogo` | SVG logo (`full`, `icon`, `text-only` variant) |
| `CalendarWidget` | Kira takvimi mini gorunumu |

## Para Birimi Input Bilesenleri

### CurrencyInput

Tamsayi binlik ayracli format: `5000` → `5.000`. Klavye tipi `number-pad`.

### DecimalCurrencyInput

`components/Shared/DecimalCurrencyInput.tsx` — virgullu para girisi.

- Klavye tipi: `decimal-pad`
- Kullanici girdisi: virgul veya nokta ondalik ayrac olarak kabul edilir
- Gosterim: `1.250,50` (Turkce locale, binlik nokta + virgul ondalik)
- Parent'a gonderilen raw value: `1250.50` (nokta ondalik)
- `formatDecimalInput` utility: `frontend/utils/propertyHelpers.ts`

## Para Formatlama Utility

`frontend/utils/propertyHelpers.ts` icindeki fonksiyonlar:

| Fonksiyon | Kullanim |
|---|---|
| `formatCurrency(amount, currency?)` | Gosterim icin formatli para metni |
| `formatCurrencyInput(raw)` | Tamsayi input icin binlik format |
| `formatDecimalInput(raw)` | Decimal input icin `{ display, raw }` donduran format |
| `parseCurrencyInput(formatted)` | `"1.234,56"` → `1234.56` |
| `formatRentDay(day)` | Bir sonraki kira tarihini hesapla |
| `getPropertyImage(index)` | Placeholder gorsel |
| `getStatusLabel(status)` | Turkce durum etiketi |

## Klavye Yonetimi

Standart pattern:
- `ScrollView`/`FlatList` uzerinde `automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}` (iOS 15+)
- `keyboardShouldPersistTaps="handled"` veya `"always"`
- `KeyboardAvoidingView` behavior: `Platform.OS === 'ios' ? 'padding' : 'height'`
- Sheet/modal icindeki form: `Platform.OS === 'ios' ? 'padding' : undefined`
- `KeyboardAwareScrollView` sarmalayicisi: otomatik `automaticallyAdjustKeyboardInsets` platform kontrolu yapar

## Ayarlar Ekrani — Yasal Icerik

`SettingsScreen.tsx` Kullanim Sartlari ve Gizlilik Politikasi modalleri tam icerige sahiptir:

- **Kullanim Sartlari** — 7 seksiyon (Genel Hukumler, Hesap, Platform, Fikri Mulkiyet, Degisiklikler, Sorumluluk, Iletisim)
- **KVKK/Gizlilik Politikasi** — 6 seksiyon (Veri Sorumlusu, Islenen Veriler, Amaclar, Guvenlik, Haklariniz, Saklama Suresi)
- Her modal altta EvimosSVGLogo (`variant="full"`) ve telif hakki notu gosterir
- Sirket adres/telefon/vergi no alanlari `[Eklenecek]` placeholder ile birakilmistir

## Upload Hazirlama

`frontend/services/uploadPreparation.ts`:

- Gorsel dosyalarda `expo-image-manipulator` ile boyut sinirlandirma ve JPEG encode
- Mesaj eki, dekont, belge, duyuru eki ve task photo yuzeyleri bu helper uzerinden gecer
- `frontend/services/supabaseStorage.ts` storage remove helper'ini tutar
- Failed upload cleanup bu helper uzerinden yapilir

## Platform Uyumlulugu

- **GestureHandlerRootView** root `_layout.tsx` icinde tum uygulamayi sarar (Android gesture zorunlulugu)
- **Shadow**: `theme.shadows.*` hem iOS (`shadowX`) hem Android (`elevation`) icin tanimlidir
- **expo-blur BlurView**: AppBottomNav glass efekti, her iki platformda desteklenir
- **StatusBar**: `translucent` prop uygulamada tutarli sekilde set edilmistir (Android edge-to-edge)
- **SafeAreaInsets**: `useSafeAreaInsets()` header ve footer padding icin tum ekranlarda kullanilir
- **LayoutAnimation**: Android icin `UIManager.setLayoutAnimationEnabledExperimental(true)` aktif

## Mobil Admin

Admin route ailesi:
- `/admin/dashboard`, `/admin/companies`, `/admin/contacts`
- `/admin/dev-tools` — manuel kullanici/rol/ofis baglama araci
- `/admin/settings`
- `/admin/create-company`, `/admin/edit-company`
- `/admin/create-agent`, `/admin/edit-agent`

## Agent ve Employee

- `agent` ve `employee` rolleri `/agent/*` route ailesini kullanir
- Bottom nav: `Ana Sayfa`, `Mulkler`, `Talepler`, `Ekibim`, `Profil`
- `Ekibim` → gorevler, duyurular, toplantilar, harcamalar
- Mesajlasma `/agent/team-messages` tam ekran route'unda acilir; tab bar gizlenir
- Mesaj eki upload: once istemcide gorsel sikistirilir, sonra `team-message-files` private bucket'ina gider
- `createTeamMessage` basarisiz olursa upload edilen ekler storage'dan temizlenir

## Landlord ve Tenant

- Landlord bottom nav: `Ana Sayfa`, `Mulkler`, `Talepler`, `Profil`
- Tenant bottom nav: `Ana Sayfa`, `Evim`, `Taleplerim`, `Profil`
- Tenant ariza bildirimi ve dekont yukleme kendi operasyon ekranlarindan acilir
- Landlord talepler ekraninda aktif talepler, dekontlar ve belgeler sekmeleri vardir
- Tenant dekont upload'inda gorsel dosyalar istemcide resize + re-encode edilir; PDF sadece boyut kontrolunden gecer
