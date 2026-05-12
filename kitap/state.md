# Proje Durumu

Bu dosya canli durum kaydidir. Aktif kararlar icin bu dosya, `docs/` ve `supabase/schema_parts/` onceliklidir.

## Genel Durum

- Frontend Expo Router mobil yuzeyi TypeScript kontrolunden geciyor: `npm exec tsc -- --noEmit`
- `admin-web/` Vite paneli TypeScript kontrolunden geciyor
- Backend FastAPI route dosyalari Python compile kontrolunden geciyor
- Canli Supabase projesi aktif: `mpusgmvhvxeyyndpmkch`

## Tamamlanan Paketler

### Temel Altyapi

- Canli Supabase proje hizalamasi tamamlandi
- `team-message-files` private bucket'i ve `team_message_attachments` tablosu canliya eklendi
- `team_messages`, `team_message_reads`, `team_meetings` ve `office_expenses` policy'leri helper-function modeline cekildi
- `notifications.notif_insert` ve `announcement_recipients.ann_recipients_insert` acik `TRUE` policy degildir
- `receipts`, `property-documents`, `team-message-files`, `task-photos` ve `announcement-files` bucket'larinda storage policy seti tanimlandi
- Upload akislari ortak gorsel hazirlama helper'ina gecirildi
- Receipt withdraw: hard delete (storage fiziksel silme + `withdrawn` durumu)
- Message attachment ve property document akislarinda orphan upload cleanup eklendi

### Auth ve Onboarding

- `legal-acceptance` blocking akisi aktif (`terms_accepted_at` bos ise yonlendirme)
- **Agent zorunlu sifre degistirme akisi** eklendi:
  - `/agent/force-password-change` yeni ekrani
  - Root layout `needsAgentPasswordChange` guard'i
  - `PATCH /api/users/me/complete-onboarding` backend endpoint'i
  - `users.onboarded_at TIMESTAMPTZ` DB kolonu (`20260512_agent_onboarding.sql`)
  - `first_login` artik yalnizca `complete-onboarding` ile `false` yapiliyor (legal-acceptance'da degismez)
- `forgot-password` akisi aktif (e-posta veya telefon ile sifre sifirlama)
- Admin logout Supabase oturumunu da kapatir

### UI / UX Yenileme

- `legal-acceptance.tsx` tamamen yeniden yazildi:
  - Armir Studio / EvimOs — Mulk Yonetim markasi
  - 2 genisletilebilir seksiyon (Kullanim Kosullari + KVKK)
  - Her biri icin ayri onay kutusu
  - Liquid glass kart tasarimi
- `edit-property.tsx` liquid glass redesign:
  - Cover foto hero (tam genislik 180px) + grid
  - Kart: beyaz bg, borderRadius 18, shadows.md
  - Chip secenekleri, input focus state, bottom bar glassmorphism
- `PropertyDetailScreen.tsx` gorunsel yenileme:
  - Hero carousel uzerindeki action butonlari zIndex duzeltmesi
  - `AnimatedHeaderScrollView` transparent header duzeltmesi (navGlass sorunu giderildi)
  - Kart tasarimi, seksiyonlar, amenity chip'leri, taraflar divider, bakım istatistik kartlari
- `ActionSlider.tsx` hint animasyonu ve yon ikonlari eklendi
- `SettingsScreen.tsx` yasal modal icerigi:
  - Tam Kullanim Kosullari (7 seksiyon) ve KVKK (6 seksiyon)
  - Sirket bilgileri `[Eklenecek]` placeholder
  - Modal altinda EvimosSVGLogo footer

### Animasyon ve Platform Uyumu

- `BottomSheetModal.tsx` Reanimated 2'ye gecirildi:
  - Backdrop opacity fade animasyonu
  - Gelismis spring parametreleri
  - Exit animasyonu tamamlanana kadar bilesenin monte kalmasi (`runOnJS`)
- `ArchiveScreen.tsx` icindeki inline sheet modal Reanimated 2'ye gecirildi
- `TeamExpensesPanel.tsx` expand/collapse icin `LayoutAnimation` eklendi
- Stagger `FadeInDown` animasyonlari: MaintenanceScreen, ReceiptsScreen, UserListScreen, LandlordTenantsScreen
- `StatusBar translucent` prop'u ilgili ekranlara eklendi (Android edge-to-edge uyumu)

### Klavye Yonetimi

- `create-property.tsx`, `create-contact.tsx`, `edit-property.tsx` ScrollView'larina `automaticallyAdjustKeyboardInsets` eklendi
- `create-contact.tsx` `keyboardShouldPersistTaps` eklendi
- `AnimatedHeaderScrollView` icin standart klavye ayarlari

### Para Birimi Input

- `formatDecimalInput` utility eklendi (`frontend/utils/propertyHelpers.ts`)
- `DecimalCurrencyInput` bileseni olusturuldu (`components/Shared/DecimalCurrencyInput.tsx`)
- `TeamExpensesPanel.tsx` tutar alani `DecimalCurrencyInput` kullanacak sekilde guncellendi

### Temizlik

- Kaldirilan kok dosyalar: `backend/cd`, `create-export.ps1`, `sorun`, `test_result.md`, `CLAUDE.md`
- Admin ayarlarinda calismayan "agent hesabini askiya al" satiri kaldirildi
- Agent olusturma hardcoded `1234` sifre kullanmaz; gecici sifre backend ortam ayarlarindan gelir

## Migrationlar

| Dosya | Icerik |
|---|---|
| `20260512_supabase_alignment_and_storage_cleanup.sql` | Supabase hizalama ve storage cleanup |
| `20260512_team_messages_helper_policy_fix.sql` | Team mesaj RLS helper fix |
| `20260512_team_message_policy_qualification_fix.sql` | Policy ek duzeltme |
| `20260512_agent_onboarding.sql` | `users.onboarded_at` kolon ekleme |

## Dogrulama Komutlari

```bash
# Frontend TypeScript
npm.cmd exec tsc -- --noEmit

# Admin-web TypeScript
npm.cmd exec tsc -- --noEmit

# Backend compile
python -m py_compile backend/main.py backend/api/routes/admin.py backend/api/routes/users.py backend/api/routes/auth.py backend/api/routes/invites.py backend/models/schemas.py

# Backend kontrat testi
python -m unittest backend.tests.test_admin_dev_contract
```

## Acik Notlar

- Canli DB migration durumu ortam bazinda ayrica kontrol edilmelidir
- Supabase advisor tarafinda takip edilmesi gereken eski warning'ler:
  - `handle_new_user`, `rls_auto_enable` ve bazi trigger/function'larda `search_path` warning'i
  - Public bucket listing warning'leri (`ad-media`, `agency-branding`, `avatars`, `property-images`, `tenant-documents`)
- Manuel smoke gereken akislar:
  - Agent ilk giris → force-password-change → dashboard
  - Agent ve employee ile ekli mesaj gonderimi
  - Tenant dekont upload / withdraw
  - Property document upload / delete
  - ActionSlider hint animasyonu (bakım talebi veya dekont detay ekraninda)
