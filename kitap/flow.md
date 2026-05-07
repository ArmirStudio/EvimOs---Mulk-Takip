# İş Akışları

Bu dosya canlı kritik akışları özetler.

## Giriş ve Kayıt
1. Açılış ekranında `Giriş Yap` ve `Kayıt Ol` bulunur.
2. `Giriş Yap` oturum ekranına gider.
3. `Kayıt Ol` davet kodu ekranına gider; tenant/landlord serbest kayıt yapamaz.
4. Bozuk davet linkinde kullanıcı aynı ekranda davet kodu girerek devam edebilir.
5. Label ve inputlar bitişik tasarlanmaz; form ritmi token spacing ile korunur.

## Davet Linki ve Kodu
1. Agent veya full employee rol seçer: kiracı, ev sahibi veya çalışan.
2. Kişi manuel girilir veya cihaz rehberinden tek kişi seçilir.
3. Rehberden yalnız seçilen kişinin bilgisi forma alınır.
4. Agent takma ad alanını doldurabilir.
5. Backend tek kullanımlık link ve 8 karakterlik kod üretir.
6. Link ve kod aynı daveti temsil eder; biri kullanılınca diğeri de kapanır.

## Pending ve Onay
1. Kullanıcı link veya kodla kayıt formunu açar.
2. Rol davetten gelir; kullanıcı rol seçemez.
3. Yeni hesap `pending` başlar.
4. Pending tenant/landlord sadece bekleme ekranını görür.
5. Agent/full employee pending kullanıcıyı onaylayabilir veya reddedebilir.
6. Agent takma adı görebilir ve düzenleyebilir; full employee göremez.

## Tenant Talepler
1. Tenant alt barda `Talepler` ekranına gider; alt barda FAB yoktur.
2. Arıza bildirimi ve dekont yükleme aksiyonları talepler yüzeyi içinden açılır.

## Ekibim ve Mesajlaşma
1. Agent/employee alt barda `Ekibim` → `TeamHubScreen` açılır.
2. Tab bar yatay kaydırılabilir: **Görevler · Duyurular · Toplantılar · Harcamalar**.
3. Tab geçişleri yerel `useState` ile yönetilir — URL param sadece ilk açılışta ve deep link için okunur; animasyon yoktur.
4. Header sağındaki mesaj ikonu → `/agent/team-messages` sağdan kayarak tam ekran açılır.
5. Harcama ekle: Harcamalar tab'ında "Harcama Ekle" → bottom sheet → tutar gir, kategori seç, kaydet.
6. Employee kendi harcamasını açıklama/tarih değişikliğiyle düzenleyebilir; miktar ve kategori değiştirilemez.
7. Agent herkesin harcamasını silebilir.

## Mesajlaşma UX
1. Ekran açılınca en alta scroll yapılır; `markMessagesRead` çağrılır.
2. Mesaj balonları: kendi mesajı sağda (açık renk), diğerlerinin mesajı solda (avatar baş harfi + gönderen adı).
3. Gün ayraçları: "Bugün", "Dün" veya "5 Ocak 2026" formatında günler arasında gösterilir.
4. Uzun basış (long press) mesaj üzerinde → yanıt barı açılır (altta önizleme + × ile iptal).
5. Yanıt barı aktifken gönderilen mesaj, alıcıda quote kutusu içinde gösterilir.
6. Gördü tiki: tek tik ✓ = gönderildi, çift tik ✓✓ = en az 1 üye gördü (mavi).
7. Klavye açılınca composer yukarı kayar (KeyboardAvoidingView).

## Çalışan Davet ve Onay
1. Agent `Ekibim → Çalışan Ekle` veya `/agent/invite` üzerinden çalışan davet eder.
2. Çalışan link/kod ile pending hesap oluşturur.
3. Agent pending listesinde tam/sınırlı yetki seçerek onaylar.
4. Onay anında `employee_access_level` set edilir; davet oluşturulurken sorulmaz.

## Landlord Talepler ve Arşiv
1. Landlord alt barda `Talepler` ekranına gider; `Arşiv` ayrı alt bar sekmesi değildir.
2. `Aktif Talepler` sekmesinde bakım talepleri izlenir.
3. `Dekontlar` sekmesinde ödeme dekontları listelenir ve detay açılır.
4. `Belgeler` sekmesinde mülk belgeleri listelenir ve signed URL ile açılır.
5. Eski `/landlord/archive` linki talepler/dekontlar sekmesine yönlenir.
