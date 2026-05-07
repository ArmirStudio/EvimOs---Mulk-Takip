# Proje Durumu

Bu dosya canlı durum kaydıdır.

## Mevcut Durum
- Faz 4 tamamlandı: Harcamalar modülü (DB + backend + frontend panel + TeamHub entegrasyonu) ve Profil/Raporlar sekmesi.
- Frontend lint hata vermiyor; mevcut uyarılar eski kapsam dışı borçlardır.
- `tsc --noEmit` repo genelinde Expo Router ve `@react-navigation/native-stack` tip çakışması nedeniyle başarısız.

## Bekleyen SQL Migration'lar (canlı DB'de çalıştırılmalı)
1. `supabase/fix_team_messages.sql` — eski `content/office_id` şemasını temizler.
2. `supabase/migrations/20260507_invites_add_employee.sql` — invites.role'e `employee` eklenir.
3. `supabase/migrations/20260507_team_meetings.sql` — team_meetings tablosu.
4. `supabase/migrations/20260507_office_expenses.sql` — office_expenses tablosu.
5. `supabase/migrations/20260507_team_messages_v2.sql` — `reply_to_id` alanı + `team_message_reads` tablosu.

## Son Değişiklikler

### Faz 5 — Mesajlaşma Yenileme + Dark Mode Düzeltmesi (2026-05-07)

#### Ekibim Tab Geçişi Düzeltmesi
- `TeamHubScreen.tsx`: `router.replace()` → yerel `useState<TeamTab>` geçişi.
- Tab değişimi artık navigasyon animasyonu tetiklemiyor; anlık, animasyonsuz.
- Deep link desteği korundu: `useEffect` ile `params.tab` değişince state güncelleniyor.

#### Mesajlaşma Yenileme (WhatsApp Referansı)
- DB migration: `supabase/migrations/20260507_team_messages_v2.sql`
  - `team_messages` tablosuna `reply_to_id UUID` eklendi (FK → team_messages, nullable).
  - `team_message_reads(office_owner_id, user_id, last_read_at)` tablosu oluşturuldu + RLS politikaları.
- Backend:
  - `_serialize_message`: `reply_to` inline önizleme (id, body[:100], sender_name) eklendi.
  - `list_team_messages`: `reply_map` oluşturuluyor; yanıt önizleme inline ekleniyor.
  - `create_team_message`: `reply_to_id` desteği eklendi.
  - Yeni `POST /team/messages/read` — kullanıcının `last_read_at` UPSERT.
  - Yeni `GET /team/messages/read-status` — tüm ofis üyelerinin okuma zamanları.
  - `CreateTeamMessageRequest` modeline `reply_to_id: Optional[str] = None` eklendi.
- Frontend tipler (`teamTypes.ts`): `TeamMessageReplyPreview`, `TeamMessageReadStatus` eklendi; `TeamMessage` güncellendi.
- Frontend API (`appApi.ts`): `markMessagesRead`, `getMessageReadStatus`, `createTeamMessage` reply_to_id desteği.
- `team-messages.tsx` layout: `KeyboardAvoidingView` + `FlatList` + composer altta sabit; ekran açılınca `markMessagesRead` çağrılıyor; optimistik mesaj gönderme.
- `TeamMessagesPanel.tsx` tam yeniden yazım:
  - Balon UI: kendi mesajı sağda, diğeri solda (avatar baş harfi + gönderen adı).
  - Gün ayraçları: "Bugün" / "Dün" / "5 Ocak 2026" formatı.
  - Yanıt quote kutusu balon içinde (uzun basış → yanıt barı).
  - Gördü tiki: tek ✓ = gönderildi, ✓✓ mavi = en az 1 üye gördü.

#### Dark Mode Düzeltmesi
- `frontend/constants/brand.ts`: `isDarkTheme(theme)` ve `getPublicSurface(theme)` yardımcı fonksiyonları eklendi.
  - `isDarkTheme`: `theme.colors.background` hex'inin luminansına bakarak karanlık mod tespiti yapar.
  - `getPublicSurface(theme)`: karanlık modda `theme.colors.surface/surface2` renkleri döner; aydınlık modda orijinal `publicSurface` döner.
- `frontend/app/login.tsx`, `register.tsx`, `index.tsx`: `publicSurface` sabit import → `getPublicSurface(theme)` dinamik çağrıya dönüştürüldü (`createThemedStyles` block body).
- `BrandLockup.tsx`: subtitle rengi `getPublicSurface(theme).warmText` ile tema duyarlı hale getirildi.

#### Alt Nav Bar Kısmi Düzeltme
- `AppBottomNav.tsx`: `wrapper.paddingHorizontal: 12 → 0` (yan beyaz şeritler kaldırıldı).
- Alt/köşe krem alanları (pill borderRadius köşe artıkları + paddingBottom gap) henüz çözülmedi — bkz. `sorun` dosyası.

### Faz 4 — Harcamalar Modülü (2026-05-07)
- DB migration: `supabase/migrations/20260507_office_expenses.sql` — `office_expenses` tablosu, RLS politikası.
  - Agent herkese ait kaydı silebilir; employee yalnızca kendi kaydını düzenleyebilir/silebilir.
- Backend: 5 endpoint eklendi `/team/expenses` altına (summary, list, create, patch, delete).
  - `GET /team/expenses/summary` — agent only, 12 aylık kategori dökümü.
  - `POST /team/expenses` — miktar > 0 ve YYYY-MM-DD tarih zorunlu.
  - `PATCH /team/expenses/{id}` — yalnızca açıklama/tarih/makbuz URL değiştirilir; miktar/kategori değiştirilemez.
- Frontend types: `ExpenseCategory`, `EXPENSE_CATEGORY_LABELS/ICONS/COLORS`, `OfficeExpense`, `ExpenseMonthlySummary` tipleri eklendi.
- Frontend API: `listExpenses`, `getExpenseSummary`, `createExpense`, `updateExpense`, `deleteExpense` eklendi.
- Frontend UI: `TeamExpensesPanel.tsx` — ay bazında gruplu liste, bottom sheet modal (tutar + kategori chips + tarih + açıklama + makbuz foto), sahiplik kontrolüyle silme.
- `TeamHubScreen.tsx`: `expenses` tab'ı eklendi, tab bar yatay kaydırmalı `ScrollView`'a dönüştürüldü (4 tab: Görevler · Duyurular · Toplantılar · Harcamalar).
- Profil Raporlar sekmesi: `SettingsScreen.tsx`'e `'reports'` 3. tab eklendi, yalnızca `role === 'agent'` görür.
- `AgentReportsPanel.tsx`: Harcama özeti (toplam + kategori bar chart + son aylar) + Ekip Performansı (dönem seçici, metrik kartları, bar chart).
- `translations.ts` / `teamPresentation.ts`: `expenses: 'Harcamalar'` eklendi.

### Ekibim Görsel Yenileme (2026-05-07)
- Header: başlık sol + sağda mesaj ikonu (yeşil nokta badge) → `/agent/team-messages` route'u sağdan kayar olarak açılır.
- Hero kart küçültüldü: compact stat satırı (üye / açık görev / okunmayan) + context hint'ler (bugün toplantı, açık görev, okunmayan duyuru, her şey yolunda).
- Mesaj sekmesi kaldırıldı; tam ekran mesaj sayfası `frontend/app/agent/team-messages.tsx` olarak ayrı route'a taşındı.

### Faz 3 — Toplantılar Modülü (2026-05-07)
- DB migration: `supabase/migrations/20260507_team_meetings.sql` — team_meetings tablosu, RLS politikası.
- Backend: 5 endpoint eklendi `/team/meetings` altına (list, create, update, complete, cancel).
- Bug fix: `team_messages` endpoint'lerinde `office_id` → `office_owner_id` düzeltildi.
- Frontend: `TeamMeetingsPanel.tsx` — yaklaşan/geçmiş gruplama, oluşturma modal'ı, tamamla/iptal aksiyonları.

### Faz 2 — Çalışan Davet Sistemi (2026-05-07)
- `invites.role` constraint'e `'employee'` eklendi.
- Backend: employee için `agency_id` agent'tan kopyalanıyor; onay anında `employee_access_level` set ediliyor.
- Frontend: davet ekranına "Çalışan" seçeneği eklendi; pending-invite-detail'e tam/sınırlı yetki seçici eklendi.

### Önceki Değişiklikler
- İnternet bağlantısı yok ekranı eklendi: `useNetworkStatus` hook, `NoInternetOverlay` bileşeni.
- Tenant, agent ve employee alt bar FAB aksiyonları kaldırıldı.
- Agent rehberi usta/tadilatçı, ev sahibi ve kiracı kayıtlarını tek sekmede listeler.
- Landlord `Talepler` ekranı `Aktif Talepler`, `Dekontlar`, `Belgeler` sekmeleriyle arşiv işlevini kapsar.
- Railway backend deploy: `railway.toml`, env örnekleri eklendi.

## Açık Notlar
- Canlı DB'de `supabase/current_db_invites_patch.sql` uygulanmadan davet akışı çalışmaz.
- Native rehber seçimi için yeni build gerekir.
- Railway smoke testleri gerçek prod URL ile çalıştırılmadı.
