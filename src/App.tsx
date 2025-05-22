import React, { Suspense, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toolbar from '@mui/material/Toolbar';
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
      <Navbar mode={mode} toggleMode={toggleMode} />
      <Toolbar variant="dense" />

        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tickets" element={<TicketsPage />} />
          </Routes>
        </Suspense>

      { /* <Footer /> */ }
    </BrowserRouter>
  );
}
