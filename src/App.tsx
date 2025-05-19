import { Navbar } from './components/Navbar';
import { Toolbar } from '@mui/material';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

interface AppProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export default function App({ mode, toggleMode }: AppProps) {
  const { i18n } = useTranslation();

  return (
    <BrowserRouter>
      <Navbar 
        mode={mode}
        toggleMode={toggleMode}
        currentLang={i18n.language}
        onLanguageChange={lang => i18n.changeLanguage(lang)} 
      />
      <Toolbar variant="dense" />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>

      { /* Ajouter le footer */}
    </BrowserRouter>
  );
}
