# Proje Durumu

Bu dosya canli durum kaydidir. Tarihsel notlar karar kaynagi degildir; aktif kararlar icin bu dosya, `docs/` ve `supabase/schema_parts/` onceliklidir.

## Mevcut Durum
- Frontend Expo Router mobil/web yuzeyi TypeScript kontrolunden geciyor.
- `admin-web/` Vite paneli TypeScript kontrolunden geciyor.
- Backend FastAPI route dosyalari Python compile kontrolunden geciyor.
- Admin reklam CRUD kanonik olarak `admin-web/` + backend `/api/admin/*` uzerindedir.
- Mobil admin yuzeyinde platform operasyonlari ve gecici gelistirme araci vardir.

## Son Uygulanan Paket
- Mobil admin gelistirme sayfasi eklendi: `/admin/dev-tools`.
- Backend admin dev endpointleri eklendi:
  - `GET /api/admin/dev/users`
  - `GET /api/admin/dev/agents`
  - `POST /api/admin/dev/link-user`
- Supabase'de manuel olusan kullanicilar admin tarafindan role atanabilir.
- Tenant, landlord ve employee kayitlari secilen agent altina `users.created_by = agent.id` ile baglanir.
- Employee icin `employee_access_level` admin dev aracindan `limited | full` olarak ayarlanabilir.
- Agent kayitlari icin `agency_id` admin dev aracindan atanabilir veya bos birakilabilir.
- Auth metadata backend service-role ile guncellenir; client tarafinda service-role kullanilmaz.

## Auth ve Yayina Hazirlik
- Ilk giris sozlesme/onay akisi aktif:
  - `users.terms_accepted_at` bos ise aktif kullanici `/legal-acceptance` ekranina yonlenir.
  - Kabul islemi `PATCH /api/users/me/legal-acceptance` ile backend tarafinda yazilir.
  - `first_login` kabulden sonra `false` olur.
- `forgot-password` akisi eklendi:
  - Kullanici e-posta veya telefon girer.
  - Telefon once `/api/auth/resolve-identifier` ile e-postaya cozulur.
  - Supabase reset password e-postasi gonderilir.
  - Deep link callback mevcut `/set-password` ekranina duser.
- Admin logout artik Supabase oturumunu da kapatir.
- Mobil admin agent olusturma ekraninda hardcoded `1234` sifre kullanimi kaldirildi; gecici sifre backend ortam ayarlarindan gelir.

## Temizlik
- Kaldirilan kok dosyalar:
  - `backend/cd`
  - `create-export.ps1`
  - `sorun`
  - `test_result.md`
  - `CLAUDE.md`
- Kanonik repo rehberi `AGENTS.md` olarak kalir.
- Eski test protokolu ve eski mutlak export script'i karar kaynagi degildir.

## Dogrulama
- `frontend`: `npm.cmd exec tsc -- --noEmit`
- `admin-web`: `npm.cmd exec tsc -- --noEmit`
- Backend compile: `python -m py_compile backend/main.py backend/api/routes/admin.py backend/api/routes/users.py backend/api/routes/auth.py backend/api/routes/invites.py backend/models/schemas.py`
- Backend kontrat testi: `python -m unittest backend.tests.test_admin_dev_contract`

## Acik Notlar
- Canli DB migration durumu ortam bazinda ayrica kontrol edilmelidir.
- Admin dev tools gecici operasyon aracidir; production'da gorunurluk istenirse env flag ile kisitlanabilir.
- Manuel smoke halen gerekir:
  - Supabase'de manuel kullanici olustur.
  - Mobil admin `/admin/dev-tools` ile kullaniciyi role ata ve agent altina bagla.
  - Kullanici login oldugunda dogru dashboard'a yonlensin.
  - Ilk giriste sozlesme kabul ekrani gelsin.
  - Sifre sifirlama linki `/set-password` akisina dussun.
