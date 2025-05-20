import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import App from './App';
import { getAppTheme } from './theme';
import { useLanguageStore } from './stores/useLanguageStore';
import { HelmetProvider } from 'react-helmet-async';

function Root() {
  // Detection of the user's preferred color scheme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = React.useState<'light'|'dark'>(
    prefersDarkMode ? 'dark' : 'light'
  );
  React.useEffect(() => {
    setMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]);

  // Detection of the user's language
  const lang = useLanguageStore(state => state.lang);
  React.useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={getAppTheme(mode)}>
          <CssBaseline />
          <App 
            mode={mode} 
            toggleMode={() => setMode(m => m === 'light' ? 'dark' : 'light')}
          />
        </ThemeProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Root />);
