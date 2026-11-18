import type React from 'react';
import { APP_VERSION } from '../../brand';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import { UiLanguageToggle } from '../i18n/UiLanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';
import { cn } from '../../utils/cn';

type ShellBrandDockProps = {
  className?: string;
};

export const ShellBrandDock: React.FC<ShellBrandDockProps> = ({ className }) => {
  const { t } = useUiLanguage();

  return (
    <div
      data-testid="shell-corner-controls"
      className={cn(
        'w-full overflow-visible rounded-2xl border border-[var(--shell-sidebar-border)] bg-[var(--nav-hover-bg)]',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5 p-1">
        <UiLanguageToggle variant="dock" />
        <ThemeToggle variant="dock" menuPlacement="top" />
      </div>
      <div className="rounded-b-2xl border-t border-[var(--shell-sidebar-border)] bg-card/50 px-2 py-2 text-center">
        <p className="text-[10px] font-semibold tracking-wide text-secondary-text">
          v{APP_VERSION}
        </p>
        <p
          className="mt-0.5 truncate text-[9px] leading-tight text-muted-text"
          title={t('layout.brandCompany')}
        >
          {t('layout.brandCompany')}
        </p>
      </div>
    </div>
  );
};
