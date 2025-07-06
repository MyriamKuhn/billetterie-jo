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






interface AppProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export default function App({ mode, toggleMode }: AppProps) {
  const lang = useLanguageStore(state => state.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const base = i18n.language.split('-')[0];
    if (base !== lang) i18n.changeLanguage(lang);
  }, [lang]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
        <Navbar mode={mode} toggleMode={toggleMode} />
        <Toolbar id="back-to-top-anchor" variant="dense" />

        <Box sx={{ flex: 1 }}>
          <ErrorBoundary>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4 }}>
                <OlympicLoader />
              </Box>
            }>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tickets" element={<ProductsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/legal-mentions" element={<LegalMentionsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy-policy" element={<PolicyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verification-result/:status" element={<VerificationResultPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/password-reset" element={<PasswordResetPage />} />

                {/* Unauthorized route */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* Protected routes */}
                <Route path="/user/dashboard" element={<RequireAuth requiredRole="user"><UserDashboardPage /></RequireAuth>}/>
                <Route path="/checkout" element={<RequireAuth requiredRole="user"><CheckoutPage /></RequireAuth>} />
                <Route path="/confirmation" element={<RequireAuth requiredRole="user"><ConfirmationPage /></RequireAuth>} />
                <Route path="/user/orders" element={<RequireAuth requiredRole="user"><InvoicesPage /></RequireAuth>} />
                <Route path="/user/tickets" element={<RequireAuth requiredRole="user"><UserTicketsPage /></RequireAuth>} />

                {/* Admin routes */}
                <Route path="/admin/dashboard" element={<RequireAuth requiredRole="admin"><AdminDashboardPage /></RequireAuth>} />
                <Route path="/admin/tickets" element={<RequireAuth requiredRole="admin"><AdminProductsPage /></RequireAuth>} />
                <Route path="/admin/users" element={<RequireAuth requiredRole="admin"><AdminUsersPage /></RequireAuth>} />
                <Route path="/admin/employees" element={<RequireAuth requiredRole="admin"><AdminEmployeesPage /></RequireAuth>} />
                
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Box>

        <BackToTop />

        <Footer />
      </Box>
    </BrowserRouter>
  );
}
