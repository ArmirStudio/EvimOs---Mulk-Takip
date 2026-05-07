# Veritabanı Şeması

Bu dosya canlı tabloların kritik alanlarını özetler.

## users
Önemli kolonlar:
- `id`, `auth_id`, `email`, `full_name`, `phone`
- `role`: `admin | agent | landlord | tenant | employee`
- `status`: `pending | active`
- `created_by`, `agency_id`, `invited_via_invite_id`
- `employee_access_level`: `full | limited`
- `preferred_currency`, `preferred_theme`
- `terms_accepted_at`, `first_login`
- `created_at`, `updated_at`

Not:
- Davetle gelen tenant/landlord `pending` başlar.
- Profil adı kullanıcının kendi adıdır; takma ad burada tutulmaz.

## invites
Agent kontrollü tenant/landlord/employee davetleri.

Önemli kolonlar:
- `id`, `office_owner_id`, `created_by`
- `role`: `tenant | landlord | employee`
- `contact_label`: agent takma adı
- `token_hash`, `code_hash`
- `prefill_full_name`, `prefill_phone`, `prefill_email`
- `expires_at`, `used_at`, `used_by`
- `revoked_at`, `revoked_by`
- `last_reminded_at`, `reminder_count`
- `created_at`, `updated_at`

Kurallar:
- Ham token ve ham kod DB'de saklanmaz.
- `contact_label` profil adı değildir.
- `employee_access_level`: agent onay anında `full | limited` atar; invite oluşturulurken sorulmaz.

## invite_events
Event tipleri: `created | registered | reminded | approved | rejected | label_updated | revoked`

## properties
- Aktif model `properties.tenant_id` ve `properties.landlord_id` üzerindedir.
- Çoklu property assignment bu fazda yoktur.

## team_meetings
Ofis ekibinin toplantı kayıtları.

Önemli kolonlar:
- `id`
- `office_owner_id` — agent'ın users.id (ekip kimliği)
- `created_by` — toplantıyı oluşturan users.id
- `title`, `description`, `notes`
- `scheduled_at` — planlanan tarih/saat (TIMESTAMPTZ)
- `status`: `scheduled | completed | cancelled`
- `created_at`, `updated_at`

RLS:
- Agent kendi ofisine ait toplantıları okur/yazar.
- Employee kendi agent'ının toplantılarını okur/yazar.
- Admin hepsini görür.

## team_messages
Ekip içi sohbet.

Önemli kolonlar:
- `id`
- `office_owner_id` — agent'ın users.id
- `sender_id` — mesajı gönderen users.id
- `body` — mesaj içeriği (max 2000 karakter)
- `reply_to_id` — yanıt verilen mesajın id'si (FK → team_messages, nullable)
- `created_at`

Not: `supabase/fix_team_messages.sql` eski `content/office_id` şemasını temizler.
Migration: `supabase/migrations/20260507_team_messages_v2.sql` ile `reply_to_id` eklenir.

## team_message_reads
Kullanıcı başına son okuma zamanı (okundu/okunmadı tiki için).

Önemli kolonlar:
- `office_owner_id` — agent'ın users.id (PK)
- `user_id` — okuyan users.id (PK)
- `last_read_at` — TIMESTAMPTZ

RLS:
- Ofis üyeleri kendi ofislerinin okuma kayıtlarını görür.
- Her kullanıcı yalnızca kendi kaydını yazar (UPSERT).

## office_expenses
Ofis gider kayıtları.

Önemli kolonlar:
- `id`
- `office_owner_id` — agent'ın users.id
- `created_by` — kaydı ekleyen users.id
- `amount` — NUMERIC, > 0
- `category`: `kira | fatura | ulasim | yemek | malzeme | diger`
- `category_label` — opsiyonel Türkçe etiket
- `description` — opsiyonel açıklama
- `expense_date` — DATE (YYYY-MM-DD)
- `receipt_url` — opsiyonel makbuz dosya yolu
- `created_at`, `updated_at`

RLS:
- Tüm ofis üyeleri (`office_owner_id` eşleşme) kayıtları okur.
- Agent ve employee kayıt oluşturabilir.
- Employee yalnızca `created_by = auth.uid()` olduğu kaydı düzenleyebilir/silebilir.
- Agent tüm ofis kayıtlarını düzenleyebilir/silebilir.
- Admin hepsini görür.

Deployment: `supabase/migrations/20260507_office_expenses.sql` çalıştırılmalı.

## Canlı Kaynaklar
- Fresh kurulum: `supabase/schema_parts/*`
- Mevcut DB patch: `supabase/current_db_invites_patch.sql`
- team_messages fix: `supabase/fix_team_messages.sql`
- Bekleyen migration'lar: `supabase/migrations/20260507_*.sql`
