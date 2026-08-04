import {
  getPortalFromSearchParam,
  isPathAllowedForPortal,
} from '@/shared/auth';
import type { PortalType } from '@/shared/contracts';
import { useTranslations } from '@/shared/hooks/use-translations';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { cn } from '@/shared/lib/utils';
import { BadgeCheck, Building2, ShieldCheck } from 'lucide-react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';

const portals: PortalType[] = ['ADMIN', 'TENANT'];

export function BrandedLayout() {
  const { t } = useTranslations();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const portalType = pathname.startsWith('/auth/tenant')
    ? 'TENANT'
    : getPortalFromSearchParam(searchParams.get('portal'));
  const isLoginPage = pathname === '/auth/login' || pathname === '/auth/signin';

  const handlePortalChange = (nextPortal: PortalType) => {
    const nextParams = new URLSearchParams(searchParams);
    const nextPath = nextParams.get('next');

    nextParams.set('portal', nextPortal.toLowerCase());
    if (nextPath && !isPathAllowedForPortal(nextPath, nextPortal)) {
      nextParams.delete('next');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const portalKey = `AUTH.SIGNIN.HERO.${portalType}`;

  return (
    <main className="relative min-h-svh w-full grow overflow-hidden bg-[#f5f7fa]">
      {isLoginPage && (
        <div
          className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 rounded-xl border border-white/70 bg-white/95 p-1.5 shadow-lg shadow-slate-950/10 backdrop-blur lg:top-8"
          role="tablist"
          aria-label={t('AUTH.SIGNIN.PORTAL')}
        >
          {portals.map((portal) => (
            <button
              key={portal}
              type="button"
              role="tab"
              aria-selected={portalType === portal}
              className={cn(
                'flex min-w-28 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-w-32',
                portalType === portal
                  ? 'bg-[#095f78] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )}
              onClick={() => handlePortalChange(portal)}
            >
              {portal === 'ADMIN' ? (
                <ShieldCheck aria-hidden="true" className="size-4" />
              ) : (
                <Building2 aria-hidden="true" className="size-4" />
              )}
              {t(`AUTH.SIGNIN.${portal}`)}
            </button>
          ))}
        </div>
      )}

      <section
        className={cn(
          'relative z-10 flex min-h-svh items-center justify-center px-5 pb-10 pt-24 transition-transform duration-700 ease-in-out motion-reduce:transition-none sm:px-8 lg:absolute lg:inset-y-0 lg:left-0 lg:w-1/2 lg:px-12 lg:py-24',
          portalType === 'TENANT' && 'lg:translate-x-full',
        )}
        aria-label={t('AUTH.SIGNIN.FORM_REGION')}
      >
        <div className="w-full max-w-[460px] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(23,33,47,0.12)] sm:p-9">
          <Outlet />
        </div>
      </section>

      <section
        className={cn(
          'relative hidden min-h-svh overflow-hidden bg-[#0d3d4c] text-white transition-transform duration-700 ease-in-out motion-reduce:transition-none lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12 xl:p-16',
          portalType === 'ADMIN' && 'lg:translate-x-full',
        )}
        style={{
          backgroundImage: `radial-gradient(circle at 18% 16%, rgba(26, 152, 167, 0.5), transparent 29%), linear-gradient(145deg, rgba(23, 33, 47, 0.96) 8%, rgba(13, 61, 76, 0.94) 58%, rgba(9, 95, 120, 0.9) 100%), url('${toAbsoluteUrl('/media/app/auth-bg.png')}')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
        aria-label={t(`${portalKey}.EYEBROW`)}
      >
        <div className="pointer-events-none absolute -left-56 -bottom-56 size-[440px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-28 top-28 size-72 rounded-full border border-white/10" />

        <Link
          to="/"
          className="relative z-10 flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={t('AUTH.SIGNIN.HOME')}
        >
          <span className="grid size-11 place-items-center rounded-lg border border-white/20 bg-[#095f78] shadow-lg shadow-black/20">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-6 w-auto brightness-0 invert"
              alt=""
            />
          </span>
          <span>
            <strong className="block text-sm font-semibold">
              Loyalty Gamification CMS
            </strong>
            <span className="mt-0.5 block text-xs text-white/60">
              {t('AUTH.SIGNIN.PLATFORM')}
            </span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-10">
          <p className="mb-5 flex items-center gap-3 text-xs font-bold tracking-[0.14em] text-cyan-200 uppercase">
            <span className="h-0.5 w-6 bg-cyan-300" aria-hidden="true" />
            {t(`${portalKey}.EYEBROW`)}
          </p>
          <h1 className="max-w-lg text-4xl leading-[1.12] font-semibold tracking-[-0.035em] xl:text-5xl">
            {t(`${portalKey}.TITLE`)}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 xl:text-base">
            {t(`${portalKey}.DESCRIPTION`)}
          </p>
          <div className="mt-8 grid gap-3">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm font-medium text-white/90"
              >
                <span className="grid size-7 place-items-center rounded-full bg-white/10 text-cyan-200">
                  <BadgeCheck aria-hidden="true" className="size-4" />
                </span>
                {t(`${portalKey}.TRUST_${item}`)}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-6 text-xs text-white/50">
          <span>{t('AUTH.SIGNIN.COPYRIGHT')}</span>
          <img
            src={toAbsoluteUrl('/media/app/auth-screen.png')}
            className="pointer-events-none absolute -bottom-20 right-0 hidden w-[44%] opacity-20 xl:block"
            alt=""
          />
        </div>
      </section>
    </main>
  );
}
