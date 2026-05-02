# Veritabani Semasi

Bu dosya canli tablolarin kritik alanlarini ozetler.

## users
Onemli kolonlar:
- `id`, `auth_id`, `email`, `full_name`, `phone`
- `role`: `admin | agent | landlord | tenant | employee`
- `status`: `pending | active`
- `created_by`, `agency_id`, `invited_via_invite_id`
- `employee_access_level`: `full | limited`
- `preferred_currency`, `preferred_theme`
- `terms_accepted_at`, `first_login`
- `created_at`, `updated_at`

Not:
- Davetle gelen tenant/landlord `pending` baslar.
- Profil adi kullanicinin kendi adidir; takma ad burada tutulmaz.

## invites
Agent kontrollu tenant/landlord davetleri.

Onemli kolonlar:
- `id`
- `office_owner_id`
- `created_by`
- `role`: `tenant | landlord`
- `contact_label`: agent takma adi / rehber adi
- `token_hash`: link token hash'i
- `code_hash`: davet kodu hash'i
- `prefill_full_name`, `prefill_phone`, `prefill_email`
- `expires_at`, `used_at`, `used_by`
- `revoked_at`, `revoked_by`
- `last_reminded_at`, `reminder_count`
- `created_at`, `updated_at`

Kurallar:
- Ham token ve ham kod DB'de saklanmaz.
- `contact_label` profil adi degildir.
- Prefill alanlari yalniz kayit formunu doldurmaya yardim eder; kullanici kendi bilgilerini degistirebilir.

## invite_events
Invite audit kayitlari.

Event tipleri:
- `created`
- `registered`
- `reminded`
- `approved`
- `rejected`
- `label_updated`
- `revoked`

## properties
Aktif model halen `properties.tenant_id` ve `properties.landlord_id` uzerindedir. Coklu property assignment bu fazda yoktur.

## Canli Schema Kaynaklari
- Fresh kurulum parcalari: `supabase/schema_parts/*`
- Mevcut DB davet patch'i: `supabase/current_db_invites_patch.sql`
