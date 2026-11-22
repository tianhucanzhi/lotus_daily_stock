import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Headphones, X } from 'lucide-react';
import { getDesktopRuntimeApi } from '../../desktop/runtime';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import { cn } from '../../utils/cn';

const WECHAT_QR_URL = 'https://lotus.yunfm.cn/static/images/wx.png';

export const ContactUsFab: React.FC = () => {
  const { t } = useUiLanguage();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => Boolean(getDesktopRuntimeApi()));

  useEffect(() => {
    setIsDesktop(Boolean(getDesktopRuntimeApi()));
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setImageFailed(false);
    }
  }, [open]);

  if (!isDesktop) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed bottom-5 right-5 z-[55] inline-flex h-11 w-11 items-center justify-center rounded-full',
          'border border-border/70 bg-card/90 text-secondary-text shadow-soft-card backdrop-blur-md',
          'transition-colors hover:bg-hover hover:text-foreground',
        )}
        aria-label={t('layout.contactUs')}
        title={t('layout.contactUs')}
        onClick={() => setOpen(true)}
      >
        <Headphones className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t('layout.contactUs')}
                className="relative w-full max-w-[20rem] rounded-2xl border border-border/70 bg-elevated p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary-text transition-colors hover:bg-hover hover:text-foreground"
                  aria-label={t('common.close')}
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="space-y-3 text-center">
                  <h3 className="pr-8 text-base font-semibold text-foreground">
                    {t('layout.contactUsTitle')}
                  </h3>
                  <p className="text-sm text-secondary-text">{t('layout.contactUsHint')}</p>
                  <div className="mx-auto flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-2">
                    {imageFailed ? (
                      <p className="px-3 text-xs leading-5 text-muted-text">
                        {t('layout.contactUsImageFailed')}
                      </p>
                    ) : (
                      <img
                        src={WECHAT_QR_URL}
                        alt={t('layout.contactUsQrAlt')}
                        className="h-full w-full object-contain"
                        onError={() => setImageFailed(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
