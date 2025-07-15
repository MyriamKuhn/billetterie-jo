import { Suspense, useEffect, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toolbar from '@mui/material/Toolbar';
import BackToTop from './components/BackToTop';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLanguageStore } from './stores/useLanguageStore';
import i18n from './i18n';
import Box from '@mui/material/Box';
import OlympicLoader from './components/OlympicLoader';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RequireAuth } from './components/RequireAuth';

// Lazy‑load all page components to split code and speed up initial load
const HomePage    = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const LegalMentionsPage = lazy(() => import('./pages/LegalMentionsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const VerificationResultPage = lazy(() => import('./pages/VerificationResultPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const UserTicketsPage = lazy(() => import('./pages/UserTicketsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminEmployeesPage = lazy(() => import('./pages/AdminEmployeesPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const AdminPaymentsPage = lazy(() => import('./pages/AdminPaymentsPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const EmployeeDashboardPage = lazy(() => import('./pages/EmployeeDashboardPage'));
const EmployeeScanPage = lazy(() => import('./pages/EmployeeScanPage'));
const EmployeeValidatePage = lazy(() => import('./pages/EmployeeValidatePage'));


interface AppProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

/**
 * App component that serves as the main entry point for the application.
 * It sets up the router, handles language changes, and renders the main layout
 * including the navbar, footer, and main content area.
 * It also includes error boundaries for better error handling
 * and lazy loading for performance optimization.
 */
export default function App({ mode, toggleMode }: AppProps) {
  // Read the current language from our Zustand store
  const lang = useLanguageStore(state => state.lang);

  // Whenever the language changes, update the <html> lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Ensure i18next uses our store’s language
  useEffect(() => {
    const base = i18n.language.split('-')[0];
    if (base !== lang) i18n.changeLanguage(lang);
  }, [lang]);

  return (
    <BrowserRouter>
      {/* Scroll restoration on navigation */}
      <ScrollToTop />

      {/* Layout container */}
      <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
        {/* Main navigation bar */}
        <Navbar mode={mode} toggleMode={toggleMode} />

        {/* Toolbar anchor for “back to top” button */}
        <Toolbar id="back-to-top-anchor" variant="dense" />

        {/* Main content area grows to fill available space */}
        <Box sx={{ flex: 1 }}>
          {/* Catches rendering errors in child components */}
          <ErrorBoundary>
            {/* Show loader while lazy‑loaded pages are being fetched */}
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4 }}>
                <OlympicLoader />
              </Box>
            }>
              {/* Route definitions */}
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/tickets" element={<ProductsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/legal-mentions" element={<LegalMentionsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy-policy" element={<PolicyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verification-result/:status" element={<VerificationResultPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/password-reset" element={<PasswordResetPage />} />
                <Route path="/cart" element={<CartPage />} />

                {/* Unauthorized notice page */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* User‑protected routes */}
                <Route path="/user/dashboard" element={<RequireAuth requiredRole="user"><UserDashboardPage /></RequireAuth>}/>
                <Route path="/checkout" element={<RequireAuth requiredRole="user"><CheckoutPage /></RequireAuth>} />
                <Route path="/confirmation" element={<RequireAuth requiredRole="user"><ConfirmationPage /></RequireAuth>} />
                <Route path="/user/orders" element={<RequireAuth requiredRole="user"><InvoicesPage /></RequireAuth>} />
                <Route path="/user/tickets" element={<RequireAuth requiredRole="user"><UserTicketsPage /></RequireAuth>} />

                {/* Admin‑protected routes */}
                <Route path="/admin/dashboard" element={<RequireAuth requiredRole="admin"><AdminDashboardPage /></RequireAuth>} />
                <Route path="/admin/tickets" element={<RequireAuth requiredRole="admin"><AdminProductsPage /></RequireAuth>} />
                <Route path="/admin/users" element={<RequireAuth requiredRole="admin"><AdminUsersPage /></RequireAuth>} />
                <Route path="/admin/employees" element={<RequireAuth requiredRole="admin"><AdminEmployeesPage /></RequireAuth>} />
                <Route path="/admin/orders" element={<RequireAuth requiredRole="admin"><AdminOrdersPage /></RequireAuth>} />
                <Route path="/admin/payments" element={<RequireAuth requiredRole="admin"><AdminPaymentsPage /></RequireAuth>} />
                <Route path="/admin/reports" element={<RequireAuth requiredRole="admin"><AdminReportsPage /></RequireAuth>} />
                
                {/* Employee‑protected routes */}
                <Route path="/employee/dashboard" element={<RequireAuth requiredRole="employee"><EmployeeDashboardPage /></RequireAuth>} />
                <Route path="/employee/scan" element={<RequireAuth requiredRole="employee"><EmployeeScanPage /></RequireAuth>} />
                <Route path="/employee/validate" element={<RequireAuth requiredRole="employee"><EmployeeValidatePage /></RequireAuth>} />

              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Box>

        {/* “Back to top” floating button */}
        <BackToTop />
        
        {/* Footer at the bottom of every page */}
        <Footer />
      </Box>
    </BrowserRouter>
  );
}
