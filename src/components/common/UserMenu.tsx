'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface UserInfo {
  id: string;
  email: string;
  fullName?: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl?: string | null;
}

interface UserMenuProps {
  user: UserInfo;
}

type Language = 'uz' | 'ru' | 'en';
type Theme = 'light' | 'dark' | 'system';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

function getInitials(name?: string, email?: string): string {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
}

const UserMenu = ({ user }: UserMenuProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('uz');
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const savedLang = (localStorage.getItem('ustoz_lang') as Language) || 'uz';
    const savedTheme = (localStorage.getItem('ustoz_theme') as Theme) || 'light';
    setLanguage(savedLang);
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ustoz_lang', lang);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('ustoz_theme', newTheme);
    applyTheme(newTheme);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsOpen(false);
    router.push('/login');
    router.refresh();
  };

  const roleLabel =
    user.role === 'teacher' ? "O'qituvchi" : user.role === 'admin' ? 'Admin' : 'Talaba';
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-muted transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Foydalanuvchi menyusi"
        aria-expanded={isOpen}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.fullName || user.email}
            className="w-9 h-9 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {getInitials(user.fullName, user.email)}
          </div>
        )}
        <Icon
          name="ChevronDownIcon"
          size={16}
          className={`text-muted-foreground transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-popover rounded-md shadow-warm-xl border border-border z-200 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center space-x-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || user.email}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-semibold">
                  {getInitials(user.fullName, user.email)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.fullName || 'Foydalanuvchi'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium uppercase tracking-wider">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Profile link */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-smooth"
            >
              <Icon name="UserCircleIcon" size={18} className="text-muted-foreground" />
              <span>Profil sozlamalari</span>
            </Link>

            {user.role === 'student' && (
              <Link
                href="/transaction-history"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-smooth"
              >
                <Icon name="ClockIcon" size={18} className="text-muted-foreground" />
                <span>To'lov tarixi</span>
              </Link>
            )}
          </div>

          {/* Language */}
          <div className="border-t border-border py-2">
            <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Til · {currentLang.flag} {currentLang.label}
            </p>
            <div className="px-2 grid grid-cols-3 gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex flex-col items-center justify-center py-2 rounded-md transition-smooth text-xs ${
                    language === lang.code
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium mt-0.5">{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="border-t border-border py-2">
            <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mavzu
            </p>
            <div className="px-2 grid grid-cols-3 gap-1">
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`flex flex-col items-center justify-center py-2 rounded-md transition-smooth text-xs ${
                    theme === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  aria-label={t}
                >
                  <Icon
                    name={t === 'light' ? 'SunIcon' : t === 'dark' ? 'MoonIcon' : 'ComputerDesktopIcon'}
                    size={18}
                  />
                  <span className="font-medium mt-0.5">
                    {t === 'light' ? 'Yorug\'' : t === 'dark' ? 'Tun' : 'Avto'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={18} />
              <span>{isLoggingOut ? 'Chiqilmoqda...' : 'Chiqish'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
