export type StockLicenseInfo = {
  mac_address?: string;
  activation_code?: string;
  plan_type?: string;
  plan_label?: string;
  expires_at?: string;
  is_expired?: boolean;
  remaining_days?: number | null;
  status?: number;
};

export type DesktopRuntimeApi = {
  version?: unknown;
  getUpdateState?: () => Promise<RawDesktopUpdateState>;
  checkForUpdates?: () => Promise<RawDesktopUpdateState>;
  installDownloadedUpdate?: () => Promise<boolean>;
  openReleasePage?: (releaseUrl?: string) => Promise<boolean>;
  getStockLicense?: () => Promise<StockLicenseInfo>;
  refreshStockLicense?: () => Promise<StockLicenseInfo>;
  openStockRenew?: () => Promise<unknown>;
  onUpdateStateChange?: (listener: (state: RawDesktopUpdateState) => void) => (() => void) | void;
};

export type DesktopWindow = Window & {
  dsaDesktop?: DesktopRuntimeApi;
};

export type DesktopUpdateState = {
  status?: string;
  updateMode?: string;
  currentVersion?: string;
  latestVersion?: string;
  releaseUrl?: string;
  checkedAt?: string;
  publishedAt?: string;
  message?: string;
  releaseName?: string;
  tagName?: string;
  downloadPercent?: number | null;
  downloadedBytes?: number | null;
  totalBytes?: number | null;
};

export type RawDesktopUpdateState = {
  status?: unknown;
  updateMode?: unknown;
  currentVersion?: unknown;
  latestVersion?: unknown;
  releaseUrl?: unknown;
  checkedAt?: unknown;
  publishedAt?: unknown;
  message?: unknown;
  releaseName?: unknown;
  tagName?: unknown;
  downloadPercent?: unknown;
  downloadedBytes?: unknown;
  totalBytes?: unknown;
};

export function trimDesktopRuntimeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeDesktopRuntimeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getDesktopRuntimeApi() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (window as DesktopWindow).dsaDesktop;
}

export function getDesktopAppVersion() {
  return trimDesktopRuntimeString(getDesktopRuntimeApi()?.version);
}

export function canUseDesktopUpdateApi(runtime = getDesktopRuntimeApi()) {
  return Boolean(runtime?.getUpdateState && runtime?.checkForUpdates && runtime?.openReleasePage);
}

export function canUseStockLicenseApi(runtime = getDesktopRuntimeApi()) {
  return Boolean(runtime?.getStockLicense);
}
