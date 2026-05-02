# Frontend Dokumantasyonu

Mobil istemci Expo Router tabanlidir. Yeni ekranlar mevcut Evimos public surface ve theme dilinden ayrilmamalidir.

## Tasarim Kurali
- Renk, spacing, radius ve font icin `frontend/app/theme.ts` tokenlari kullanilir.
- Public auth ekranlari `BrandLockup`, `frontend/constants/brand.ts` ve `publicSurface` dilini takip eder.
- `/register` ekrani `login.tsx` ile ayni hero card + form card desenindedir.
- Agent davet ekrani mevcut segment button, input, result box ve share button desenini korur.

## Public Kayit
- `/register`: davet kodu lookup ve kayit formu.
- `/invite/[token]`: link dogrulama ve kayit formu.
- Link gecersizse `/invite/[token]` icinde kodla devam alani gosterilir.
- Kod veya link gecersiz, expired, used veya revoked ise kayit acilmaz.

## Agent Davet Ekrani
- Konum: `frontend/app/agent/invite.tsx`
- Rol secimi: kiraci veya ev sahibi.
- Kisi girisi: `Rehberden Sec` veya `Manuel Gir`.
- Rehber secimi `expo-contacts` native picker ile yapilir; tum rehber aktarilmaz.
- Web, izin reddi veya cihaz desteklememe halinde manuel giris fallback olur.
- Davet sonucu link + kod gosterir ve WhatsApp/SMS/kopyala metnine ikisini de koyar.

## Takma Ad Gorunurlugu
- `contact_label` agent icin ozel takma addir.
- Pending listesi ve aktif kisi listesinde agent takma adla arama yapabilir.
- Full employee takma adi gormez; profil adi, e-posta ve telefonla calisir.
- Tenant/landlord tarafinda yalniz `full_name` gorunur.

## Pending UI
- `PendingApprovalScreen` pending tenant/landlord icin ortak bekleme ekranidir.
- `AppBottomNav` pending kullanicida gorunur ama ana sayfa disi tablar kilitlidir.
- FAB/quick action pending durumda kapali kalir.
