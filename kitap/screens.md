# Ekranlar ve Navigasyon

Bu dosya canli route haritasini ve rol bazli erisimi ozetler.

## Public ve Auth Route'lari
| Route | Dosya | Aciklama |
|---|---|---|
| `/` | `frontend/app/index.tsx` | Session kontrolu ve role gore yonlendirme |
| `/login` | `frontend/app/login.tsx` | E-posta veya telefonla giris |
| `/forgot-password` | `frontend/app/forgot-password.tsx` | Sifre sifirlama e-postasi gonderme |
| `/set-password` | `frontend/app/set-password.tsx` | Davet veya reset sonrasinda yeni sifre belirleme |
| `/register` | `frontend/app/register.tsx` | Davet kodu ile kayit |
| `/invite/[token]` | `frontend/app/invite/[token].tsx` | Link tabanli davet kaydi |
| `/legal-acceptance` | `frontend/app/legal-acceptance.tsx` | Ilk giris sozlesme kabul ekrani |

## Admin Route'lari
| Route | Dosya | Aciklama |
|---|---|---|
| `/admin/dashboard` | `frontend/app/admin/dashboard.tsx` | Mobil admin dashboard |
| `/admin/companies` | `frontend/app/admin/companies.tsx` | Sirket ve ofis listesi |
| `/admin/contacts` | `frontend/app/admin/contacts.tsx` | Agent ve employee rehberi |
| `/admin/dev-tools` | `frontend/app/admin/dev-tools.tsx` | Manuel kullanici role/ofis baglama araci |
| `/admin/settings` | `frontend/app/admin/settings.tsx` | Admin ayarlari, logout ve dev tools girisi |
| `/admin/create-company` | `frontend/app/admin/create-company.tsx` | Sirket/ofis olusturma |
| `/admin/edit-company` | `frontend/app/admin/edit-company.tsx` | Sirket/ofis duzenleme |
| `/admin/create-agent` | `frontend/app/admin/create-agent.tsx` | Agent olusturma |
| `/admin/edit-agent` | `frontend/app/admin/edit-agent.tsx` | Agent duzenleme |

Admin bottom nav: `Panel`, `Sirketler`, `Iletisim`, `Gelisim`, `Ayarlar`. `Gelisim` sekmesi gecici dev tools sayfasina gider.

## Rol Route'lari
| Route | Aciklama |
|---|---|
| `/{role}/dashboard` | Ana panel |
| `/{role}/properties` | Mulk listesi |
| `/{role}/property-detail` | Mulk detay |
| `/{role}/maintenance` | Talepler ve bakim merkezi |
| `/{role}/receipts` | Dekont listesi |
| `/{role}/calendar` | Takvim |
| `/{role}/settings` | Profil ve ayarlar |
| `/{role}/profile-edit` | Profil duzenleme |
| `/{role}/change-password` | Sifre degistirme |

`employee` rolu `/agent/*` route ailesini kullanir.

## Agent Route'lari
| Route | Aciklama |
|---|---|
| `/agent/team` | Ekip merkezi |
| `/agent/team-messages` | Tam ekran ekip mesajlasmasi |
| `/agent/team-member` | Calisan detay |
| `/agent/task-form` | Gorev formu |
| `/agent/create-property` | Mulk ekleme |
| `/agent/edit-property` | Mulk duzenleme |
| `/agent/create-user` | Landlord veya tenant olusturma |
| `/agent/contact-detail` | Ev sahibi/kiraci detay |
| `/agent/create-contact` | Usta/tadilatci olusturma |
| `/agent/edit-contact` | Usta/tadilatci duzenleme |
| `/agent/invite` | Davet olusturma |
| `/agent/pending-invites` | Bekleyen davetler |

## Landlord ve Tenant Route'lari
| Route | Aciklama |
|---|---|
| `/landlord/tenants` | Kiraci listesi |
| `/landlord/archive` | Talepler/dekontlar sekmesine yonlendirme |
| `/tenant/property` | Tenant mulku |
| `/tenant/maintenance-request` | Ariza formu |
| `/tenant/upload-receipt` | Dekont yukleme |

## Bottom Nav
- Admin: `Panel`, `Sirketler`, `Iletisim`, `Gelisim`, `Ayarlar`.
- Agent: `Ana Sayfa`, `Mulkler`, `Talepler`, `Ekibim`, `Profil`.
- Employee: `Ana Sayfa`, `Mulkler`, `Talepler`, `Ekibim`, `Profil`.
- Landlord: `Ana Sayfa`, `Mulkler`, `Talepler`, `Profil`.
- Tenant: `Ana Sayfa`, `Evim`, `Taleplerim`, `Profil`.

## Gizli Route'lar
Alt barda gorunmeyip akistan acilan ana route'lar:
- `/forgot-password`
- `/set-password`
- `/legal-acceptance`
- `/agent/team-messages`
- `/agent/contact-detail`
- `/agent/team-member`
- `/agent/task-form`
- `/landlord/tenants`
- `/tenant/maintenance-request`
- `/tenant/upload-receipt`

## Bildirim Deep Link'leri
- `task` -> `/agent/team?tab=tasks&openTaskId={id}`
- `announcement` -> `/agent/team?tab=announcements`
- `team_message` -> `/agent/team-messages`

## Mobil QA Notlari
- Wizard ve form ekranlarinda alt CTA/footer safe-area padding ile calismali.
- `/agent/create-property`, `/agent/add-tenant`, `/agent/edit-property`, `/agent/create-user`, `/tenant/upload-receipt` ve `/tenant/maintenance-request` footer/safe-area regresyonlari icin kontrol edilir.
- `/legal-acceptance` aktif kullaniciyi dashboard oncesinde bloke eder.
- `/admin/dev-tools` sadece admin oturumuyla manuel smoke test edilir.
