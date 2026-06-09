import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Button, cn } from './ui';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/applications', label: 'Applications' },
    { to: '/admin/companies', label: 'Companies' },
    { to: '/admin/drivers', label: 'Drivers' },
    // User management is admin-only.
    ...(user?.role === 'admin' ? [{ to: '/admin/users', label: 'Users' }] : []),
    { to: '/admin/account', label: 'Account' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-mfleet-gray-dark font-sans">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
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
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
