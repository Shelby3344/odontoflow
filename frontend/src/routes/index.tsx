import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const PatientsListPage = lazy(() => import('../pages/patients/PatientsListPage'));
const PatientDetailPage = lazy(() => import('../pages/patients/PatientDetailPage'));
const PatientFormPage = lazy(() => import('../pages/patients/PatientFormPage'));
const SchedulePage = lazy(() => import('../pages/schedule/SchedulePage'));
const OdontogramPage = lazy(() => import('../pages/clinical/OdontogramPage'));
const AIAssistantPage = lazy(() => import('../pages/ai/AIAssistantPage'));
const FinancialDashboardPage = lazy(() => import('../pages/financial/FinancialDashboardPage'));
const TransactionsPage = lazy(() => import('../pages/financial/TransactionsPage'));
const BudgetsPage = lazy(() => import('../pages/financial/BudgetsPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));

// Loading component
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner" />
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Patients */}
          <Route path="/patients" element={<PatientsListPage />} />
          <Route path="/patients/new" element={<PatientFormPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/patients/:id/edit" element={<PatientFormPage />} />
          
          {/* Schedule */}
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/schedule/new" element={<SchedulePage />} />
          <Route path="/schedule/:id" element={<SchedulePage />} />
          
          {/* Clinical */}
          <Route path="/clinical/odontogram" element={<OdontogramPage />} />
          <Route path="/clinical/odontogram/:patientId" element={<OdontogramPage />} />
          <Route path="/clinical/records" element={<DashboardPage />} />
          
          {/* AI */}
          <Route path="/ai" element={<AIAssistantPage />} />
          
          {/* Financial */}
          <Route path="/financial" element={<FinancialDashboardPage />} />
          <Route path="/financial/transactions" element={<TransactionsPage />} />
          <Route path="/financial/transactions/new" element={<TransactionsPage />} />
          <Route path="/financial/budgets" element={<BudgetsPage />} />
          <Route path="/financial/budgets/new" element={<BudgetsPage />} />
          
          {/* Reports */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:type" element={<ReportsPage />} />
          
          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:section" element={<SettingsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
