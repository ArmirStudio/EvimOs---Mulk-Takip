# Yetkiler ve Izinler

Bu dosya canli erisim matrisini ve rol kurallarini ozetler.

## Roller
- `admin`: platform yoneticisi.
- `agent`: ofis sahibi.
- `employee (full)`: agent ofisine bagli tam yetkili calisan.
- `employee (limited)`: agent ofisine bagli sinirli yetkili calisan.
- `landlord`: ev sahibi.
- `tenant`: kiraci.

## Admin Yetkileri
| Islem | Admin |
|---|---|
| Agency olustur/duzenle | Evet |
| Agent olustur/duzenle | Evet |
| Mobil admin dev tools kullan | Evet |
| Manuel kullaniciyi role ata | Evet |
| Tenant/landlord/employee'i agent altina bagla | Evet |
| Agent icin agency ata | Evet |
| Reklam kampanyasi CRUD | Admin-web uzerinden evet |

Admin dev tools disindaki roller `/api/admin/dev/*` endpointlerinden 403 alir.

## Davet Yetkileri
| Islem | Admin | Agent | Employee Full | Employee Limited | Landlord | Tenant |
|---|---|---|---|---|---|---|
| Davet olustur | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Pending listele | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Pending onayla | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Pending reddet | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Takma ad gorme | Evet | Evet | Hayir | Hayir | Hayir | Hayir |
| Takma ad duzenleme | Evet | Evet | Hayir | Hayir | Hayir | Hayir |

## Kayit ve Baglanti Kurali
- Tenant/landlord serbest kayit yapamaz.
- Kayit icin gecerli link, davet kodu veya admin dev tools ile manuel baglama gerekir.
- Kullanici public kayitta rol secemez.
- Tenant, landlord ve employee kayitlari bir agent altina `created_by = agent.id` ile baglanir.
- Employee icin `employee_access_level` `limited | full` olmak zorundadir.
- Agent kaydi opsiyonel olarak agency altina baglanir.

## Takma Ad Gizliligi
- `contact_label` agent'in ozel takip adidir.
- Full employee, tenant ve landlord bu alani gormez.
- Sistem geneli ekranlarda `users.full_name` kullanilir.
- Agent kendi panelinde profil adi ve takma ad ile arama yapabilir.

## Rehber Izinleri
- Rehberden secim mobil cihazda native contact picker ile yapilir.
- Tum rehber sisteme aktarilmaz.
- Sadece secilen kisinin ad, telefon ve e-posta bilgisi alinir.
- Web veya izin reddi durumunda manuel giris kullanilir.
