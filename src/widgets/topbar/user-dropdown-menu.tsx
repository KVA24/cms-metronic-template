import { ReactNode } from 'react';
import { useTranslations } from '@/shared/hooks';
import { I18N_LANGUAGES } from '@/shared/i18n/config';
import { Language } from '@/shared/i18n/types';
import { toAbsoluteUrl } from '@/shared/lib/helpers';
import { useAuthActions, useAuthUser } from '@/shared/stores/auth-store';
import { useChangePasswordDialog } from '@/shared/stores/ui-store';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import UiserveSwitch from '@/shared/ui/molecules/uiverse-switch-mode';
import { Globe, KeyRound, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/app/providers/i18n-provider';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const user = useAuthUser();
  const { logout } = useAuthActions();
  const { currenLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const changePasswordDialog = useChangePasswordDialog();
  const { t } = useTranslations();

  // Use display data from currentUser
  const displayName = user?.username || 'User';

  const displayEmail = user?.email || '';
  // const displayAvatar = user?.pic || toAbsoluteUrl('/media/avatars/300-2.png');
  const displayAvatar = toAbsoluteUrl('/media/avatars/300-2.png');

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang);
  };

  const handleThemeToggle = (checked: any) => {
    setTheme(checked.target?.checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img
              className="size-9 rounded-full border-2 border-green-500"
              src={displayAvatar}
              alt="User avatar"
            />
            <div className="flex flex-col">
              <Link
                to="/account/home/get-started"
                className="text-sm text-mono hover:text-primary font-semibold"
              >
                {displayName}
              </Link>
              <a
                href={`mailto:${displayEmail}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {displayEmail}
              </a>
            </div>
          </div>
          {/*<Badge variant="primary" appearance="light" size="sm">*/}
          {/*  Pro*/}
          {/*</Badge>*/}
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        {/*<DropdownMenuItem asChild>*/}
        {/*  <Link*/}
        {/*    to="/public-profile/profiles/default"*/}
        {/*    className="flex items-center gap-2"*/}
        {/*  >*/}
        {/*    <IdCard/>*/}
        {/*    Public Profile*/}
        {/*  </Link>*/}
        {/*</DropdownMenuItem>*/}
        {/*<DropdownMenuItem asChild>*/}
        {/*  <Link*/}
        {/*    to="/account/home/user-profile"*/}
        {/*    className="flex items-center gap-2"*/}
        {/*  >*/}
        {/*    <UserCircle/>*/}
        {/*    My Profile*/}
        {/*  </Link>*/}
        {/*</DropdownMenuItem>*/}

        {/*/!* My Account Submenu *!/*/}
        {/*<DropdownMenuSub>*/}
        {/*  <DropdownMenuSubTrigger className="flex items-center gap-2">*/}
        {/*    <Settings/>*/}
        {/*    My Account*/}
        {/*  </DropdownMenuSubTrigger>*/}
        {/*  <DropdownMenuSubContent className="w-48">*/}
        {/*    <DropdownMenuItem asChild>*/}
        {/*      <Link*/}
        {/*        to="/account/home/get-started"*/}
        {/*        className="flex items-center gap-2"*/}
        {/*      >*/}
        {/*        <Coffee/>*/}
        {/*        Get Started*/}
        {/*      </Link>*/}
        {/*    </DropdownMenuItem>*/}
        {/*    <DropdownMenuItem asChild>*/}
        {/*      <Link*/}
        {/*        to="/account/home/user-profile"*/}
        {/*        className="flex items-center gap-2"*/}
        {/*      >*/}
        {/*        <FileText/>*/}
        {/*        My Profile*/}
        {/*      </Link>*/}
        {/*    </DropdownMenuItem>*/}
        {/*    <DropdownMenuItem asChild>*/}
        {/*      <Link*/}
        {/*        to="/account/billing/basic"*/}
        {/*        className="flex items-center gap-2"*/}
        {/*      >*/}
        {/*        <CreditCard/>*/}
        {/*        Billing*/}
        {/*      </Link>*/}
        {/*    </DropdownMenuItem>*/}
        {/*    <DropdownMenuItem asChild>*/}
        {/*      <Link*/}
        {/*        to="/account/security/overview"*/}
        {/*        className="flex items-center gap-2"*/}
        {/*      >*/}
        {/*        <Shield/>*/}
        {/*        Security*/}
        {/*      </Link>*/}
        {/*    </DropdownMenuItem>*/}
        {/*    <DropdownMenuItem asChild>*/}
        {/*      <Link*/}
        {/*        to="/account/members/teams"*/}
        {/*        className="flex items-center gap-2"*/}
        {/*      >*/}
        {/*        <Users/>*/}
        {/*        Members & Roles*/}
        {/*      </Link>*/}
        {/*    </DropdownMenuItem>*/}
        {/*    <DropdownMenuItem asChild>*/}
        {/*      <Link*/}
        {/*        to="/account/integrations"*/}
        {/*        className="flex items-center gap-2"*/}
        {/*      >*/}
        {/*        <BetweenHorizontalStart/>*/}
        {/*        Integrations*/}
        {/*      </Link>*/}
        {/*    </DropdownMenuItem>*/}
        {/*  </DropdownMenuSubContent>*/}
        {/*</DropdownMenuSub>*/}

        {/*<DropdownMenuItem asChild>*/}
        {/*  <Link*/}
        {/*    to="https://devs.keenthemes.com"*/}
        {/*    className="flex items-center gap-2"*/}
        {/*  >*/}
        {/*    <SquareCode/>*/}
        {/*    Dev Forum*/}
        {/*  </Link>*/}
        {/*</DropdownMenuItem>*/}

        {/* Language Submenu with Radio Group */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 [&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden hover:[&_[data-slot=badge]]:border-input data-[state=open]:[&_[data-slot=badge]]:border-input">
            <Globe />
            <span className="flex items-center justify-between gap-2 grow relative">
              Language
              <Badge
                variant="outline"
                className="absolute end-0 top-1/2 -translate-y-1/2"
              >
                {currenLanguage.label}
                <img
                  src={currenLanguage.flag}
                  className="w-3.5 h-3.5 rounded-full"
                  alt={currenLanguage.label}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={currenLanguage.code}
              onValueChange={(value) => {
                const selectedLang = I18N_LANGUAGES.find(
                  (lang) => lang.code === value,
                );
                if (selectedLang) handleLanguage(selectedLang);
              }}
            >
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <img
                    src={item.flag}
                    className="w-4 h-4 rounded-full"
                    alt={item.label}
                  />
                  <span>{item.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Change Password */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={() => changePasswordDialog.open()}
        >
          <KeyRound />
          {t('USER.MENU.CHANGE_PASSWORD')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Footer */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon />
          <div className="flex items-center gap-2 justify-between grow">
            Dark Mode
            {/*<Switch*/}
            {/*  size="sm"*/}
            {/*  checked={theme === 'dark'}*/}
            {/*  onCheckedChange={handleThemeToggle}*/}
            {/*/>*/}
            <UiserveSwitch
              checked={theme === 'dark'}
              onChange={handleThemeToggle}
              size={8}
            />
          </div>
        </DropdownMenuItem>
        <div className="p-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await logout();
              // Redirect to login without 'next' param to avoid permission issues
              navigate('/auth/signin', { replace: true });
            }}
          >
            Logout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
