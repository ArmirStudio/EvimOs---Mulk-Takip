# Admin Web

`admin-web/` bagimsiz React + Vite panelidir. Reklam kampanyasi yonetiminin kanonik arayuzu burasidir.

## Sorumluluk
- Kampanya listeleme.
- Kampanya create, update, delete.
- Aktiflik toggle.
- Duplicate.
- Medya upload.
- Canli mobil preview.
- Admin oturum dogrulamasi.

Admin-web kullanici role/ofis baglama araci degildir. Bu gecici operasyon mobil admin `/admin/dev-tools` ekranindadir.

## Mimari
- Auth icin anon key kullanan Supabase client vardir.
- Tum yazma islemleri backend `/api/admin/*` endpointlerine gider.
- Ortak kampanya ve lokasyon modelleri `shared/` alias'lari ile kullanilir.
- Client tarafinda `service_role` beklenmez ve kullanilmaz.

## Temel Dosyalar
- `src/lib/supabase.ts`
- `src/lib/api.ts`
- `src/pages/Login.tsx`
- `src/pages/CampaignList.tsx`
- `src/pages/CampaignForm.tsx`
- `src/hooks/useImageUpload.ts`
- `src/components/campaign/preview/PhonePreview.tsx`

## Kampanya Tipleri
- `inline_ad`
- `news`
- `testimonial`
- `service`
- `interstitial`

## Endpointler
- `GET /api/admin/session`
- `GET /api/admin/campaigns`
- `GET /api/admin/campaigns/{id}`
- `POST /api/admin/campaigns`
- `PATCH /api/admin/campaigns/{id}`
- `DELETE /api/admin/campaigns/{id}`
- `POST /api/admin/campaigns/{id}/toggle`
- `POST /api/admin/campaigns/{id}/duplicate`
- `GET /api/admin/agency-options`
- `POST /api/admin/uploads/public`

## Upload Kurallari
- Bucket: `ad-media`
- Upload backend tarafinda korunur.
- Sadece gorsel MIME type kabul edilir.
- Limit: 10 MB.

## Dogrulama
- Degisiklik sonrasi `admin-web` icinde `npm.cmd exec tsc -- --noEmit` kosulur.
