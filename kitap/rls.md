# RLS ve Service Role

Bu dosya guvenlik sinirlarini ozetler. Rol matrisi icin `kitap/permissions.md` kullanilir.

## Temel Kural

- `frontend/` ve `admin-web/` icinde `service_role` anahtari kullanilmaz
- `service_role` sadece backend server process icindedir
- Client tarafinda gorulen Supabase anon key public kabul edilir
- Guvenlik siniri anon key'in gizli olmasi degil, RLS ve backend scope kontroludur

## Backend-first Yazma Akislari

- Admin user, agency, campaign ve dev user yazmalari backend `/api/admin/*` uzerinden yapilir
- Yasal kabul `PATCH /api/users/me/legal-acceptance` ile backend uzerinden yazilir; yalnizca `terms_accepted_at` degisir
- Agent onboarding tamamlama `PATCH /api/users/me/complete-onboarding` ile yapilir; `onboarded_at` ve `first_login` degisir
- Davet onay/red islemleri backend invite endpointleri uzerinden yapilir
- Maintenance, receipts ve team notification fan-out backend tarafinda uretilir

## Admin Dev Tools

- `/api/admin/dev/*` endpointleri yalniz `admin` rolune aciktir
- Bu endpointlerde service-role backend tarafinda kullanilir
- Tenant, landlord ve employee icin `created_by` baglantisi backend tarafinda dogrulanmis agent id ile yazilir
- Auth metadata senkronizasyonu client tarafindan yapilmaz

## Anon Key Notu

- `EXPO_PUBLIC_SUPABASE_ANON_KEY` build'e gomulur
- Anon key tek basina yetki vermez; RLS ve backend token dogrulamasi gerekir

## Upload Notu

- `ad-media`, `agency-branding` ve `avatars` upload akislari backend `/api/admin/uploads/public` uzerinden gider
- Backend bucket allow-list, MIME allow-list ve 10 MB limit uygular
- Ekip mesaj ekleri `team-message-files` private bucket'ina authenticated Supabase storage upload ile gider
- `team-message-files` path formati `office_owner_id/user_id/timestamp-index-safe_name` olmalidir
- Mesaj eki metadata yazimi backend `/api/team/messages` icindedir
- Mesaj insert'i veya attachment metadata yazimi basarisiz olursa upload edilen `team-message-files` objeleri cleanup edilir
- `receipts` ve `property-documents` private bucket'larinda delete akislarina uygun `DELETE` policy vardir
- `receipts`, `property-documents`, `team-message-files`, `task-photos` ve `announcement-files` bucket'larinda overwrite/cleanup ihtiyaci icin gerekli `UPDATE` / `DELETE` policy seti tanimlidir

## Helper Function Kurali

- Team ve office kapsamli RLS policy'lerinde `auth.uid() = public.users.id` karsilastirmasi kullanilmaz
- Kanonik yaklasim helper-function tabanlidir:
  - `public.get_current_user_id()`
  - `public.get_current_office_owner_id()`
  - `public.get_current_user_role()`
  - `public.is_full_employee()`
- `team_messages`, `team_message_reads`, `team_meetings` ve `office_expenses` policy'leri bu helper'lar ile hizalanmistir
- `notifications.notif_insert` ve `announcement_recipients.ann_recipients_insert` artik acik `TRUE` policy degildir; actor scope kontrolu vardir

## Reklam Sistemi

- Kampanya CRUD admin-web + backend kombinasyonundadir
- Mobil uygulama reklam kampanyasi CRUD yapmaz
- Mobil delivery backend `GET /api/dashboard/campaigns` ile filtrelenir
- Interstitial impression kaydi istemcide `ad_impressions` tablosuna yazilir
