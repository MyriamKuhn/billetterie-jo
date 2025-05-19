import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import App from './App';
import { getAppTheme } from './theme';

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
  React.useEffect(() => {
    const navLang = navigator.language; // ex: "fr-FR" ou "en-US"
    const shortLang = navLang.split('-')[0]; // "fr" ou "en"
    i18n.changeLanguage(shortLang);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={getAppTheme(mode)}>
        <CssBaseline />
        <App 
          mode={mode} 
          toggleMode={() => setMode(m => m === 'light' ? 'dark' : 'light')}
        />
      </ThemeProvider>
    </I18nextProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Root />);
