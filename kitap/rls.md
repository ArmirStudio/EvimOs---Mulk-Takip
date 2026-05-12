# RLS ve Service Role

Bu dosya guvenlik sinirlarini ozetler. Rol matrisi icin `kitap/permissions.md` kullanilir.

## Temel Kural
- `frontend/` ve `admin-web/` icinde `service_role` anahtari kullanilmaz.
- `service_role` sadece backend server process icindedir.
- Client tarafinda gorulen Supabase anon key public kabul edilir.
- Guvenlik siniri anon key'in gizli olmasi degil, RLS ve backend scope kontroludur.

## Backend-first Yazma Akislari
- Admin user, agency, campaign ve dev user yazmalari backend `/api/admin/*` uzerinden yapilir.
- Yasal kabul `PATCH /api/users/me/legal-acceptance` ile backend uzerinden yazilir.
- Davet onay/red islemleri backend invite endpointleri uzerinden yapilir.
- Maintenance, receipts ve team notification fan-out backend tarafinda uretilir.

## Admin Dev Tools
- `/api/admin/dev/*` endpointleri yalniz `admin` rolune aciktir.
- Bu endpointlerde service-role backend tarafinda kullanilir.
- Tenant, landlord ve employee icin `created_by` baglantisi backend tarafinda dogrulanmis agent id ile yazilir.
- Auth metadata senkronizasyonu client tarafindan yapilmaz.

## Anon Key Notu
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` build'e gomulur.
- Anon key tek basina yetki vermez; RLS ve backend token dogrulamasi gerekir.

## Upload Notu
- `ad-media`, `agency-branding` ve `avatars` upload akislari backend `/api/admin/uploads/public` uzerinden gider.
- Backend bucket allow-list, MIME allow-list ve 10 MB limit uygular.
- Ekip mesaj ekleri `team-message-files` private bucket'ina authenticated Supabase storage upload ile gider.
- `team-message-files` path formati `office_owner_id/user_id/...` olmalidir.
- Mesaj eki metadata yazimi backend `/api/team/messages` icindedir.

## Reklam Sistemi
- Kampanya CRUD admin-web + backend kombinasyonundadir.
- Mobil uygulama reklam kampanyasi CRUD yapmaz.
- Mobil delivery backend `GET /api/dashboard/campaigns` ile filtrelenir.
- Interstitial impression kaydi istemcide `ad_impressions` tablosuna yazilir.
