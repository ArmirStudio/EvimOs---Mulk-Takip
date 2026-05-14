import { AppThemeTokens } from '../app/theme';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
export type MaintenancePriority = 'low' | 'medium' | 'high';
export type MaintenanceRole = 'tenant' | 'landlord' | 'agent' | 'employee' | 'admin';

type Tone = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
};

type MaintenanceTimelineStep = {
  key: string;
  title: string;
  description: string;
  date?: string | null;
  state: 'done' | 'active' | 'upcoming';
  icon: string;
};

export function formatMaintenanceDate(
  value?: string | null,
  mode: 'date' | 'datetime' | 'relative' = 'date'
) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  if (mode === 'datetime') {
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (mode === 'relative') {
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

    if (diffHours < 24) {
      return `${diffHours} saat önce`;
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} gün önce`;
    }
  }

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getMaintenancePropertyLabel(item: any) {
  if (!item) {
    return 'Bilinmeyen mülk';
  }

  return (
    [
      item.property?.address,
      item.property_address,
      item.property?.district || item.property_district,
      item.property?.city || item.property_city,
    ]
      .filter(Boolean)
      .join(', ') || 'Bilinmeyen mülk'
  );
}

export function getMaintenanceStatusMeta(
  status?: string | null,
  options?: { awaitingTenantApproval?: boolean }
) {
  if (status === 'completed' && options?.awaitingTenantApproval) {
    return {
      label: 'Onay Bekliyor',
      shortLabel: 'Onay',
      icon: 'hourglass-top',
      description: 'İş tamamlandı, kiracı geri bildirimi bekleniyor.',
    };
  }

  switch (status) {
    case 'in_progress':
      return {
        label: 'Devam Ediyor',
        shortLabel: 'Devam',
        icon: 'construction',
        description: 'Saha veya ofis ekibi talep üzerinde çalışıyor.',
      };
    case 'completed':
      return {
        label: 'Tamamlandı',
        shortLabel: 'Tamam',
        icon: 'check-circle',
        description: 'Talep kapatıldı ve süreç sonlandırıldı.',
      };
    case 'rejected':
      return {
        label: 'Reddedildi',
        shortLabel: 'Red',
        icon: 'cancel',
        description: 'Talep işleme alınmadan kapatıldı.',
      };
    default:
      return {
        label: 'Bekliyor',
        shortLabel: 'Bekliyor',
        icon: 'schedule',
        description: 'Talep incelenmeyi ve işleme alınmayı bekliyor.',
      };
  }
}

export function getMaintenanceStatusTone(
  theme: AppThemeTokens,
  status?: string | null,
  options?: { awaitingTenantApproval?: boolean }
): Tone {
  if (status === 'completed' && options?.awaitingTenantApproval) {
    return {
      backgroundColor: theme.colors.surface2,
      borderColor: theme.colors.divider,
      textColor: theme.colors.textPrimary,
      accentColor: theme.colors.textSecondary,
    };
  }

  switch (status) {
    case 'in_progress':
      return {
        backgroundColor: theme.colors.infoLight,
        borderColor: theme.colors.info,
        textColor: theme.colors.infoText,
        accentColor: theme.colors.info,
      };
    case 'completed':
      return {
        backgroundColor: theme.colors.successLight,
        borderColor: theme.colors.success,
        textColor: theme.colors.successText,
        accentColor: theme.colors.success,
      };
    case 'rejected':
      return {
        backgroundColor: theme.colors.errorLight,
        borderColor: theme.colors.error,
        textColor: theme.colors.errorText,
        accentColor: theme.colors.error,
      };
    default:
      return {
        backgroundColor: theme.colors.warningLight,
        borderColor: theme.colors.warning,
        textColor: theme.colors.warningText,
        accentColor: theme.colors.warning,
      };
  }
}

export function getMaintenancePriorityMeta(priority?: string | null) {
  switch (priority) {
    case 'high':
      return {
        label: 'Yüksek',
        icon: 'priority-high',
        summary: 'Hızlı müdahale gerektirir',
      };
    case 'low':
      return {
        label: 'Düşük',
        icon: 'south',
        summary: 'Planlı şekilde ele alınabilir',
      };
    default:
      return {
        label: 'Orta',
        icon: 'remove',
        summary: 'Standart iş akışında ilerler',
      };
  }
}

export function getMaintenancePriorityTone(
  theme: AppThemeTokens,
  priority?: string | null
): Tone {
  if (priority === 'high') {
    return {
      backgroundColor: theme.colors.errorLight,
      borderColor: theme.colors.error,
      textColor: theme.colors.errorText,
      accentColor: theme.colors.error,
    };
  }

  if (priority === 'low') {
    return {
      backgroundColor: theme.colors.successLight,
      borderColor: theme.colors.success,
      textColor: theme.colors.successText,
      accentColor: theme.colors.success,
    };
  }

  return {
    backgroundColor: theme.colors.warningLight,
    borderColor: theme.colors.warning,
    textColor: theme.colors.warningText,
    accentColor: theme.colors.warning,
  };
}

export function getMaintenanceNextAction(item: any, role: string = 'tenant') {
  const awaitingTenantApproval =
    item?.status === 'completed' && !item?.tenant_approved_at;

  if (item?.status === 'rejected') {
    return 'Talep kapatıldı';
  }

  if (awaitingTenantApproval) {
    return role === 'tenant' ? 'Onay veya red ver' : 'Kiracı geri bildirimi bekleniyor';
  }

  if (item?.status === 'completed') {
    return 'Süreç arşivlenebilir';
  }

  if (item?.status === 'in_progress') {
    if (role === 'agent' || role === 'employee' || role === 'admin') {
      return 'Güncelleme ekle veya tamamla';
    }
    if (role === 'landlord') {
      return 'Süreci takip et veya bilgi notu bırak';
    }
    return 'Çalışma sürüyor';
  }

  if (role === 'tenant') {
    return 'Ofis incelemesini bekle';
  }

  if (role === 'landlord') {
    return 'Süreci takip et veya bilgi notu bırak';
  }

  return 'İşleme al';
}

export function getMaintenanceRoleLabel(role?: string | null) {
  switch (role) {
    case 'agent':
      return 'Emlakçı';
    case 'employee':
      return 'Sorumlu çalışan';
    case 'landlord':
      return 'Ev sahibi';
    case 'tenant':
      return 'Kiracı';
    case 'admin':
      return 'Admin';
    default:
      return 'Sistem';
  }
}

export function getMaintenanceHeroCopy(role: string, summary: {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  critical: number;
  awaitingTenantApproval: number;
}) {
  if (role === 'tenant') {
    return {
      eyebrow: 'Ariza merkezi',
      title: summary.total > 0 ? 'Evinizdeki süreç tek yerde' : 'Bu evde henüz kayıt yok',
      subtitle:
        summary.awaitingTenantApproval > 0
          ? 'Tamamlanan işleriniz için geri bildirim vermeniz bekleniyor.'
          : 'Açık, devam eden ve tamamlanan tüm kayıtları tek ekranda izleyin.',
    };
  }

  if (role === 'landlord') {
    return {
      eyebrow: 'Mülk sağlığı',
      title: summary.critical > 0 ? 'Kritik talepler öne çıktı' : 'Mülklerinizdeki bakım akışı',
      subtitle:
        summary.pending + summary.inProgress > 0
          ? 'Açık bakım taleplerini izleyin, gerekirse sürece bilgi notu ekleyin.'
          : 'Şu anda açık bir sorun görünmüyor. Geçmiş kayıtlar detayda kalır.',
    };
  }

  return {
    eyebrow: 'Operasyon paneli',
    title:
      summary.pending > 0
        ? `${summary.pending} talep ilk aksiyonu bekliyor`
        : 'Bakım operasyonu dengede görünüyor',
    subtitle:
      summary.awaitingTenantApproval > 0
        ? 'Bugün tamamlanan işleri ve kiracı onayı bekleyen kayıtları yönetin.'
        : 'Bekleyen, sahadaki ve kapanan talepleri tek panelden yönetin.',
  };
}

export function buildMaintenanceTimeline(request: any): MaintenanceTimelineStep[] {
  const status = request?.status || 'pending';
  const awaitingTenantApproval =
    status === 'completed' && !!request?.property?.tenant_id && !request?.tenant_approved_at;
  const rejectedByTenant = !!request?.tenant_rejection_reason;

  const steps: MaintenanceTimelineStep[] = [
    {
      key: 'created',
      title: 'Talep oluşturuldu',
      description: 'Kayıt sisteme eklendi ve ilgili kişilere iletildi.',
      date: request?.created_at,
      state: 'done' as const,
      icon: 'campaign',
    },
    {
      key: 'review',
      title: status === 'pending' ? 'İlk inceleme bekleniyor' : 'İlk inceleme tamamlandı',
      description:
        status === 'pending'
          ? 'Talep ofis veya sorumlu ekip tarafından değerlendirilecek.'
          : 'Talep kayda alındı ve operasyon akışına girdi.',
      date: request?.seen_at || request?.updated_at,
      state: status === 'pending' ? ('active' as const) : ('done' as const),
      icon: 'visibility',
    },
  ];

  if (status === 'rejected') {
    steps.push({
      key: 'rejected',
      title: 'Talep reddedildi',
      description: 'Kayıt işleme alınmadan kapatıldı.',
      date: request?.updated_at,
      state: 'active' as const,
      icon: 'block',
    });
    return steps;
  }

  steps.push({
    key: 'progress',
    title: status === 'pending' ? 'İşleme alınmayı bekliyor' : 'İşlem sürüyor',
    description:
      status === 'pending'
        ? 'Ekip önceliklendirme ve planlama aşamasında.'
        : rejectedByTenant
        ? 'Kiracı geri bildirimi sonrası iş tekrar açıldı.'
        : 'Bakım süreci aktif olarak yürüyor.',
    date: status === 'pending' ? undefined : request?.updated_at,
    state:
      status === 'in_progress'
        ? ('active' as const)
        : status === 'completed'
        ? ('done' as const)
        : ('upcoming' as const),
    icon: 'engineering',
  });

  steps.push({
    key: 'complete',
    title: awaitingTenantApproval ? 'İş tamamlandı, onay bekleniyor' : 'İş tamamlandı',
    description: awaitingTenantApproval
      ? 'Kiracının sonucu onaylaması veya geri bildirim vermesi bekleniyor.'
      : 'Bakım süreci kapanışa yaklaştı.',
    date: status === 'completed' ? request?.updated_at : undefined,
    state:
      status === 'completed'
        ? (awaitingTenantApproval ? 'active' : 'done')
        : ('upcoming' as const),
    icon: 'task-alt',
  });

  if (request?.property?.tenant_id) {
    steps.push({
      key: 'tenant_review',
      title: request?.tenant_approved_at ? 'Kiracı onay verdi' : 'Kiracı geri bildirimi',
      description: request?.tenant_approved_at
        ? 'Süreç kiracı onayı ile kapandı.'
        : rejectedByTenant
        ? 'Kiracı ek düzeltme talep etti.'
        : 'Talep sonucu kiracıya açık olarak sunuldu.',
      date: request?.tenant_approved_at || request?.tenant_rejected_at,
      state: request?.tenant_approved_at
        ? ('done' as const)
        : rejectedByTenant
        ? ('active' as const)
        : awaitingTenantApproval
        ? ('active' as const)
        : ('upcoming' as const),
      icon: request?.tenant_approved_at ? 'thumb-up' : 'forum',
    });
  }

  return steps;
}
