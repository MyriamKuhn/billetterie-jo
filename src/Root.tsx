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
import { HelmetProvider } from 'react-helmet-async';
import CookieConsent from 'react-cookie-consent';

export function Root() {
  // Detection of the user's preferred color scheme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Zustand store for theme management
  const mode        = useThemeStore((s) => s.mode);
  const setLight    = useThemeStore((s) => s.setLight);
  const setDark     = useThemeStore((s) => s.setDark);
  const toggleMode  = useThemeStore((s) => s.toggle);

  // Update the Zustand store based on the user's preference
  useEffect(() => {
    if (localStorage.getItem('theme-mode') != null) return;

    if (prefersDarkMode) {
      setDark();
    } else {
      setLight();
    }
  }, []);

  // Detection of the user's language
  const lang = useLanguageStore(state => state.lang);
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  const { t } = useTranslation();

  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={getAppTheme(mode)}>
          <CssBaseline />

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

          <App mode={mode} toggleMode={toggleMode} />
        </ThemeProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
}