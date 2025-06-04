import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { PageWrapper } from '../components/PageWrapper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import logoImg from '../assets/logos/jo_logo.png';
import { useLanguageStore } from '../stores/useLanguageStore';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { useAuthStore, type UserRole } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { logError } from '../utils/logger';

interface ApiResponse {
  message: string;
  code?: string;
  token?: string;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: 'user' | 'admin' | 'employee';
    twofa_enabled: boolean;
  };
  twofa_enabled?: boolean;
}

// Utilitaire pour construire les en-têtes Axios
function buildHeaders(lang: string, guestCartId: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
  };
  if (guestCartId) {
    h['X-Guest-Cart-Id'] = guestCartId;
  }
  return h;
}

// Utilitaire pour gérer la réussite du login (stockage + reload panier + navigate)
async function onLoginSuccess(
  token: string,
  role: UserRole,
  remember: boolean,
  setAuthToken: (t: string, r: boolean, role: UserRole) => void,
  clearGuestCartIdInStore: (id: string | null) => void,
  loadCart: () => Promise<void>,
  navigate: (path: string) => void
) {
  setAuthToken(token, remember, role);
  if (remember) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authRole', role);
  } else {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authRole', role);
  }

  clearGuestCartIdInStore(null);
  useCartStore.persist.clearStorage();
  await loadCart();

  if (role === 'admin') {
    navigate('/admin/dashboard');
  } else if (role === 'employee') {
    navigate('/employee/dashboard');
  } else {
    navigate('/user/dashboard');
  }
}

export default function LoginPage() {
  const { t } = useTranslation('login');
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [show2FA, setShow2FA] = useState<boolean>(false);
  const [twoFACode, setTwoFACode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  // Hooks Zustand
  const setAuthToken = useAuthStore((s) => s.setToken);
  const clearAuthToken = useAuthStore((s) => s.clearToken);
  const clearGuestCartIdInStore = useCartStore((s) => s.setGuestCartId);
  const guestCartId = useCartStore((s) => s.guestCartId);
  const loadCart = useCartStore((s) => s.loadCart);

  const handleSubmit = async (e: React.FormEvent, is2FA: boolean = false) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!is2FA) setShow2FA(false);
    setLoading(true);

    try {
      const headers = buildHeaders(useLanguageStore.getState().lang, guestCartId);

      const payload = {
        email,
        password,
        remember: rememberMe,
        twofa_code: is2FA ? twoFACode : '',
      };

      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/api/auth/login`,
        payload,
        { headers }
      );
      const data = response.data;

      // Si token renvoyé, on gère la réussite (2FA ou pas)
      if (data.token && data.user) {
        await onLoginSuccess(
          data.token,
          data.user.role as UserRole,
          rememberMe,
          setAuthToken,
          clearGuestCartIdInStore,
          loadCart,
          navigate
        );
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as ApiResponse | undefined;

        // ─── Cas 2FA requise ───────────────────────────────────────────────────
        if (status === 400 && data?.code === 'twofa_required') {
          setShow2FA(true);
          setLoading(false);
          return;
        }

        // ─── Cas email non vérifiée ───────────────────────────────────────────
        if (status === 400 && data?.code === 'email_not_verified') {
          setErrorMsg(t('errors.emailNotVerifiedSent'));
          setLoading(false);
          return;
        }

        // ─── Autres erreurs ───────────────────────────────────────────
        if (status === 404 || data?.code) {
          switch (data?.code) {
            case 'invalid_credentials':
              setErrorMsg(t('errors.invalidCredentials'));
              break;
            case 'account_disabled':
              setErrorMsg(t('errors.accountDisabled'));
              break;
            case 'twofa_invalid':
              setErrorMsg(t('errors.twofaInvalid'));
              break;
            default:
              setErrorMsg(t('errors.genericError'));
              break;
          }
        }
        else {
          // par défaut, on affiche le message générique
          setErrorMsg(t('errors.genericError'));
        }
      } else {
        logError('LoginPage:handleSubmitCredentials', err);
        setErrorMsg(t('errors.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLogin = async () => {
    setShow2FA(false);
    // 1) vider le token du store + session/localStorage
    clearAuthToken();
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    sessionStorage.removeItem('authRole');

    // 2) vider le panier invité
    clearGuestCartIdInStore(null);
    useCartStore.persist.clearStorage();

    await loadCart();

    // 3) retour à l’accueil
    navigate('/');
  };

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper disableCard>
        <Box
          component="form"
          onSubmit={show2FA ? (e) => handleSubmit(e, true) : (e) => handleSubmit(e, false)}
          sx={{
            maxWidth: 400,
            mx: 'auto',
            mt: { xs: 2, sm: 4, md: 8 },
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: 'background.paper',
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              component="img"
              src={logoImg}
              alt={t('login.logoAlt')}
              sx={{ height: 150, width: 'auto' }}
            />
          </Box>

          <Typography variant="h4" gutterBottom align="center">
            {t('login.pageTitle')}
          </Typography>

          {/* Message d’erreur ou d’information */}
          {errorMsg && (
            <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
              {errorMsg}
            </Typography>
          )}

          {/* Étape 1 : Email + Mot de passe */}
          {!show2FA && (
            <Stack spacing={2}>
              <TextField
                required
                fullWidth
                id="email"
                label={t('login.emailLabel')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <TextField
                required
                fullWidth
                id="password"
                label={t('login.passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword
                              ? t('login.hidePassword')
                              : t('login.showPassword')
                          }
                          onClick={toggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* “Se souvenir de moi” aligné à droite */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('login.rememberMe')}
                  sx={{ '.MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              </Box>

              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? `${t('login.loginButton')}…` : t('login.loginButton')}
              </Button>

              {/* Liens “Mot de passe oublié ?” et “S’inscrire” */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Link
                    href="/forgot-password"
                    underline="hover"
                    variant="body2"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {t('login.forgotPassword')}
                  </Link>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', mx: 0.5 }}>
                    |
                  </Typography>
                  <Link
                    href="/signup"
                    underline="hover"
                    variant="body2"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {t('login.noAccount')}
                  </Link>
                </Stack>
              </Box>   
            </Stack>
          )}

          {/* Étape 2 : Code 2FA */}
          {show2FA && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('login.twoFATitle')}
              </Typography>
              <TextField
                required
                fullWidth
                id="twoFACode"
                label={t('login.twoFACodeLabel')}
                type="text"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                autoComplete="one-time-code"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? `${t('login.verify2FAButton')}…` : t('login.verify2FAButton')}
              </Button>

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" justifyContent="end">
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleCancelLogin}
                  sx={{ fontSize: '0.8rem' }}
                >
                  {t('login.cancelLogin')}
                </Link>
              </Stack>
            </Box>
          )}
        </Box>
      </PageWrapper>
    </>
  );
}
