# Is Akislari

Bu dosya canli kritik akislarin guncel ozetidir.

## Giris
1. Kullanici `/login` ekraninda e-posta veya telefon ve sifre girer.
2. Telefon girilirse backend `/api/auth/resolve-identifier` telefonu e-postaya cozer.
3. Supabase `signInWithPassword` ile oturum acilir.
4. `buildUserDataForSession()` `public.users` profilini, role, status ve marka bilgisini yukler.
5. Aktif kullanicinin `terms_accepted_at` alani bos ise `/legal-acceptance` ekranina yonlenir.
6. Kabul tamamlanmissa role gore dashboard acilir:
   - `admin` -> `/admin/dashboard`
   - `agent` veya `employee` -> `/agent/dashboard`
   - `landlord` -> `/landlord/dashboard`
   - `tenant` -> `/tenant/dashboard`

## Ilk Giris Sozlesme Kabul
1. `/legal-acceptance` blocking ekrandir; aktif kullanici kabul etmeden uygulama icine devam edemez.
2. Kullanici "Okudum, anladim ve kabul ediyorum" kutusunu isaretler.
3. Frontend `PATCH /api/users/me/legal-acceptance` cagrisi yapar.
4. Backend `terms_accepted_at = now()` ve `first_login = false` yazar.
5. Session cache guncellenir ve kullanici rolune gore dashboard'a doner.

## Sifremi Unuttum
1. Login ekranindan `/forgot-password` acilir.
2. Kullanici e-posta veya telefon girer.
3. Telefon ise backend `/api/auth/resolve-identifier` ile e-posta bulunur.
4. Supabase `resetPasswordForEmail` cagrisi yapilir.
5. Kullanici e-postadaki linke tiklayinca deep link `auth/callback` olarak yakalanir.
6. Root layout OTP'yi dogrular ve `/set-password` ekranina yonlendirir.
7. Yeni sifre `supabase.auth.updateUser({ password })` ile yazilir.

## Davet Linki ve Kodu
1. Agent veya full employee tenant, landlord veya employee daveti olusturur.
2. Backend tek kullanmalik link ve 8 karakterlik kod uretir.
3. Link ve kod ayni daveti temsil eder; biri kullanilinca digeri kapanir.
4. Davetli rol secmez; rol davetten gelir.
5. Yeni hesap `pending` baslar.
6. Agent veya yetkili calisan pending kullaniciyi onaylar ya da reddeder.

## Admin Dev Tools
1. Admin mobil uygulamada `/admin/dev-tools` ekranini acar.
2. Backend `GET /api/admin/dev/users` ile kullanicilari listeler.
3. Backend `GET /api/admin/dev/agents` ile agent ve agency seceneklerini listeler.
4. Admin kullaniciyi role atar:
   - tenant / landlord / employee icin hedef agent zorunludur.
   - employee icin `employee_access_level` secilir.
   - agent icin `agency_id` secilebilir veya bos birakilabilir.
5. `POST /api/admin/dev/link-user` `users` satirini ve Supabase Auth metadata'sini backend service-role ile gunceller.

## Ekibim ve Mesajlasma
1. Agent/employee alt barda `Ekibim` ekranina gider.
2. TeamHub tablari: Gorevler, Duyurular, Toplantilar, Harcamalar.
3. Mesajlar `/agent/team-messages` tam ekran route'unda acilir.
4. Ekli mesajlarda dosyalar once private `team-message-files` bucket'ina yuklenir.
5. Backend mesaj ve attachment metadata kaydini olusturur.

## Landlord ve Tenant Operasyonlari
1. Tenant talepler yuzeyinden ariza bildirimi ve dekont yukleme akislarini acar.
2. Landlord talepler ekraninda aktif talepler, dekontlar ve belgeler sekmelerini gorur.
3. Eski archive linkleri ilgili operasyon yuzeylerine yonlendirilir.
