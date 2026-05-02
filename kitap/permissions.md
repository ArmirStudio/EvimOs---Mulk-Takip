# Yetkiler ve Izinler

Bu dosya canli erisim matrisini ve davet kurallarini ozetler.

## Roller
- `admin`
- `agent`
- `employee (full)`
- `employee (limited)`
- `landlord`
- `tenant`

## Davet Yetkileri
| Islem | Admin | Agent | Employee Full | Employee Limited | Landlord | Tenant |
|---|---|---|---|---|---|---|
| Davet olustur | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Pending listele | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Pending onayla | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Pending reddet | Evet | Evet | Evet | Hayir | Hayir | Hayir |
| Takma ad gorme | Evet | Evet | Hayir | Hayir | Hayir | Hayir |
| Takma ad duzenleme | Evet | Evet | Hayir | Hayir | Hayir | Hayir |

## Takma Ad Gizliligi
- `contact_label` agent'in ozel takip adidir.
- Full employee, tenant, landlord ve kullanici tarafinda bu alan gosterilmez.
- Sistem geneli ekranlarda temiz profil adi `users.full_name` kullanilir.
- Agent kendi panelinde profil adi ve takma ad ile arama yapabilir.

## Kayit Kurali
- Tenant/landlord serbest kayit yapamaz.
- Kayit icin gecerliligi devam eden link veya davet kodu gerekir.
- Kod ve link ayni 24 saatlik tek kullanimlik davettir.
- Kullanici rol secemez; rol davetten gelir.

## Rehber Izinleri
- Rehberden secim sadece mobil cihazda native contact picker ile yapilir.
- Tum rehber sisteme aktarilmaz.
- Sadece secilen kisinin ad, telefon ve e-posta bilgisi davet formuna alinir.
- Web veya izin reddi durumunda manuel giris kullanilir.
