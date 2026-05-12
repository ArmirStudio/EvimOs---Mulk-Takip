# Frontend

Mobil istemci Expo Router tabanlidir. Route dosyalari `frontend/app/` altinda, ortak ekran ve bilesenler `frontend/components/`, API katmani `frontend/services/appApi.ts` altinda tutulur.

## Guncel Durum
- `frontend` TypeScript kontrolu temiz geciyor: `npm.cmd exec tsc -- --noEmit`.
- Public auth ekranlari, role dashboard yonlendirmeleri, yasal kabul ve sifremi unuttum akislari aktif.
- Mobil admin icinde gecici `/admin/dev-tools` sayfasi vardir.
- Reklam kampanyasi CRUD mobilde tutulmaz; admin-web kanonik paneldir.

## Auth ve Public Route'lar
- `/login`: e-posta veya telefon + sifre ile giris.
- `/forgot-password`: e-posta veya telefonla Supabase reset password e-postasi gonderir.
- `/set-password`: davet ve sifre sifirlama callback sonrasinda yeni sifre belirler.
- `/register`: davet kodu ile kayit.
- `/invite/[token]`: link tabanli davet kaydi.
- `/legal-acceptance`: ilk giriste sozlesme kabul ekranidir.

Root layout aktif kullanicinin `terms_accepted_at` alani bos ise dashboard yerine `/legal-acceptance` ekranina yonlendirir. Kabul edilmeden uygulama ici route'lara devam edilmez.

## Login ve Sifre Sifirlama
- Telefon girisi once `/api/auth/resolve-identifier` ile e-postaya cozulur.
- Login Supabase `signInWithPassword` ile yapilir.
- Sifremi unuttum akisi Supabase `resetPasswordForEmail` kullanir.
- Deep link callback mevcut auth callback ve `/set-password` akisini kullanir.

## Mobil Admin
Admin route ailesi:
- `/admin/dashboard`
- `/admin/companies`
- `/admin/contacts`
- `/admin/dev-tools`
- `/admin/settings`
- `/admin/create-company`
- `/admin/edit-company`
- `/admin/create-agent`
- `/admin/edit-agent`

Admin bottom nav: `Panel`, `Sirketler`, `Iletisim`, `Gelisim`, `Ayarlar`. `Gelisim` sekmesi dev tools icindir ve yalniz admin kullanicilarda anlamlidir.

Admin ayarlarinda:
- Calismayan "agent hesabini askiya al" satiri kaldirildi.
- Dev tools giris noktasi eklendi.
- Logout artik AsyncStorage temizligiyle birlikte Supabase oturumunu da kapatir.
- Agent olusturmada hardcoded `1234` sifre yoktur; gecici sifre davranisi backend ortam ayarlarina baglidir.

## Admin Dev Tools
`/admin/dev-tools` ekrani Supabase'de manuel olusturulan veya baglantisi eksik kullanicilari duzeltmek icindir.

Ekran alanlari:
- kullanici secimi
- rol secimi: `admin | agent | employee | landlord | tenant`
- hedef agent/ofis sahibi
- employee access level: `limited | full`
- status: `active | pending`
- agent icin agency secimi

Tenant, landlord ve employee baglantisinda `created_by = selectedAgent.id` yazilir. Auth metadata senkronizasyonu backend tarafinda yapilir.

## Agent ve Employee
- `agent` ve `employee` rolleri `/agent/*` route ailesini kullanir.
- Bottom nav: `Ana Sayfa`, `Mulkler`, `Talepler`, `Ekibim`, `Profil`.
- `Ekibim` ekraninda gorevler, duyurular, toplantilar ve harcamalar vardir.
- Mesajlasma `/agent/team-messages` tam ekran route'unda acilir ve tab bar gizlenir.

## Landlord ve Tenant
- Landlord bottom nav: `Ana Sayfa`, `Mulkler`, `Talepler`, `Profil`.
- Tenant bottom nav: `Ana Sayfa`, `Evim`, `Taleplerim`, `Profil`.
- Tenant ariza bildirimi ve dekont yukleme akislarini kendi operasyon ekranlarindan acar.
- Landlord talepler ekraninda aktif talepler, dekontlar ve belgeler sekmelerini gorur.

## Tasarim ve Kod Kurallari
- Renk, spacing, radius ve font icin `frontend/app/theme.ts` tokenlari kullanilir.
- Kullaniciya gorunen metinlerde `translations.ts` ve mevcut lokalizasyon dili korunur.
- Public auth ekranlari `BrandLockup`, `frontend/constants/brand.ts` ve `getPublicSurface(theme)` dilini takip eder.
- Bilesen stilleri `createThemedStyles` + `useAppTheme` ile tanimlanir.
- `frontend/app/` altina yalniz route dosyalari konur.

## Son TypeScript Duzeltmeleri
- `navigationTransitions.ts` Expo Router tipleriyle cakismayacak sekilde sade opsiyon tipi kullanir.
- `NoInternetOverlay.tsx` gecerli Ionicons adi kullanir.
- `TeamExpensesPanel.tsx` upload helper'i dogru payload ile cagirir.
- `brand.ts` `publicSurface` dark theme donusunu literal type'a takilmadan dondurur.
- `agent/create-property.tsx` nullable landlord secimini `createProperty` oncesi daraltir.
