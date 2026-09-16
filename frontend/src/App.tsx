import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { PartnersPage } from './pages/PartnersPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { OrdersPage } from './pages/OrdersPage';
import { WaybillsPage } from './pages/WaybillsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SystemInfoPage } from './pages/SystemInfoPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="waybills" element={<WaybillsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="info" element={<SystemInfoPage />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
