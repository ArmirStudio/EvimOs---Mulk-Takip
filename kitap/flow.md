# Is Akislari

Bu dosya canli kritik akislarin guncel ozetidir.

## Giris

1. Kullanici `/login` ekraninda e-posta veya telefon ve sifre girer
2. Telefon girilirse backend `/api/auth/resolve-identifier` ile e-postaya cozulur
3. Supabase `signInWithPassword` ile oturum acilir
4. `buildUserDataForSession()` profil, rol, status, marka bilgisi ve `onboarded_at` alanini yukler
5. `terms_accepted_at` bos ise `/legal-acceptance` ekranina yonlenir
6. Agent + `first_login=true` + `onboarded_at` bos ise `/agent/force-password-change` ekranina yonlenir
7. Tum kosullar gecilmisse rol gore dashboard:
   - `admin` → `/admin/dashboard`
   - `agent` veya `employee` → `/agent/dashboard`
   - `landlord` → `/landlord/dashboard`
   - `tenant` → `/tenant/dashboard`

## Ilk Giris Sozlesme Kabul

1. `/legal-acceptance` blocking ekrandir; aktif kullanici kabul etmeden uygulamaya devam edemez
2. Iki genisletilebilir seksiyon: **Kullanim Kosullari** ve **KVKK/Gizlilik Politikasi**
3. Her biri icin ayri onay kutusu zorunludur; ikisi isaretlenmeden "Devam Et" aktif olmaz
4. Frontend `PATCH /api/users/me/legal-acceptance` cagrisi yapar
5. Backend yalnizca `terms_accepted_at = now()` yazar (`first_login` bu adimda degismez)
6. Session cache guncellenir
7. Agent + `first_login=true` ise `/agent/force-password-change` ekranina yonlenir
8. Diger roller rol bazli dashboard'a yonlenir

## Agent Zorunlu Sifre Degistirme

Admin tarafindan olusturulan agent hesabi ilk giriste yeni sifre belirlemek zorundadir:

1. Legal acceptance tamamlanir (yukari bak)
2. Root layout guard devreye girer:
   - `role === 'agent'` ve `first_login === true` ve `terms_accepted_at` dolu ve `onboarded_at` bos
3. `/agent/force-password-change` ekrani acilir (geri/atlama butonu yoktur)
4. Kullanici sifre girer (guc gostergesi: Zayif/Orta/Guclu)
5. `supabase.auth.updateUser({ password })` ile sifre guncellenir
6. `PATCH /api/users/me/complete-onboarding` cagrisi yapilir
7. Backend `onboarded_at = now()` ve `first_login = false` yazar
8. `persistUserData()` ile session guncellenir
9. `/agent/dashboard` acilir

Bu akis yalnizca bir kez gereklidir; `onboarded_at` dolu olan agent bir daha bu ekrani gormez.

## Sifremi Unuttum

1. Login ekranindan `/forgot-password` acilir
2. Kullanici e-posta veya telefon girer
3. Telefon ise backend `/api/auth/resolve-identifier` ile e-posta bulunur
4. Supabase `resetPasswordForEmail` cagrisi yapilir
5. Kullanici e-postadaki linke tiklayinca deep link `auth/callback` olarak yakalanir
6. Root layout OTP'yi dogrular ve `/set-password` ekranina yonlendirir
7. Yeni sifre `supabase.auth.updateUser({ password })` ile yazilir

## Davet Linki ve Kodu

1. Agent veya full employee tenant, landlord veya employee daveti olusturur
2. Backend tek kullanmalik link ve 8 karakterlik kod uretir
3. Link ve kod ayni daveti temsil eder; biri kullanilinca digeri kapanir
4. Davetli rol secmez; rol davetten gelir
5. Yeni hesap `pending` baslar
6. Agent veya yetkili calisan pending kullaniciyi onaylar ya da reddeder

## Admin Dev Tools

1. Admin mobil uygulamada `/admin/dev-tools` ekranini acar
2. Backend `GET /api/admin/dev/users` ile kullanicilari listeler
3. Backend `GET /api/admin/dev/agents` ile agent ve agency seceneklerini listeler
4. Admin kullaniciyi role atar:
   - tenant / landlord / employee icin hedef agent zorunludur
   - employee icin `employee_access_level` secilir
   - agent icin `agency_id` secilebilir veya bos birakilabilir
5. `POST /api/admin/dev/link-user` `users` satirini ve Supabase Auth metadata'sini backend service-role ile gunceller

## Ekibim ve Mesajlasma

1. Agent/employee alt barda `Ekibim` ekranina gider
2. TeamHub tablari: Gorevler, Duyurular, Toplantilar, Harcamalar
3. Mesajlar `/agent/team-messages` tam ekran route'unda acilir
4. Gorsel ekler upload oncesi istemcide sikistirilir; image olmayan dosyalar oldugu gibi kalir
5. Ekli mesajlarda dosyalar private `team-message-files` bucket'ina `office_owner_id/user_id/timestamp-index-safe_name` formatinda yuklenir
6. Backend mesaj ve attachment metadata kaydini olusturur
7. Mesaj veya attachment metadata yazimi basarisiz olursa upload edilen storage objeleri cleanup edilir

## Landlord ve Tenant Operasyonlari

1. Tenant talepler yuzeyinden ariza bildirimi ve dekont yukleme akislarini acar
2. Landlord talepler ekraninda aktif talepler, dekontlar ve belgeler sekmelerini gorur
3. Dekont yukleme akisinda gorsel dosya ise upload oncesi istemcide sikistirilir; PDF sadece boyut kontrolunden gecer
4. Tenant dekontu geri cektiginde backend storage objesini fiziksel olarak siler, sonra receipt kaydini `withdrawn` durumuna alir
