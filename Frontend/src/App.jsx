import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import PlansPage from './pages/Plans/PlansPage';
import SubscriptionsPage from './pages/Subscriptions/SubscriptionsPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import DiscountRulesPage from './pages/DiscountRules/DiscountRulesPage';
import TaxRulesPage from './pages/TaxRules/TaxRulesPage';
import CatalogPage from './pages/Catalog/CatalogPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

/**
 * Route guard requiring authentication
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Route guard requiring specific user roles
 */
function RoleGuard({ allowedRoles = [], fallback = '/dashboard', children }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}

/**
 * Root redirect based on role
 */
function RootRedirect() {
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RootRedirect />} />
              
              <Route
                path="/dashboard"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']} fallback="/subscriptions">
                    <DashboardPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/products"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']} fallback="/subscriptions">
                    <ProductsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/plans"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF']} fallback="/subscriptions">
                    <PlansPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/catalog"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']} fallback="/dashboard">
                    <CatalogPage />
                  </RoleGuard>
                }
              />

              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              
              <Route path="/invoices" element={<InvoicesPage />} />

              <Route
                path="/discount-rules"
                element={
                  <RoleGuard allowedRoles={['ADMIN']} fallback="/dashboard">
                    <DiscountRulesPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/tax-rules"
                element={
                  <RoleGuard allowedRoles={['ADMIN']} fallback="/dashboard">
                    <TaxRulesPage />
                  </RoleGuard>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
