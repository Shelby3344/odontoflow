import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Dashboard Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Patient Pages
import { PatientsListPage } from '../pages/patients/PatientsListPage';
import { PatientDetailPage } from '../pages/patients/PatientDetailPage';
import { PatientFormPage } from '../pages/patients/PatientFormPage';

// Schedule Pages
import { SchedulePage } from '../pages/schedule/SchedulePage';

// Clinical Pages
import { ClinicalRecordsPage } from '../pages/clinical/ClinicalRecordsPage';
import { OdontogramPage } from '../pages/clinical/OdontogramPage';

// Financial Pages
import { FinancialDashboardPage } from '../pages/financial/FinancialDashboardPage';
import { TransactionsPage } from '../pages/financial/TransactionsPage';
import { BudgetsPage } from '../pages/financial/BudgetsPage';

// AI Pages
import { AIAssistantPage } from '../pages/ai/AIAssistantPage';

// Reports Pages
import { ReportsPage } from '../pages/reports/ReportsPage';

// Settings Pages
import { SettingsPage } from '../pages/settings/SettingsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Patients */}
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/new" element={<PatientFormPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/patients/:id/edit" element={<PatientFormPage />} />
        <Route path="/patients/:id/odontogram" element={<OdontogramPage />} />

        {/* Schedule */}
        <Route path="/schedule" element={<SchedulePage />} />

        {/* Clinical */}
        <Route path="/clinical" element={<ClinicalRecordsPage />} />
        <Route path="/clinical/records/:id" element={<ClinicalRecordsPage />} />

        {/* Financial */}
        <Route path="/financial" element={<FinancialDashboardPage />} />
        <Route path="/financial/transactions" element={<TransactionsPage />} />
        <Route path="/financial/budgets" element={<BudgetsPage />} />

        {/* AI Assistant */}
        <Route path="/ai-assistant" element={<AIAssistantPage />} />

        {/* Reports */}
        <Route path="/reports" element={<ReportsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/:section" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
