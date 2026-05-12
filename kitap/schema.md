# Veritabani Semasi

Bu dosya canli tablolarin kritik alanlarini ozetler. Tam kaynak icin `supabase/schema_parts/` ve `supabase/migrations/` kullanilir.

## users

Onemli kolonlar:
- `id`, `auth_id`, `email`, `full_name`, `phone`
- `role`: `admin | agent | landlord | tenant | employee`
- `status`: `pending | active`
- `created_by`, `agency_id`, `invited_via_invite_id`
- `employee_access_level`: `full | limited`
- `preferred_currency`, `preferred_theme`
- `terms_accepted_at` — yasal kabul zamani; bos olan aktif kullanici `/legal-acceptance` ekranina yonlendirilir
- `first_login` — yalnizca `complete-onboarding` endpoint'i tarafindan `false` yapilir
- `onboarded_at` — agent ilk sifre belirleme tamamlandiginda set edilir; bu alani bos olan agent onboarding guard'i tetikler
- `created_at`, `updated_at`

Kurallar:
- Tenant, landlord ve employee bir agent altina `created_by = agent.users.id` ile baglanir
- Agent kaydi opsiyonel olarak `agency_id` ile agency altina baglanir
- `terms_accepted_at` yasal kabul endpoint'i tarafindan yazilir; `first_login` bu adimda degismez
- `first_login = false` yalnizca `PATCH /api/users/me/complete-onboarding` ile yazilir
- `onboarded_at` bostan farkli olan agent bir daha force-password-change ekranini gormez

## invites

Agent kontrollu tenant, landlord ve employee davetleri.

Onemli kolonlar:
- `id`, `office_owner_id`, `created_by`
- `role`: `tenant | landlord | employee`
- `contact_label`
- `token_hash`, `code_hash`
- `prefill_full_name`, `prefill_phone`, `prefill_email`
- `expires_at`, `used_at`, `used_by`
- `revoked_at`, `revoked_by`
- `last_reminded_at`, `reminder_count`
- `created_at`, `updated_at`

Kurallar:
- Ham token ve ham kod DB'de saklanmaz
- `contact_label` agent'in ozel takip adidir; profil adi degildir
- Davetli rol secemez; rol davetten gelir

## agencies

Sirket/ofis kayitlari admin tarafindan yonetilir. Agent kaydi `users.agency_id` ile agency altina baglanabilir.

## properties

- Aktif model `properties.tenant_id` ve `properties.landlord_id` uzerindedir
- Coklu property assignment bu fazda yoktur

## team_messages

Ekip ici sohbet.

Onemli kolonlar:
- `id`
- `office_owner_id`: agent'in `users.id` degeri
- `sender_id`
- `body`
- `reply_to_id`
- `created_at`

Kurallar:
- RLS helper-function tabanlidir; `auth.uid()` dogrudan `public.users.id` ile eslenmez
- Reply kontrolu ayni `office_owner_id` scope'u icinde zorunludur

## team_message_attachments

Ekip mesajlarina bagli private dosya ekleri.

Onemli kolonlar:
- `id`, `message_id`, `office_owner_id`, `uploaded_by`
- `bucket`: `team-message-files`
- `storage_path`: `office_owner_id/uploaded_by/timestamp-index-safe_name`
- `file_name`, `mime_type`, `size_bytes`
- `kind`: `image | document | file`
- `created_at`

Kurallar:
- Mesaj basina en fazla 5 ek
- Dosya basina en fazla 10 MB
- `audio/*` ve `video/*` kabul edilmez
- Ekler public URL degildir; private bucket + signed URL ile acilir
- Mesaj veya attachment insert'i basarisiz olursa orphan storage objesi birakilmaz

## team_message_reads

Kullanici basina son okuma zamani.

Onemli kolonlar:
- `office_owner_id` PK parcasi
- `user_id` PK parcasi
- `last_read_at`

Kurallar:
- Kullanici yalniz kendi `last_read_at` kaydini upsert eder
- Ofis sahibi ayni office scope'undaki read durumlarini gorebilir

## team_meetings

Ofis ekibinin toplanti kayitlari.

Onemli kolonlar:
- `id`, `office_owner_id`, `created_by`
- `title`, `description`, `notes`
- `scheduled_at`
- `status`: `scheduled | completed | cancelled`
- `created_at`, `updated_at`

## office_expenses

Ofis gider kayitlari.

Onemli kolonlar:
- `id`, `office_owner_id`, `created_by`
- `amount`
- `category`: `kira | fatura | ulasim | yemek | malzeme | diger`
- `description`, `expense_date`, `receipt_url`
- `created_at`, `updated_at`

Kurallar:
- Agent tum ofis giderlerini duzenleyebilir ve silebilir
- Employee yalniz kendi olusturdugu giderleri duzenleyebilir ve silebilir

## receipts

Dekont kayitlari ve dosya yasam dongusu.

Onemli kolonlar:
- `id`, `property_id`, `uploaded_by`
- `receipt_type`, `amount`, `month`
- `status`: `pending | approved | rejected | withdrawn`
- `document_url`, `storage_path`
- `replaces_receipt_id`
- `withdrawn_at`, `withdrawn_by`, `withdrawal_reason`
- `created_at`, `updated_at`

Kurallar:
- Dekont upload'inda dosya private `receipts` bucket'ina yuklenir
- Tenant `pending` veya `rejected` dekontu geri cektiginde fiziksel storage objesi silinir
- Geri cekilen dekontta `document_url` ve `storage_path` temizlenir; audit izi `receipt_events` uzerinde kalir
- Replacement upload basarili olduktan sonra eski `rejected` / `withdrawn` dosya orphan birakilmaz

## campaign Tablolari

Reklam kampanyasi tablolari `admin-web/` ve backend `/api/admin/*` tarafindan yonetilir. Mobil uygulama kampanya CRUD yapmaz; yalniz dashboard delivery ve impression yazimi vardir.

## Migrationlar

Uygulanmis migration dosyalari `supabase/migrations/` altinda:

- `20260512_supabase_alignment_and_storage_cleanup.sql`
- `20260512_team_messages_helper_policy_fix.sql`
- `20260512_team_message_policy_qualification_fix.sql`
- `20260512_agent_onboarding.sql` — `users.onboarded_at TIMESTAMPTZ` kolonu eklendi

## Canli Kaynaklar

- Fresh kurulum: `supabase/schema_parts/*`
- Migrationlar: `supabase/migrations/*`
- RLS ozeti: `kitap/rls.md`
- Yetki matrisi: `kitap/permissions.md`
