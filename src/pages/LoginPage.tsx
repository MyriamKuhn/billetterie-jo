// src/pages/LoginPage.tsx

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

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': useLanguageStore.getState().lang,
      };
      if (guestCartId) {
        headers['X-Guest-Cart-Id'] = guestCartId;
      }

      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/api/auth/login`,
        {
          email,
          password,
          remember: rememberMe,
          twofa_code: '',
        },
        { headers }
      );

      const data = response.data;

      // Si on reçoit un token, pas besoin de 2FA :
      if (data.token && data.user) {
        const role = data.user.role;
        // 1) on stocke le token dans le store et en sessionStorage/localStorage
        setAuthToken(data.token, rememberMe, role as UserRole);
          if (rememberMe) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authRole', role);
          } else {
            sessionStorage.setItem('authToken', data.token);
            sessionStorage.setItem('authRole', role);
          }

        // 2) on vide le guestCartId dans le store et on clr la persistence “cart-storage”
        clearGuestCartIdInStore(null);
        useCartStore.persist.clearStorage();

        // 3) on recharge le panier (fusion déjà traitée côté back)
        await loadCart();

        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'employee') {
          navigate('/employee/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as ApiResponse | undefined;

        // 400 + code == twofa_required → on affiche l’étape 2FA
        if (status === 400 && data?.code === 'twofa_required') {
          setShow2FA(true);
          setLoading(false);
          return;
        }

        // 404 → message générique
        if (status === 404) {
          setErrorMsg(t('genericError'));
        }
        else if (data?.code === 'invalid_credentials') {
          setErrorMsg(t('invalidCredentials'));
        }
        else if (data?.code === 'account_disabled') {
          setErrorMsg(t('accountDisabled'));
        }
        else if (data?.code === 'email_not_verified') {
          setErrorMsg(t('emailNotVerified'));
        }
        else {
          // par défaut, on affiche le message retourné si existant, sinon générique
          const msg = data?.message 
            ? t(data.code || '', { defaultValue: data.message }) 
            : t('genericError');
          setErrorMsg(msg);
        }
      } else {
        logError('LoginPage:handleSubmitCredentials', err);
        setErrorMsg(t('networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': useLanguageStore.getState().lang,
      };
      if (guestCartId) {
        headers['X-Guest-Cart-Id'] = guestCartId;
      }

      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/api/auth/login`,
        {
          email,
          password,
          remember: rememberMe,
          twofa_code: twoFACode,
        },
        { headers }
      );

      const data = response.data;

      if (data.token && data.user) {
        const role = data.user.role;
        setAuthToken(data.token, rememberMe, role as UserRole);
        if (rememberMe) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('authRole', role);
        } else {
          sessionStorage.setItem('authToken', data.token);
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
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as ApiResponse | undefined;

        if (status === 404) {
          setErrorMsg(t('genericError'));
        }
        else if (data?.code === 'twofa_invalid') {
          setErrorMsg(t('twofaInvalid'));
        }
        else {
          const msg = data?.message 
            ? t(data.code || '', { defaultValue: data.message }) 
            : t('genericError');
          setErrorMsg(msg);
        }
      } else {
        logError('LoginPage:handleSubmit2FA', err);
        setErrorMsg(t('networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLogin = async () => {
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
          onSubmit={show2FA ? handleSubmit2FA : handleSubmitCredentials}
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
              alt={t('logoAlt')}
              sx={{ height: 150, width: 'auto' }}
            />
          </Box>

          <Typography variant="h4" gutterBottom align="center">
            {t('pageTitle')}
          </Typography>

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
                label={t('emailLabel')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <TextField
                required
                fullWidth
                id="password"
                label={t('passwordLabel')}
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
                              ? t('hidePassword')
                              : t('showPassword')
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
                  label={t('rememberMe')}
                  sx={{ '.MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              </Box>

              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? `${t('loginButton')}…` : t('loginButton')}
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
                    {t('forgotPassword')}
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
                    {t('noAccount')}
                  </Link>
                </Stack>
              </Box>
            </Stack>
          )}

          {/* Étape 2 : Code 2FA */}
          {show2FA && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('twoFATitle')}
              </Typography>
              <TextField
                required
                fullWidth
                id="twoFACode"
                label={t('twoFACodeLabel')}
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
                {loading ? `${t('verify2FAButton')}…` : t('verify2FAButton')}
              </Button>

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" justifyContent="space-between">
                <Link href="/resend-2fa" underline="hover" variant="body2">
                  {t('resend2FA')}
                </Link>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleCancelLogin}
                  sx={{ fontSize: '0.8rem' }}
                >
                  {t('cancelLogin')}
                </Link>
              </Stack>
            </Box>
          )}
        </Box>
      </PageWrapper>
    </>
  );
}
