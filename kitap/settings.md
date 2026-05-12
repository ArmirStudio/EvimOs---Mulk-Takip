# Ayarlar, Profil ve Yasal Akislar

Bu dosya ortak profil, ayarlar, yasal kabul ve sifre davranislarini ozetler.

## Canli Ekranlar
- `SettingsScreen.tsx`: ortak profil ve ayarlar ekrani.
- `ProfileEditScreen.tsx`: profil duzenleme akisi.
- `ChangePasswordScreen.tsx`: sifre degistirme akisi.
- `frontend/app/legal-acceptance.tsx`: ilk giris yasal kabul ekrani.
- `frontend/app/forgot-password.tsx`: sifremi unuttum ekrani.
- `frontend/app/admin/settings.tsx`: admin ayarlari.

## Profil Davranisi
- Profil kartina basinca profil duzenleme ekrani acilir.
- `Sifre Degistir` satiri korunur.
- Profil ve avatar guncellemesi sonrasinda ortak session refresh calisir.
- Agent tarafinda profil ekraninda rehber ve rapor sekmeleri rol kurallarina gore gorunur.

## Tercihler
- Para birimi: `TRY | USD | EUR`.
- Tema: UI tarafinda `light | dark | auto`, backend tarafinda `light | dark | system`.
- Currency/theme degisince optimistic UI update yapilir.
- Tercihler backend `PATCH /api/users/{id}` ile yazilir.

## Yasal Kabul
- `users.terms_accepted_at` bos olan aktif kullanici `/legal-acceptance` ekranina yonlendirilir.
- Kullanici onay kutusunu isaretlemeden kabul butonu aktif olmaz.
- Kabul backend `PATCH /api/users/me/legal-acceptance` ile yazilir.
- Backend `terms_accepted_at = now()` ve `first_login = false` yazar.
- Ayarlardaki sozlesme ve gizlilik metinleri goruntuleme icindir; blocking kabul ilk giris ekraninda yapilir.

## Sifremi Unuttum
- Login ekranindan `/forgot-password` acilir.
- Kullanici e-posta veya telefon girebilir.
- Telefon girildiginde `/api/auth/resolve-identifier` ile e-posta bulunur.
- Supabase reset password e-postasi gonderilir.
- Deep link callback `/set-password` ekranina duser.

## Admin Ayarlari
- Admin logout Supabase oturumunu da kapatir.
- Calismayan "agent hesabini askiya al" satiri kaldirildi.
- `Gelisim Araclari` girisi `/admin/dev-tools` ekranina gider.
- Agent olusturma akisi hardcoded `1234` sifre kullanmaz.

## Agent Rehberi
- Agent profilindeki `Rehber` sekmesi birlesik rehberdir.
- Kaynaklar: landlord listesi, tenant listesi, `appApi.listOfficeContacts()`.
- Filtreler: `Tumu`, `Ustalar`, `Ev Sahipleri`, `Kiracilar`.
- Usta/tadilatci karti `/agent/edit-contact?id=...` akisina gider.
- Ev sahibi/kiraci karti `/agent/contact-detail?id=...` akisina gider.
