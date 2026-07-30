import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { googleStatus, listAlerts } from '../../lib/adminApi';
import type { GoogleStatus } from '../../lib/adminTypes';
import { Button, cn } from './ui';

// Google connection chip in the navbar: logo + status dot (green ✓ / red ✕),
// tooltip on hover, click opens Settings. Admin-only.
const GoogleBadge: React.FC = () => {
  const navigate = useNavigate();
  const [st, setSt] = useState<GoogleStatus | null>(null);
  useEffect(() => {
    googleStatus().then(setSt).catch(() => setSt(null));
  }, []);
  const connected = !!st?.connected;
  const tip = !st
    ? 'Checking Google connection…'
    : connected
      ? `Google connected${st.email ? ` — ${st.email}` : ''}`
      : st.configured
        ? 'Google not connected — click to set up'
        : 'Google not configured on the server';
  return (
    <button
      type="button"
      title={tip}
      onClick={() => navigate('/admin/settings')}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
      aria-label={tip}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold leading-none text-white ring-2 ring-white',
          connected ? 'bg-green-500' : 'bg-red-500',
        )}
      >
        {connected ? '✓' : '✕'}
      </span>
    </button>
  );
};

// Day/night switch. The `dark` class on the shell re-points Tailwind's colour
// variables (see index.css), so the whole panel follows. ponytail: localStorage
// + one class, no theme context.
const THEME_KEY = 'mfleet_theme';

const ThemeToggle: React.FC<{ dark: boolean; onToggle: () => void }> = ({ dark, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mfleet-gray hover:bg-gray-100 hover:text-mfleet-gray-dark"
  >
    {dark ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    )}
  </button>
);

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  // Live count for the alerts badge; refreshed on mount (cheap query).
  useEffect(() => {
    listAlerts().then((a) => setAlertCount(a.length)).catch(() => setAlertCount(0));
  }, []);

  const navItems = [
    { to: '/admin/applications', label: 'Applications' },
    { to: '/admin/companies', label: 'Companies' },
    { to: '/admin/drivers', label: 'Drivers' },
    { to: '/admin/trucks', label: 'Vehicles' },
    { to: '/admin/alerts', label: 'Alerts', badge: alertCount },
    // User management + settings are admin-only.
    ...(user?.role === 'admin'
      ? [
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/settings', label: 'Settings' },
        ]
      : []),
    { to: '/admin/account', label: 'Account' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={cn('min-h-screen bg-gray-50 text-mfleet-gray-dark font-sans', dark && 'dark')}>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-extrabold tracking-tight text-mfleet-blue">
              Mfleet <span className="text-mfleet-gray-dark">CRM</span>
            </span>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-mfleet-blue/10 text-mfleet-blue'
                        : 'text-mfleet-gray hover:bg-gray-100 hover:text-mfleet-gray-dark',
                    )
                  }
                >
                  {item.label}
                  {'badge' in item && (item.badge ?? 0) > 0 && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle dark={dark} onToggle={() => setDark((v) => !v)} />
            {user?.role === 'admin' && <GoogleBadge />}
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-mfleet-gray-dark">
                {user?.full_name || user?.email}
              </div>
              <div className="text-xs capitalize text-mfleet-gray">{user?.role}</div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
