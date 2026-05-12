# Backend

Backend FastAPI ile calisir ve Supabase'e yalniz server tarafinda service-role ile baglanir. Mobil istemci normal akislar icin once `frontend/services/appApi.ts` uzerinden backend'e gider; client tarafinda `service_role` anahtari bulunmaz.

## Aktif Router'lar

- `auth`
- `users`
- `properties`
- `receipts`
- `maintenance`
- `dashboard`
- `team`
- `admin`
- `invites`

## Auth Endpointleri

- `GET /api/auth/verify`: access token ve `public.users` profilini dogrular
- `POST /api/auth/resolve-identifier`: telefon veya e-posta girisini Supabase Auth e-postasina cozer

Telefon cozumleme login ve sifremi unuttum akislarinda kullanilir. Telefon backend'de normalize edilir; client dogrudan kullanici tablosunu taramaz.

## Users Endpointleri

- `GET /api/users/me`: aktif kullanici profili
- `PATCH /api/users/{id}`: kullanici tercihleri ve profil guncelleme
- `PATCH /api/users/me/legal-acceptance`: ilk giris yasal kabulunu yazar
- `PATCH /api/users/me/complete-onboarding`: agent onboarding tamamlama

### legal-acceptance Davranisi

`legal-acceptance` endpoint'i yalnizca `terms_accepted_at = now()` yazar.

**Onemli**: `first_login` bu adimda `false` yapilmaz. `first_login` yalnizca `complete-onboarding` endpoint'i tarafindan yazilir. Bu, root layout guard'inin `first_login === true` olan agent'i onboarding ekranina yonlendirmesini saglar.

### complete-onboarding Davranisi

`PATCH /api/users/me/complete-onboarding`:
- Yalnizca `agent` rolune aciktir; diger roller 403 alir
- `onboarded_at = now()` ve `first_login = false` yazar
- `updated_at` guncellenir
- Basarili yanit: `{ success: true, user: {...} }`

## Admin Endpointleri

Admin mutation akislari backend `/api/admin/*` altindadir.

Temel admin endpointleri:
- `GET /api/admin/session`
- `GET /api/admin/dashboard`
- `GET /api/admin/agencies`
- `POST /api/admin/agencies`
- `PATCH /api/admin/agencies/{id}`
- `GET /api/admin/agents`
- `POST /api/admin/agents`
- `PATCH /api/admin/agents/{id}`
- `GET /api/admin/campaigns`
- `POST /api/admin/campaigns`
- `PATCH /api/admin/campaigns/{id}`
- `DELETE /api/admin/campaigns/{id}`
- `POST /api/admin/uploads/public`

## Admin Dev Endpointleri

Gecici mobil admin araci `/admin/dev-tools` su endpointleri kullanir:

- `GET /api/admin/dev/users`: manuel veya eksik bagimli kullanicilari listeler
- `GET /api/admin/dev/agents`: agent ve agency seceneklerini listeler
- `POST /api/admin/dev/link-user`: kullaniciyi role ve hedef ofise baglar

Davranis:
- Sadece `admin` rolune aciktir; diger roller 403 alir
- `tenant`, `landlord` ve `employee` icin hedef agent zorunludur
- Bu roller icin `users.created_by = selectedAgent.id` yazilir
- `employee` icin `employee_access_level = limited | full` yazilir
- `agent` icin `agency_id` secilebilir veya temizlenebilir
- `status` `active | pending` olarak admin tarafindan ayarlanabilir
- Supabase Auth metadata backend service-role ile senkronlanir

## Team Endpointleri

### Gorevler
- `GET /api/team/tasks`
- `GET /api/team/tasks/{id}`
- `POST /api/team/tasks`
- `PATCH /api/team/tasks/{id}`
- `POST /api/team/tasks/{id}/transition`

### Duyurular
- `GET /api/team/announcements`
- `POST /api/team/announcements`
- `POST /api/team/announcements/{id}/read`
- `POST /api/team/announcements/{id}/remind`

### Mesajlar
- `GET /api/team/messages`: mesaj listesi, reply preview ve `attachments[]`
- `POST /api/team/messages`: `{ body, reply_to_id?, attachments? }`
- `POST /api/team/messages/read`: kullanicinin son okuma zamanini upsert eder
- `GET /api/team/messages/read-status`: ofis uyelerinin `last_read_at` degerleri

Ek kurallari backend tarafinda dogrulanir: mesaj basina en fazla 5 ek, dosya basina 10 MB, path prefix, MIME allow-list ve ayni ofis reply kontrolu.
- Beklenen attachment path formati: `office_owner_id/user_id/timestamp-index-safe_name`
- Attachment metadata insert'i basarisiz olursa backend message row cleanup ile birlikte `team-message-files` storage cleanup de yapar

### Toplantilar, Harcamalar ve Rapor
- `GET /api/team/meetings`
- `POST /api/team/meetings`
- `PATCH /api/team/meetings/{id}`
- `POST /api/team/meetings/{id}/complete`
- `DELETE /api/team/meetings/{id}`
- `GET /api/team/expenses/summary`
- `GET /api/team/expenses`
- `POST /api/team/expenses`
- `PATCH /api/team/expenses/{id}`
- `DELETE /api/team/expenses/{id}`
- `GET /api/team/report?range=this_week|last_week|this_month|last_month`

## Receipt Davranisi

- `POST /api/receipts/upload`: replacement senaryosunda yeni dekont basarili olduktan sonra eski `rejected` / `withdrawn` dosyayi orphan birakmaz
- `POST /api/receipts/{receipt_id}/withdraw`: receipt status'unu `withdrawn` yapmadan once private `receipts` bucket'indaki fiziksel dosyayi siler
- Withdraw tamamlandiginda `document_url` ve `storage_path` temizlenir; event kaydi korunur

## Storage Helper

- `backend/core/storage.py` normalize path ve service-role storage delete helper'larini tutar
- Backend tarafinda cleanup gereken receipt ve message attachment akislari bu helper uzerinden calisir

## Invite Endpointleri

- `POST /api/invites`: tenant, landlord veya employee daveti olusturur
- `GET /api/public/invites/{token}`: link token dogrular
- `POST /api/public/invites/{token}/register`: token ile pending hesap olusturur
- `POST /api/public/invites/lookup-code`: davet kodunu dogrular
- `POST /api/public/invites/register-code`: kod ile pending hesap olusturur
- `GET /api/invites/pending`: pending kullanicilari listeler
- `PATCH /api/invites/pending/{user_id}`: onay veya takma ad guncelleme
- `DELETE /api/invites/pending/{user_id}`: pending kullaniciyi reddeder
- `POST /api/invites/remind`: 24 saat cooldown ile hatirlatma gonderir

## Railway Deploy

- Backend Railway uzerinde `backend/` servis kokunden calisir
- Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Zorunlu env:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `ALLOWED_ORIGINS`
- Frontend prod baglantisi: `EXPO_PUBLIC_API_URL=https://<railway-app>.up.railway.app`
- `EXPO_PUBLIC_API_URL` sonuna `/api` eklenmez; client otomatik ekler

## Guvenlik Notlari

- Davet kodu ve link token ham saklanmaz; hash tutulur
- Link ve kod tek kullanmaliktir
- Rol davetten veya admin dev aracindan gelir; public register role override edemez
- Admin, agency, campaign ve dev user yazma islemleri backend tarafinda role check ile korunur
- Backend kontrat testi: `python -m unittest backend.tests.test_admin_dev_contract`
