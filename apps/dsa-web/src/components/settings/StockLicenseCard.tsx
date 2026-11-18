import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../common';
import { SettingsAlert } from './SettingsAlert';
import { SettingsSectionCard } from './SettingsSectionCard';
import {
  canUseStockLicenseApi,
  getDesktopRuntimeApi,
  type StockLicenseInfo,
} from '../../desktop/runtime';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import type { UiTextKey, UiTextParams } from '../../i18n/uiText';

function formatRemaining(
  license: StockLicenseInfo | null,
  t: (key: UiTextKey, params?: UiTextParams) => string,
) {
  if (!license) {
    return '—';
  }
  if (license.plan_type === 'lifetime') {
    return t('settings.licenseRemainingLifetime');
  }
  if (license.is_expired) {
    return t('settings.licenseRemainingExpired');
  }
  if (typeof license.remaining_days === 'number') {
    return t('settings.licenseRemainingDays', { days: license.remaining_days });
  }
  return '—';
}

export function StockLicenseCard() {
  const { t } = useUiLanguage();
  const [license, setLicense] = useState<StockLicenseInfo | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const available = canUseStockLicenseApi();

  const loadLicense = useCallback(async () => {
    const runtime = getDesktopRuntimeApi();
    if (!runtime?.getStockLicense) {
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const next = await runtime.getStockLicense();
      setLicense(next || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!available) {
      return;
    }
    void loadLicense();
  }, [available, loadLicense]);

  if (!available) {
    return null;
  }

  const handleRenew = async () => {
    const runtime = getDesktopRuntimeApi();
    if (!runtime?.openStockRenew) {
      setError(t('settings.licenseRenewUnavailable'));
      return;
    }
    setIsRenewing(true);
    setError('');
    try {
      await runtime.openStockRenew();
      await loadLicense();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <SettingsSectionCard
      title={t('settings.licenseInfo')}
      description={t('settings.licenseInfoDescription')}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border settings-border bg-background/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-text">
            {t('settings.licenseActivationCode')}
          </p>
          <p className="mt-2 break-all font-mono text-sm text-foreground">
            {license?.activation_code || '—'}
          </p>
        </div>
        <div className="rounded-2xl border settings-border bg-background/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-text">
            {t('settings.licensePlan')}
          </p>
          <p className="mt-2 text-sm text-foreground">
            {license?.plan_label || license?.plan_type || '—'}
          </p>
        </div>
        <div className="rounded-2xl border settings-border bg-background/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-text">
            {t('settings.licenseExpiresAt')}
          </p>
          <p className="mt-2 break-all font-mono text-sm text-foreground">
            {license?.expires_at || '—'}
          </p>
        </div>
        <div className="rounded-2xl border settings-border bg-background/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-text">
            {t('settings.licenseRemaining')}
          </p>
          <p
            className={`mt-2 text-sm font-medium ${
              license?.is_expired ? 'text-rose-600 dark:text-rose-300' : 'text-foreground'
            }`}
          >
            {formatRemaining(license, t)}
          </p>
        </div>
      </div>

      {license?.mac_address ? (
        <p className="text-xs leading-6 text-muted-text">
          {t('settings.licenseMac')}: <span className="font-mono">{license.mac_address}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="settings-secondary"
          onClick={() => void loadLicense()}
          disabled={isLoading || isRenewing}
          isLoading={isLoading}
          loadingText={t('settings.licenseRefreshing')}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {t('settings.licenseRefresh')}
        </Button>
        <Button
          type="button"
          variant="settings-primary"
          onClick={() => void handleRenew()}
          disabled={isLoading || isRenewing}
          isLoading={isRenewing}
          loadingText={t('settings.licenseRenewing')}
        >
          {t('settings.licenseRenew')}
        </Button>
      </div>

      {error ? (
        <SettingsAlert title={t('settings.licenseLoadFailed')} message={error} variant="error" />
      ) : null}
    </SettingsSectionCard>
  );
}
