import React from 'react';
import { Navbar } from './components/Navbar';
import { Toolbar } from '@mui/material';
import HomePage from './pages/HomePage';
import TicketsPage from './pages/TicketsPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLanguageStore } from './stores/useLanguageStore';
import i18n from './i18n';
//import { DevAddTestItem } from './components/Cart/DevAddTestItem';

interface AppProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export default function App({ mode, toggleMode }: AppProps) {
  const lang = useLanguageStore(state => state.lang);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  React.useEffect(() => {
    if (i18n.language.split('-')[0] !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  return (
    <BrowserRouter>
      <Navbar 
        mode={mode}
        toggleMode={toggleMode}
      />
      <Toolbar variant="dense" />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tickets" element={<TicketsPage />} />
      </Routes>

      { /* <Footer /> */ }
      { /* Dev: bouton pour remplir le panier */ }
      { /* <DevAddTestItem /> */ }
    </BrowserRouter>
  );
}
