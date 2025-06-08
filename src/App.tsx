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

const HomePage    = lazy(() => import('./pages/HomePage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const LegalMentionsPage = lazy(() => import('./pages/LegalMentionsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const VerificationResultPage = lazy(() => import('./pages/VerificationResultPage'));

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
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/legal-mentions" element={<LegalMentionsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy-policy" element={<PolicyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verification-result/:status" element={<VerificationResultPage />} />
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
