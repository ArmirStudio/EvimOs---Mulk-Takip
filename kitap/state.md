# Proje Durumu

Bu dosya canli durum kaydidir.

## Mevcut Durum
- Durum: Davet Akisi V1.2 uygulandi.
- Son odak: link + kod kaydi, rehberden tek kisi secme, takma ad ayrimi ve pending bekleme akisi.

## Tamamlananlar
- Acilis ekranina `Giris Yap` ve `Kayit Ol` CTA'lari eklendi.
- `/register` davet kodu lookup + kayit ekrani eklendi.
- `/invite/[token]` bozuk link durumunda kodla devam edebilir hale geldi.
- Backend invite endpointleri link + kod modeline genisletildi.
- Davet kodu hash'li saklanir; ham kod yalniz olusturma response'unda doner.
- Agent davet ekranina rehberden tek kisi secme ve manuel bilgi girisi eklendi.
- Telefon normalizasyonu frontend ve backend tarafinda eklendi.
- `contact_label` takma ad olarak korundu; profil adindan ayrildi.
- Full employee takma adi gormeyecek sekilde pending ve user list response'lari sinirlandi.
- Pending kullanici bekleme ekrani, alt bar kilidi ve 24 saat hatirlatma cooldown'u korunuyor.
- `kitap/` dokumantasyonu davet V1.2 durumuna gore sadelestirildi.

## Acik Notlar
- Canli veritabaninda `supabase/current_db_invites_patch.sql` uygulanmadan yeni kodlu davetler calismaz.
- Native rehber secimi icin yeni build gerekir; `expo-contacts` plugin ve permission config'i eklendi.
- Repo genelindeki eski type/lint borclari bu is kapsaminda tamamen temizlenmedi.
