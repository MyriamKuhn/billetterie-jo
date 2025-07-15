import { SnackbarProvider } from 'notistack';
import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline   from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { I18nextProvider, Trans, useTranslation } from 'react-i18next';
import i18n from './i18n';
import App from './App';
import { getAppTheme } from './theme';
import { useThemeStore } from './stores/useThemeStore';
import { useLanguageStore } from './stores/useLanguageStore';
import CookieConsent from 'react-cookie-consent';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs }           from '@mui/x-date-pickers/AdapterDayjs';

/**
 * Root component of the application.
 * It sets up the theme, language, and cookie consent management.
 * It also initializes the Zustand stores for theme and language.
 */
export function Root() {
  // Detect the user's preferred color scheme (light or dark)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Zustand store hooks for theme management
  const mode        = useThemeStore((s) => s.mode);
  const setLight    = useThemeStore((s) => s.setLight);
  const setDark     = useThemeStore((s) => s.setDark);
  const toggleMode  = useThemeStore((s) => s.toggle);

  // On initial mount, if no theme is stored, set theme based on OS preference
  useEffect(() => {
    if (localStorage.getItem('theme-mode') != null) return;

    if (prefersDarkMode) {
      setDark();
    } else {
      setLight();
    }
  }, []);

  // Zustand store hook for language selection
  const lang = useLanguageStore(state => state.lang);
  // Whenever stored language changes, update i18next
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  const { t } = useTranslation();

  return (
    // Provide a Snackbar context for notifications
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={3000}
      preventDuplicate
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      {/* Provide i18n context */}
      <I18nextProvider i18n={i18n}>
        {/* Apply Material‑UI theme */}
        <ThemeProvider theme={getAppTheme(mode)}>
          {/* Reset CSS baseline */}
          <CssBaseline />

          {/* Cookie consent banner */}
          <CookieConsent
            location="bottom"
            buttonText={t('cookieBanner.accept')}
            declineButtonText={t('cookieBanner.decline')}
            enableDeclineButton
            cookieName="jo2024_cookie_consent"
            style={{
              position: 'fixed',
              bottom: 0,
              width: '100%',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              zIndex: 2000,      
            }}
            buttonStyle={{
              background: '#009739',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
            declineButtonStyle={{
              background: '#E31937',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
            onAccept={() => {
              console.log('Cookies acceptés');
            }}
            onDecline={() => {
              console.log('Cookies refusés');
            }}
          >
            {/* Translatable cookie message with embedded privacy policy link */}
            <Trans
              i18nKey="cookieBanner.message"
              components={{
                privacyLink: (
                  <a
                    href="/privacy-policy"
                    style={{ color: '#68B9B5', textDecoration: 'underline' }}
                  />
                ),
              }}
            />
          </CookieConsent>
          
          {/* Date picker localization provider */}
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale={i18n.language}   
          >
            {/* Main application */}
            <App mode={mode} toggleMode={toggleMode} />
          </LocalizationProvider>
        </ThemeProvider>
      </I18nextProvider>
    </SnackbarProvider>
  );
}