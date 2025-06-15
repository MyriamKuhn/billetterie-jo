import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
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
import axios from 'axios';
import { useAuthStore, type UserRole } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { logError } from '../utils/logger';
import { loginUser, resendVerificationEmail } from '../services/authService';
import { getErrorMessage } from '../utils/errorUtils';
import AlertMessage from '../components/AlertMessage/AlertMessage';
import { onLoginSuccess, logout } from '../utils/authHelper';
import CircularProgress from '@mui/material/CircularProgress';
import { useCustomSnackbar } from '../hooks/useCustomSnackbar';
import type { ApiResponse } from '../types/apiResponse';

export default function LoginPage() {
  const { t } = useTranslation('login');
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useCustomSnackbar();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [show2FA, setShow2FA] = useState<boolean>(false);
  const [twoFACode, setTwoFACode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  // Hooks Zustand
  const setAuthToken = useAuthStore((s) => s.setToken);
  const clearAuthToken = useAuthStore((s) => s.clearToken);
  const clearGuestCartIdInStore = useCartStore((s) => s.setGuestCartId);
  const guestCartId = useCartStore((s) => s.guestCartId);
  const loadCart = useCartStore((s) => s.loadCart);

  const handleSubmit = async (e: React.FormEvent, is2FA: boolean) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!is2FA) setShow2FA(false);
    setEmailNotVerified(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      const data = await loginUser(
        email,
        password,
        rememberMe,
        is2FA ? twoFACode : '',
        useLanguageStore.getState().lang,
        guestCartId
      );
    
      // Si token renvoyé, on gère la réussite (2FA ou pas)
      if (data.token && data.user) {
        // Afficher le snackbar de bienvenue
        notify(t('login.welcomeUser', { name: data.user.firstname }), 'success');
        // extraire le next paramètre de l'URL
        const params = new URLSearchParams(location.search);
        const next = params.get('next') ?? undefined;

        await onLoginSuccess(
          data.token,
          data.user.role as UserRole,
          rememberMe,
          setAuthToken,
          clearGuestCartIdInStore,
          loadCart,
          navigate,
          next
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
          setEmailNotVerified(true);
          setLoading(false);
          return;
        }

        // ─── Autres erreurs ───────────────────────────────────────────
        if (status === 404 || data?.code) {
          setErrorMsg(getErrorMessage(t, data?.code));
        }
        else {
          // par défaut, on affiche le message générique
          setErrorMsg(getErrorMessage(t, 'generic_error'));
        }
      } else {
        logError('LoginPage:handleSubmitCredentials', err);
        setErrorMsg(getErrorMessage(t, 'network_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setErrorMsg(null);

    try {
      const { status, data } = await resendVerificationEmail(email, useLanguageStore.getState().lang);

      if (status === 200 && data.message) {
        setResendSuccess(true);
        setEmailNotVerified(false);
        return;
      }
      
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as ApiResponse | undefined;

        if (data?.code) {
          setErrorMsg(getErrorMessage(t, data?.code));
        }
        else {
          setErrorMsg(getErrorMessage(t, 'generic_error'));
        }
      } else {
        logError('LoginPage:handleResendVerification', err);
        setErrorMsg(getErrorMessage(t, 'network_error'));
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleCancelLogin = async () => {
    setShow2FA(false);
    await logout(
      clearAuthToken,
      clearGuestCartIdInStore,
      loadCart,
      navigate,
      '/login'
    );
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
            mt: { xs: 1, sm: 4, md: 8 },
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
          {errorMsg && <AlertMessage message={errorMsg} severity="error" />}

          {/* Confirmation d’envoi manuel */}
          {resendSuccess && <AlertMessage message={t('login.verificationEmailResent')} severity="success" />}

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

              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                disabled={loading}
                startIcon={
                  loading
                    ? <CircularProgress color="inherit" size={16} />
                    : undefined
                }
              >
                {loading ? `${t('login.loginButtonLoad')}…` : t('login.loginButton')}
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

              {/* Lien de secours si l’e-mail de vérification n’est pas reçu */}
              {emailNotVerified && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {t('login.emailNotVerifiedHint')}{' '}
                    <Link
                      component="button"
                      variant="body2"
                      onClick={handleResendVerification}
                      disabled={resendLoading || !/.+@.+\..+/.test(email)}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {resendLoading
                        ? `${t('login.resendLinkText')}…`
                        : t('login.resendLinkText')}
                      {resendLoading && (
                        <CircularProgress
                          color="inherit"
                          size={12}
                          sx={{ mr: 0.5 }}
                        />
                      )}
                    </Link>
                  </Typography>
                </Box>
              )}
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
                startIcon={
                  loading
                    ? <CircularProgress color="inherit" size={16} />
                    : undefined
                }
              >
                {loading ? `${t('login.verify2FALoad')}…` : t('login.verify2FAButton')}
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
