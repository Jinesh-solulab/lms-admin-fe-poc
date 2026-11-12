import { ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Button, Result, Spin } from 'antd';
import { useAuth } from './auth';
import { useI18n } from './i18n';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ModulesPage } from './pages/ModulesPage';
import { ModuleDetailPage } from './pages/ModuleDetailPage';
import { RidersPage } from './pages/RidersPage';
import { RiderDetailPage } from './pages/RiderDetailPage';
import { BlockLogsPage } from './pages/BlockLogsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="center-screen">
        <Spin size="large" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function NotFound() {
  const { t } = useI18n();
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('common.notFound')}
      extra={
        <Link to="/dashboard">
          <Button type="primary">{t('common.backHome')}</Button>
        </Link>
      }
    />
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/modules/:id" element={<ModuleDetailPage />} />
        <Route path="/riders" element={<RidersPage />} />
        <Route path="/riders/:id" element={<RiderDetailPage />} />
        <Route path="/block-logs" element={<BlockLogsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
