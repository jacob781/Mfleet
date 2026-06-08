import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../lib/auth';
import ProtectedRoute from '../../components/admin/ProtectedRoute';
import AdminLayout from '../../components/admin/AdminLayout';
import LoginPage from './LoginPage';
import ApplicationsListPage from './ApplicationsListPage';
import ApplicationCreatePage from './ApplicationCreatePage';
import ApplicationDetailPage from './ApplicationDetailPage';
import CompaniesPage from './CompaniesPage';
import DriversPage from './DriversPage';
import UsersPage from './UsersPage';

/**
 * Standalone manager admin section, mounted at /admin/* in App.tsx.
 * No public Header/Footer — its own AuthProvider, shell and routing.
 */
const AdminApp: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="applications" replace />} />
            <Route path="applications" element={<ApplicationsListPage />} />
            <Route path="applications/new" element={<ApplicationCreatePage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="applications" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AdminApp;
