# Ayarlar, Profil ve Yasal Akislar

Bu dosya ortak profil, ayarlar, yasal kabul ve sifre davranislarini ozetler.

## Canli Ekranlar

- `SettingsScreen.tsx`: ortak profil ve ayarlar ekrani (tum roller icin, admin haric)
- `ProfileEditScreen.tsx`: profil duzenleme akisi
- `ChangePasswordScreen.tsx`: sifre degistirme akisi
- `frontend/app/legal-acceptance.tsx`: ilk giris yasal kabul ekrani (blocking)
- `frontend/app/agent/force-password-change.tsx`: agent zorunlu sifre belirleme ekrani
- `frontend/app/forgot-password.tsx`: sifremi unuttum ekrani
- `frontend/app/admin/settings.tsx`: admin ayarlari

## Profil Davranisi

- Profil kartina basinca profil duzenleme ekrani acilir
- `Sifre Degistir` satiri korunur
- Profil ve avatar guncellemesi sonrasinda ortak session refresh calisir
- Agent tarafinda profil ekraninda rehber sekmesi rol kurallarina gore gorunur

## Tercihler

- Para birimi: `TRY | USD | EUR`
- Tema: UI tarafinda `light | dark | auto`, backend tarafinda `light | dark | system`
- Currency/theme degisince optimistic UI update yapilir
- Tercihler backend `PATCH /api/users/{id}` ile yazilir

## Yasal Kabul (legal-acceptance)

`/legal-acceptance` ekrani blocking'dir:

- `users.terms_accepted_at` bos olan aktif kullanici bu ekrana yonlendirilir; devam etmeden bu ekrandan cikilmaz
- Iki genisletilebilir seksiyon:
  - **Kullanim Kosullari** — 7 alt baslik
  - **KVKK/Gizlilik Politikasi** — 6 alt baslik
- Her seksiyon icin ayri onay kutusu zorunludur; ikisi isaretlenmeden "Devam Et" aktif olmaz
- Kabul backend `PATCH /api/users/me/legal-acceptance` ile yazilir
- Backend yalnizca `terms_accepted_at = now()` yazar (`first_login` bu adimda degismez)
- Kabul sonrasinda agent + `first_login=true` ise `/agent/force-password-change` ekranina, diger roller dashboard'a yonlenir

## Agent Zorunlu Sifre Degistirme (force-password-change)

- Admin tarafindan olusturulan agent hesabi ilk giriste bu ekrandan gecer
- Geri/atlama butonu yoktur; ekrandan cikilmaz
- Sifre guc gostergesi: 3 segment bar (Zayif / Orta / Guclu)
- `supabase.auth.updateUser({ password })` ile sifre yazilir
- `PATCH /api/users/me/complete-onboarding` cagrisi `onboarded_at = now()` ve `first_login = false` yazar
- Akis tek seferliktir; `onboarded_at` dolunca bir daha tetiklenmez

## Ayarlar Ekrani — Yasal Icerik

`SettingsScreen.tsx` Kullanim Sartlari ve Gizlilik Politikasi menuleri bulunur:

- **Kullanim Sartlari** modal: Armir Studio / EvimOs — Mulk Yonetim markasi ile tam metin, 7 seksiyon
- **Gizlilik Politikasi** modal: KVKK kapsaminda 6 seksiyon, sirket bilgileri `[Eklenecek]` placeholder
- Her modal altta `EvimosSVGLogo variant="full"` ve `© 2025 Armir Studio` notu gosterir
- Bu modaller yalnizca goruntuleme icindir; blocking kabul `/legal-acceptance` ekraninda yapilir

## Sifremi Unuttum

- Login ekranindan `/forgot-password` acilir
- Kullanici e-posta veya telefon girebilir
- Telefon girildiginde `/api/auth/resolve-identifier` ile e-posta bulunur
- Supabase reset password e-postasi gonderilir
- Deep link callback `/set-password` ekranina duser
- Yeni sifre `supabase.auth.updateUser({ password })` ile yazilir

## Admin Ayarlari

- Admin logout Supabase oturumunu da kapatir
- `Gelisim Araclari` girisi `/admin/dev-tools` ekranina gider
- Agent olusturma hardcoded sifre kullanmaz; gecici sifre backend ortam ayarlarindan gelir

## Agent Rehberi

- Agent profilindeki `Rehber` sekmesi birlesik rehberdir
- Kaynaklar: landlord listesi, tenant listesi, `appApi.listOfficeContacts()`
- Filtreler: `Tumu`, `Ustalar`, `Ev Sahipleri`, `Kiracilar`
- Usta/tadilatci karti `/agent/edit-contact?id=...` akisina gider
- Ev sahibi/kiraci karti `/agent/contact-detail?id=...` akisina gider
