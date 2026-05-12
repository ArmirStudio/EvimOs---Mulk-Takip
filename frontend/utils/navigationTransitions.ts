import type { AppThemeTokens } from '../app/theme';

type StackNavigationOptions = Record<string, any>;

const MAIN_SURFACE_ROUTES = new Set([
  'dashboard',
  'properties',
  'property',
  'maintenance',
  'receipts',
  'archive',
  'calendar',
  'settings',
  'team',
  'companies',
  'contacts',
  'tenants',
]);

const DEEP_LINK_ROUTES = new Set([
  'maintenance/[id]',
  'receipts/[id]',
  'maintenance/success',
]);

const WIZARD_ROUTES = new Set([
  'create-company',
  'edit-company',
  'edit-agent',
  'create-agent',
  'create-property',
  'create-maintenance',
  'edit-property',
  'maintenance-request',
  'upload-receipt',
  'profile-edit',
  'change-password',
  'contact-detail',
  'team-member',
  'property-detail',
  'task-form',
  'set-password',
  'login',
]);

export function getSoftStackBaseOptions(
  theme: AppThemeTokens
): StackNavigationOptions {
  return {
    headerShown: false,
    gestureEnabled: true,
    animationTypeForReplace: 'push',
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
  };
}

export function getMainSurfaceScreenOptions(
  theme: AppThemeTokens
): StackNavigationOptions {
  return {
    ...getSoftStackBaseOptions(theme),
    animation: 'none',
  };
}

function createDeepLinkOptions(theme: AppThemeTokens): StackNavigationOptions {
  return {
    ...getSoftStackBaseOptions(theme),
    animation: 'fade_from_bottom',
  };
}

export function getDetailScreenOptions(
  theme: AppThemeTokens
): StackNavigationOptions {
  return {
    ...getSoftStackBaseOptions(theme),
    animation: 'slide_from_right',
  };
}

export function getWizardScreenOptions(
  theme: AppThemeTokens
): StackNavigationOptions {
  return {
    ...getSoftStackBaseOptions(theme),
    animation: 'fade_from_bottom',
  };
}

export function getRootStackOptions(
  theme: AppThemeTokens,
  routeName?: string | null
): StackNavigationOptions {
  if (routeName === 'index') {
    return getMainSurfaceScreenOptions(theme);
  }

  return {
    ...getDetailScreenOptions(theme),
    animation: routeName === 'login' ? 'fade' : 'slide_from_right',
  };
}

export function getRoleStackOptions(
  theme: AppThemeTokens,
  routeName?: string | null
): StackNavigationOptions {
  if (routeName && MAIN_SURFACE_ROUTES.has(routeName)) {
    return getMainSurfaceScreenOptions(theme);
  }

  if (routeName && DEEP_LINK_ROUTES.has(routeName)) {
    return createDeepLinkOptions(theme);
  }

  if (routeName && WIZARD_ROUTES.has(routeName)) {
    return getWizardScreenOptions(theme);
  }

  return getDetailScreenOptions(theme);
}

export function isMainSurfaceRoute(routeName?: string | null) {
  return !!routeName && MAIN_SURFACE_ROUTES.has(routeName);
}
