import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { tr } from '../../app/translations';
import { createThemedStyles, useAppTheme } from '../../app/theme';
import { useUserData } from '../../hooks/useUserData';
import { listMaintenance } from '../../services/appApi';
import {
  formatMaintenanceDate,
  getMaintenanceHeroCopy,
  getMaintenanceNextAction,
  getMaintenancePriorityMeta,
  getMaintenancePriorityTone,
  getMaintenancePropertyLabel,
  getMaintenanceStatusMeta,
  getMaintenanceStatusTone,
} from '../../utils/maintenancePresentation';
import { MaintenanceDetailView } from './MaintenanceDetailView';
import AnimatedScreen from './AnimatedScreen';
import BottomSheetModal from './BottomSheetModal';
import OfficeAvatarMenu from './OfficeAvatarMenu';

type MaintenanceFilter = 'all' | 'pending' | 'in_progress' | 'awaiting_tenant' | 'completed' | 'rejected';

function getActorRoute(role?: string | null) {
  return role === 'employee' ? 'agent' : role || 'tenant';
}

export default function MaintenanceScreen() {
  const { userData, loading: userLoading } = useUserData();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const s = useStyles();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<MaintenanceFilter>('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null);

  const userRole = userData?.role || 'tenant';
  const actorRoute = getActorRoute(userRole);
  const isOfficeViewer = userRole === 'agent' || userRole === 'employee' || userRole === 'admin';
  const canOpenArchive = isOfficeViewer || userRole === 'landlord';
  const filterOptions = useMemo(() => {
    if (isOfficeViewer) {
      return [
        { key: 'all' as const, label: 'Tumu' },
        { key: 'pending' as const, label: tr.maintenance.firstActionQueue },
        { key: 'in_progress' as const, label: tr.maintenance.fieldWorkQueue },
        { key: 'awaiting_tenant' as const, label: tr.maintenance.tenantApprovalQueue },
        { key: 'completed' as const, label: 'Tamamlanan' },
        { key: 'rejected' as const, label: 'Reddedilen' },
      ];
    }

    if (userRole === 'landlord') {
      return [
        { key: 'all' as const, label: 'Tumu' },
        { key: 'pending' as const, label: tr.maintenance.firstActionQueue },
        { key: 'in_progress' as const, label: tr.maintenance.fieldWorkQueue },
        { key: 'awaiting_tenant' as const, label: tr.maintenance.tenantApprovalQueue },
        { key: 'completed' as const, label: 'Tamamlanan' },
        { key: 'rejected' as const, label: 'Reddedilen' },
      ];
    }

    return [
      { key: 'all' as const, label: 'Tumu' },
      { key: 'pending' as const, label: 'Bekliyor' },
      { key: 'in_progress' as const, label: 'Devam Ediyor' },
      { key: 'awaiting_tenant' as const, label: 'Onay Bekliyor' },
      { key: 'completed' as const, label: 'Tamamlandi' },
      { key: 'rejected' as const, label: 'Reddedildi' },
    ];
  }, [isOfficeViewer, userRole]);

  useEffect(() => {
    const openId = params.openId as string | undefined;
    const openType = params.openType as string | undefined;

    if (openId && openType === 'maintenance') {
      setSelectedMaintenanceId(openId);
    }
  }, [params.openId, params.openType]);

  const loadRequests = useCallback(async () => {
    if (!userData) {
      return;
    }

    try {
      setLoading(true);
      const response = await listMaintenance();

      const nextRequests = (response.maintenance_requests || []).map((item: any) => ({
        ...item,
        property_address: getMaintenancePropertyLabel(item),
      }));

      setRequests(nextRequests);
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData]);

  useFocusEffect(
    useCallback(() => {
      if (!userLoading && userData) {
        loadRequests();
      }
    }, [loadRequests, userData, userLoading])
  );

  const summary = useMemo(() => {
    const pending = requests.filter((item) => item.status === 'pending').length;
    const inProgress = requests.filter((item) => item.status === 'in_progress').length;
    const completed = requests.filter((item) => item.status === 'completed').length;
    const rejected = requests.filter((item) => item.status === 'rejected').length;
    const critical = requests.filter((item) => item.priority === 'high').length;
    const awaitingTenantApproval = requests.filter(
      (item) => item.status === 'completed' && !!item.property_tenant_id && !item.tenant_approved_at
    ).length;

    return {
      total: requests.length,
      pending,
      inProgress,
      completed,
      rejected,
      critical,
      awaitingTenantApproval,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const awaitingTenantApproval =
        item.status === 'completed' && !!item.property_tenant_id && !item.tenant_approved_at;

      if (filter === 'awaiting_tenant') {
        return awaitingTenantApproval;
      }
      if (filter === 'completed') {
        return item.status === 'completed' && !awaitingTenantApproval;
      }
      if (filter === 'all') {
        return true;
      }
      return item.status === filter;
    });
  }, [filter, requests]);

  const heroCopy = getMaintenanceHeroCopy(userRole, summary);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const renderHeroStats = () => {
    if (userRole === 'tenant') {
      return (
        <View style={s.heroStatGrid}>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.pending + summary.inProgress}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.openWork}</Text>
          </View>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.awaitingTenantApproval}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.waitingApprovalShort}</Text>
          </View>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.completed}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.completed}</Text>
          </View>
        </View>
      );
    }

    if (userRole === 'landlord') {
      return (
        <View style={s.heroStatGrid}>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.pending + summary.inProgress}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.openRequest}</Text>
          </View>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.critical}</Text>
            <Text style={s.heroStatLabel}>Kritik</Text>
          </View>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.completed}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.closedItems}</Text>
          </View>
        </View>
      );
    }

    return (
        <View style={s.heroStatGrid}>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.pending}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.firstActionQueue}</Text>
          </View>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.inProgress}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.fieldWorkQueue}</Text>
          </View>
          <View style={s.heroStatCard}>
            <Text style={s.heroStatValue}>{summary.awaitingTenantApproval}</Text>
            <Text style={s.heroStatLabel}>{tr.maintenance.waitingApproval}</Text>
          </View>
        </View>
      );
  };

  const renderEmpty = () => (
    <View style={s.emptyContainer}>
      <View style={s.emptyIconBg}>
        <MaterialIcons name="inbox" size={40} color={theme.colors.textMuted} />
      </View>
      <Text style={s.emptyTitle}>{tr.maintenance.emptyTitle}</Text>
      <Text style={s.emptySubtext}>
        {filter === 'all'
          ? userRole === 'tenant'
            ? tr.maintenance.emptyTenantAll
            : tr.maintenance.emptyGenericAll
          : `${filterOptions.find((item) => item.key === filter)?.label || 'Secili kuyruk'} ${tr.maintenance.emptyQueueSuffix}`}
      </Text>
      {userRole === 'tenant' && (
        <TouchableOpacity
          style={s.emptyBtn}
          onPress={() => router.push('/tenant/maintenance-request' as any)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={18} color={theme.colors.textInverse} />
          <Text style={s.emptyBtnText}>{tr.maintenance.createRecord}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRequest = ({ item }: { item: any }) => {
    const awaitingTenantApproval =
      item.status === 'completed' && !!item.property_tenant_id && !item.tenant_approved_at;
    const statusMeta = getMaintenanceStatusMeta(item.status, { awaitingTenantApproval });
    const priorityMeta = getMaintenancePriorityMeta(item.priority);
    const statusTone = getMaintenanceStatusTone(theme, item.status, { awaitingTenantApproval });
    const priorityTone = getMaintenancePriorityTone(theme, item.priority);
    const photoCount = Array.isArray(item.photo_urls) ? item.photo_urls.length : 0;
    const nextAction = getMaintenanceNextAction(item, userRole);

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.9}
        onPress={() => setSelectedMaintenanceId(item.id)}
      >
        <View style={s.cardAccentWrap}>
          <View style={[s.cardAccent, { backgroundColor: statusTone.accentColor }]} />
        </View>

        <View style={s.cardContent}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBg}>
              <MaterialIcons name={statusMeta.icon as any} size={20} color={statusTone.accentColor} />
            </View>
            <View style={s.cardHeaderMeta}>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.title || 'Bakim Talebi'}
              </Text>
              <Text style={s.cardAddress} numberOfLines={1}>
                {item.property_address}
              </Text>
            </View>
          </View>

          {!!item.description && (
            <Text style={s.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={s.badgesRow}>
            <View
              style={[
                s.badge,
                { backgroundColor: statusTone.backgroundColor, borderColor: statusTone.borderColor },
              ]}
            >
              <Text style={[s.badgeText, { color: statusTone.textColor }]}>{statusMeta.label}</Text>
            </View>
            <View
              style={[
                s.badge,
                { backgroundColor: priorityTone.backgroundColor, borderColor: priorityTone.borderColor },
              ]}
            >
              <Text style={[s.badgeText, { color: priorityTone.textColor }]}>{priorityMeta.label}</Text>
            </View>
          </View>

          <View style={s.nextActionCard}>
            <Text style={s.nextActionLabel}>{tr.tenant.nextStep}</Text>
            <Text style={s.nextActionValue}>{nextAction}</Text>
          </View>

          <View style={s.cardFooter}>
            <View style={s.footerItem}>
              <MaterialIcons name="schedule" size={13} color={theme.colors.textMuted} />
              <Text style={s.cardDate}>{formatMaintenanceDate(item.updated_at || item.created_at, 'relative')}</Text>
            </View>
            <View style={s.footerItem}>
              <MaterialIcons name="photo-library" size={13} color={theme.colors.textMuted} />
              <Text style={s.cardDate}>{photoCount} foto</Text>
            </View>
            <View style={{ flex: 1 }} />
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AnimatedScreen type="fade">
      <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <FlatList
        data={loading ? [] : filteredRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.listContent, !loading && filteredRequests.length === 0 && { flexGrow: 1 }]}
        ListHeaderComponent={
          <>
            <View style={s.header}>
              <View>
                <Text style={s.headerTitle}>
                  {isOfficeViewer ? tr.maintenance.operationsTitle : tr.maintenance.tenantScreenTitle}
                </Text>
                <Text style={s.headerSubtitle}>
                  {userRole === 'tenant'
                    ? tr.maintenance.tenantScreenSubtitle
                    : userRole === 'landlord'
                    ? tr.maintenance.landlordScreenSubtitle
                    : tr.maintenance.operationsSubtitle}
                </Text>
              </View>
              <View style={s.headerRight}>
                {userRole === 'tenant' && (
                  <TouchableOpacity
                    style={s.headerAddBtn}
                    onPress={() => router.push('/tenant/maintenance-request' as any)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="add" size={24} color={theme.colors.textInverse} />
                  </TouchableOpacity>
                )}
                {canOpenArchive && (
                  <TouchableOpacity
                    style={[s.headerAddBtn, s.archiveBtn]}
                    onPress={() => router.push(`/${actorRoute}/archive` as any)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="folder-open" size={22} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
                {(userRole === 'agent' || userRole === 'employee') && <OfficeAvatarMenu />}
              </View>
            </View>

            <View style={s.heroCard}>
              <Text style={s.heroEyebrow}>{heroCopy.eyebrow}</Text>
              <Text style={s.heroTitle}>{heroCopy.title}</Text>
              <Text style={s.heroSubtitle}>{heroCopy.subtitle}</Text>
              {renderHeroStats()}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterScroll}
            >
              {filterOptions.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[s.filterChip, filter === item.key && s.filterChipActive]}
                  onPress={() => setFilter(item.key)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === item.key }}
                >
                  <Text style={[s.filterText, filter === item.key && s.filterTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.colors.primary} /> : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <BottomSheetModal
        visible={!!selectedMaintenanceId}
        onClose={() => {
          setSelectedMaintenanceId(null);
          loadRequests();
        }}
      >
        {selectedMaintenanceId && (
          <MaintenanceDetailView
            requestId={selectedMaintenanceId}
            onClose={() => {
              setSelectedMaintenanceId(null);
              loadRequests();
            }}
          />
        )}
      </BottomSheetModal>
      </View>
    </AnimatedScreen>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 12,
    },
    headerTitle: { fontSize: 28, fontWeight: '700', color: theme.colors.textPrimary },
    headerSubtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, maxWidth: 260, lineHeight: 18 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerAddBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    archiveBtn: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginLeft: 8,
    },
    heroCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 20,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.md,
    },
    heroEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    heroTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary },
    heroSubtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginTop: 8 },
    heroStatGrid: { flexDirection: 'row', gap: 10, marginTop: 18 },
    heroStatCard: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    heroStatValue: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
    heroStatLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, marginTop: 4, textTransform: 'uppercase' },
    filterScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
    filterChip: {
      height: 38,
      paddingHorizontal: 16,
      borderRadius: 19,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
    filterTextActive: { color: theme.colors.textInverse },
    listContent: { paddingBottom: 120, flexGrow: 1 },
    card: {
      marginHorizontal: 16,
      marginBottom: 14,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      flexDirection: 'row',
      ...theme.shadows.sm,
    },
    cardAccentWrap: {
      width: 10,
      alignItems: 'stretch',
    },
    cardAccent: {
      flex: 1,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },
    cardContent: {
      flex: 1,
      padding: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardIconBg: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderMeta: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
    cardAddress: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginTop: 12,
    },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },
    nextActionCard: {
      marginTop: 12,
      backgroundColor: theme.colors.surface2,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    nextActionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    nextActionValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      lineHeight: 18,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    cardDate: { fontSize: 12, color: theme.colors.textMuted },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyIconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 24,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
    },
    emptyBtnText: { color: theme.colors.textInverse, fontWeight: '700', fontSize: 14 },
  })
);
