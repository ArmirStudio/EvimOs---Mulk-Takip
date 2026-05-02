# Backend Dokumantasyonu

Backend FastAPI ile calisir ve Supabase'e service-role ile baglanir. Mobil istemci normalde `frontend/services/appApi.ts` uzerinden backend'e gider.

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

## Invite Endpointleri
- `POST /api/invites`
  - Agent/full employee davet olusturur.
  - Request: `role`, `contact_label`, opsiyonel `prefill_full_name`, `prefill_phone`, `prefill_email`.
  - Response: `invite`, `token`, `link`, `code`.
- `GET /api/public/invites/{token}`
  - Link tokenini dogrular ve public invite bilgisini doner.
- `POST /api/public/invites/{token}/register`
  - Token ile tenant/landlord pending hesap olusturur.
- `POST /api/public/invites/lookup-code`
  - 8 karakterlik davet kodunu dogrular.
- `POST /api/public/invites/register-code`
  - Kod ile pending hesap olusturur.
- `GET /api/invites/pending`
  - Agent/full employee pending kullanicilari listeler.
- `GET /api/invites/pending/{user_id}`
  - Pending detayini doner.
- `PATCH /api/invites/pending/{user_id}`
  - `approve` herkes icin; `update_label` sadece agent/admin icin.
- `DELETE /api/invites/pending/{user_id}`
  - Pending kullaniciyi reddeder ve auth/profile kaydini siler.
- `POST /api/invites/remind`
  - Pending kullanicinin 24 saat cooldown ile hatirlatma gondermesini saglar.

## Guvenlik Kurallari
- Davet kodu ham saklanmaz; `code_hash` tutulur.
- Token ve kod ayni invite kaydina baglidir.
- Link/kod tek kullanimliktir ve 24 saat sonra expire olur.
- Rol davetten gelir; register payload role override edemez.
- Telefon backend'de `+905321234567` formatina normalize edilir.
- Full employee takma adi API response'unda goremez; agent/admin gorebilir.
