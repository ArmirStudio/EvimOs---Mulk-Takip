# Frontend

Mobil istemci Expo Router tabanlıdır. Yeni ekranlar mevcut tema, marka ve route düzeninden ayrılmamalıdır.

## Mobil Layout ve Footer Kuralları
- Dashboard karşılama kartı `DashboardScreen` içinde sabit/minimum yükseklikle korunur; metin absolute konumlanmaz.
- Wizard ve form ekranlarında alt CTA/footer ekranın altında sabit kalmalı; scroll içeriği footer yüksekliği kadar padding alarak footer arkasına kaçmamalıdır.
- Safe-area alt boşlukları `Math.max(insets.bottom, minimum)` paterniyle hesaplanır.
- Android ve iOS küçük ekranlarda klavye açıkken input kaybı ve CTA üstünde büyük boş alan regresyon kabul edilir.

## Tasarım Kuralları
- Renk, spacing, radius ve font için `frontend/app/theme.ts` tokenları kullanılır.
- Kullanıcıya görünen metinler Türkçe karakterli yazılır.
- Yeni ekranlarda hardcoded hex/rgba kullanılmaz.
- Public auth ekranları `BrandLockup`, `frontend/constants/brand.ts` ve `getPublicSurface(theme)` dilini takip eder.
- Bileşen stilleri `createThemedStyles` + `useAppTheme` ile tanımlanır.

### Dark Mode ve Public Surface
- `publicSurface` sabit nesnesi artık doğrudan import edilmez; `getPublicSurface(theme)` çağrılır.
- `getPublicSurface(theme)`: `isDarkTheme(theme)` true ise `theme.colors.surface/surface2` döner, false ise orijinal krem/açık renkler.
- `isDarkTheme(theme)`: `theme.colors.background` hex'inin luminansını hesaplar; < 0.15 ise karanlık mod kabul edilir.
- Kural: `createThemedStyles` arrow expression yerine block body (`const useStyles = createThemedStyles((theme) => { const surface = getPublicSurface(theme); return StyleSheet.create({...}); });`) kullanılır.
- Etkilenen dosyalar: `login.tsx`, `register.tsx`, `index.tsx`, `BrandLockup.tsx`.

## Public Kayıt
- `/register`: davet kodu lookup ve kayıt formu.
- `/invite/[token]`: link doğrulama ve kayıt formu.
- Kod veya link geçersiz, expired, used veya revoked ise kayıt açılmaz.

## Agent Davet
- Konum: `frontend/app/agent/invite.tsx`
- Rol seçimi: tenant, ev sahibi veya çalışan.
- Kişi girişi: `Rehberden Seç` veya `Manuel Gir`.
- Web, izin reddi veya cihaz desteği yoksa manuel giriş kullanılır.

## Navigasyon
- `AppBottomNav` rol konfigürasyonunun merkezidir.
- Admin: `Panel`, `Şirketler`, `İletişim`, `Ayarlar` + `Yeni Şirket` FAB.
- Agent/Employee: `Ana Sayfa`, `Mülkler`, `Talepler`, `Ekibim`, `Profil`; FAB yoktur.
- Landlord: `Ana Sayfa`, `Mülkler`, `Talepler`, `Profil`; `Arşiv` alt bar sekmesi değildir.
- Tenant: `Ana Sayfa`, `Mülkler`, `Talepler`, `Profil`; FAB yoktur.
- Agent/employee üst header profil ikonu yoktur; profil alt bardan açılır.

## Ekibim (TeamHubScreen)
- Tab bar yatay kaydırılabilir ScrollView: **Görevler · Duyurular · Toplantılar · Harcamalar**.
- Header sağı: mesaj ikonu butonu → `router.push('/agent/team-messages')`, yeşil nokta badge mesaj varsa.
- Hero kart compact: stat satırı (üye/görev/okunmayan) + context hint listesi.
- `TeamMeetingsPanel`, `TeamExpensesPanel` ayrı bileşen dosyalarındadır.
- `visibleTabs: ['tasks', 'announcements', 'meetings', 'expenses']`

## Mesajlaşma
- `/agent/team-messages` route'u — ayrı tam ekran sayfa, `slide_from_right` animasyonu.
- `agent/_layout.tsx`'e `<Stack.Screen name="team-messages" options={getDetailScreenOptions(theme)} />` eklendi.
- `TeamMessagesPanel` yalnızca bu sayfada render edilir; TeamHubScreen içinden kaldırıldı.

### Mesajlaşma Layout (WhatsApp Referansı)
```
SafeAreaView (flex:1)
  View style={header}
  KeyboardAvoidingView (flex:1, behavior="padding")
    FlatList (flex:1)          ← mesaj listesi, inverted değil, scrollToEnd ile aşağı başlar
      ...gün ayraçları (type: 'day')
      ...mesaj balonları
    ReplyPreviewBar             ← replyingTo doluyken görünür
    MessageComposer             ← her zaman altta
```
- **Gün ayraçları**: `buildListItems()` fonksiyonu mesajlar arasına `{ type: 'day', label }` objeleri enjekte eder.
  - "Bugün" / "Dün" / "5 Ocak 2026" formatı, Türkçe `toLocaleDateString`.
- **Mesaj balonları**:
  - Kendi mesajı: sağa hizalı, `bubbleOwn` stili (tema primaryLight).
  - Diğerinin mesajı: sola hizalı, `bubbleOther` stili + avatar (ad baş harfi) + gönderen adı + saat.
  - Yanıtlı mesaj: balon içinde quote kutusu (gri arka plan, sol ince çizgi, 1 satıra kısaltılmış önizleme).
- **Gördü tiki**: son kendi mesajının altında `MaterialIcons name="done"` (tek ✓) veya `"done-all"` (çift ✓✓, mavi) — `readStatus`'taki `last_read_at >= message.created_at` olan üye sayısına göre.
- **Long press → yanıtla**: `onLongPress` prop ile `replyingTo` state güncellenir; `ReplyPreviewBar` açılır; × ile iptal.
- **Composer**: draft boşken sağda 📷 + 🎤 ikonlar (görsel, tıklanamaz); draft doluyken yuvarlak gönder butonu.
- **Optimistik gönderim**: mesaj `temp_${Date.now()}` ID ile hemen listede görünür; API hatasında geri alınır.

## Profil Ekranı (SettingsScreen)
- Tab bar sadece agent'ta görünür: **Profil · Rehber · Raporlar**.
- Raporlar sekmesi yalnızca `role === 'agent'`; employee_access_level'a bakılmaz.
- `AgentReportsPanel` bileşeni harcama özeti ve ekip performansını gösterir.

## Takvim ve Nav Görseli
- `CalendarWidget` başlık toggle ile açılıp kapanır.
- Alt nav `expo-blur` BlurView ile cam efekti kullanır.

## İnternet Bağlantısı Kontrolü
- `@react-native-community/netinfo` paketi ile gerçek zamanlı ağ izlemesi yapılır.
- `frontend/hooks/useNetworkStatus.ts`: `isConnected: boolean` döner; `true` optimistic başlangıçla overlay yanıp sönmesi engellenir.
- `frontend/components/Shared/NoInternetOverlay.tsx`: İnternet kesilince tüm ekranı kapatan absolute overlay. "Tekrar Dene" butonu `NetInfo.fetch()` çağırır.
- `_layout.tsx` `GestureHandlerRootView` içinde `AppBottomNav`'dan sonra render edilir.
