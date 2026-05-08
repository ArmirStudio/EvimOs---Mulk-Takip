# Backend

Backend FastAPI ile çalışır ve Supabase'e service-role ile bağlanır. Mobil istemci backend'e `frontend/services/appApi.ts` üzerinden gider.

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

## Railway Deploy
- Backend Railway üzerinde `backend/` servis kökünden çalışır.
- Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Zorunlu env:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `ALLOWED_ORIGINS`
- Frontend prod bağlantısı: `EXPO_PUBLIC_API_URL=https://<railway-app>.up.railway.app`
- `EXPO_PUBLIC_API_URL` sonuna `/api` eklenmez; client otomatik ekler.

## Team Endpointleri

### Görevler
- `GET /team/tasks` — ofis görevleri listesi
- `GET /team/tasks/{id}` — görev detayı
- `POST /team/tasks` — görev oluşturma (manager)
- `PATCH /team/tasks/{id}` — görev güncelleme (manager)
- `POST /team/tasks/{id}/transition` — durum geçişi (start/complete/cancel)

### Duyurular
- `GET /team/announcements` — duyuru listesi
- `POST /team/announcements` — duyuru oluşturma (manager)
- `POST /team/announcements/{id}/read` — okundu işaretle
- `POST /team/announcements/{id}/remind` — okunmayanlara hatırlat

### Mesajlar
- `GET /team/messages` — mesaj listesi (reply_to inline önizleme ve `attachments[]` dahil)
- `POST /team/messages` — mesaj gönder; payload: `{ body, reply_to_id?, attachments? }`
  - `body` boş olabilir, ancak `body` veya en az bir ek zorunludur.
  - `attachments[]`: `bucket='team-message-files'`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `kind`.
  - Backend ek sayısını (max 5), dosya boyutunu (max 10 MB), MIME tipini, path prefix'ini ve reply mesajının aynı ofise ait olduğunu doğrular.
  - Ekli mesajlarda notification body boş metin yerine `Ek gonderildi` fallback'i kullanır.
- `POST /team/messages/read` — kullanıcının son okuma zamanını UPSERT eder
- `GET /team/messages/read-status` — tüm ofis üyelerinin `last_read_at` değerleri

### Toplantılar
- `GET /team/meetings` — toplantı listesi
- `POST /team/meetings` — toplantı oluştur (manager)
- `PATCH /team/meetings/{id}` — toplantı güncelle (manager)
- `POST /team/meetings/{id}/complete` — tamamlandı (manager)
- `DELETE /team/meetings/{id}` — iptal et (manager)

### Harcamalar
- `GET /team/expenses/summary` — 12 aylık kategori özeti (agent only)
- `GET /team/expenses` — ofis harcamaları listesi
- `POST /team/expenses` — harcama ekle; miktar > 0 ve YYYY-MM-DD tarih zorunlu
- `PATCH /team/expenses/{id}` — açıklama/tarih/makbuz_url güncelle; miktar ve kategori değiştirilemez
- `DELETE /team/expenses/{id}` — sil; agent tümünü, employee yalnızca kendi kaydını silebilir

Not: `/team/expenses/summary` path'i `/team/expenses/{id}` ile çakışmaması için liste endpoint'inden önce tanımlanmıştır.

### Rapor
- `GET /team/report?range=this_week|last_week|this_month|last_month` — dönem bazlı ekip performans raporu

## Invite Endpointleri
- `POST /api/invites`: davet oluşturur (tenant/landlord/employee).
- `GET /api/public/invites/{token}`: link token doğrular.
- `POST /api/public/invites/{token}/register`: token ile pending hesap oluşturur.
- `POST /api/public/invites/lookup-code`: davet kodunu doğrular.
- `POST /api/public/invites/register-code`: kod ile pending hesap oluşturur.
- `GET /api/invites/pending`: pending kullanıcıları listeler.
- `PATCH /api/invites/pending/{user_id}`: onay veya takma ad güncelleme.
- `DELETE /api/invites/pending/{user_id}`: pending kullanıcıyı reddeder.
- `POST /api/invites/remind`: 24 saat cooldown ile hatırlatma gönderir.

## Güvenlik
- Davet kodu ham saklanmaz; `code_hash` tutulur.
- Link ve kod tek kullanımlıktır.
- Rol davetten gelir; register payload role override edemez.
- Telefon backend'de `+905321234567` formatına normalize edilir.
- Full employee takma adı API response'unda göremez; agent/admin görebilir.
- Client tarafında `service_role` anahtarı kullanılmaz.
