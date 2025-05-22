import React, { Suspense, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toolbar from '@mui/material/Toolbar';
import BackToTop from './components/BackToTop';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLanguageStore } from './stores/useLanguageStore';
import i18n from './i18n';
import { Box, CircularProgress } from '@mui/material';

const HomePage    = React.lazy(() => import('./pages/HomePage'));
const TicketsPage = React.lazy(() => import('./pages/TicketsPage'));

const Loader: React.FC = () => (
  <Box
    sx={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100%',
      py:             4,
    }}
  >
    <CircularProgress />
  </Box>
);

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
      <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
        <Navbar mode={mode} toggleMode={toggleMode} />
        <Toolbar id="back-to-top-anchor" variant="dense" />

        <Box sx={{ flex: 1 }}>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tickets" element={<TicketsPage />} />
            </Routes>
          </Suspense>
        </Box>

        <BackToTop />

        <Footer />
      </Box>
    </BrowserRouter>
  );
}
