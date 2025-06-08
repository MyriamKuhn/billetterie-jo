import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { PageWrapper } from '../components/PageWrapper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import AlertMessage from '../components/AlertMessage';
import { useLanguageStore } from '../stores/useLanguageStore';
import { resetPassword } from '../services/authService';
import { getErrorMessage } from '../utils/errorUtils';
import { logError } from '../utils/logger';
import PasswordWithConfirmation from '../components/PasswordWithConfirmation';
import { isStrongPassword } from '../utils/validation';

export default function PasswordResetPage() {
  const { t } = useTranslation('passwordReset');
  const navigate = useNavigate();
  const lang = useLanguageStore.getState().lang;

  // Récupère token & email depuis l'URL
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailFromUrl = searchParams.get('email') ?? '';

  // états des champs
  const [email] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Valide format & match
  const pwStrong = isStrongPassword(password);
  const pwsMatch = password === confirmPassword;

  // Si on arrive sans token ou email, on renvoie vers login
  useEffect(() => {
    if (!token || !email) {
      navigate('/login', { replace: true });
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setTouched(true);

    if (!pwStrong) {
      setErrorMsg(t('errors.passwordNotStrong'));
      return;
    }
    if (!pwsMatch) {
      setErrorMsg(t('errors.passwordsDontMatch'));
      return;
    }

    setLoading(true);
    try {
      const { status } = await resetPassword(
        token,
        email,
        password,
        confirmPassword,
        lang
      );

      if (status >= 200 && status < 300) {
        setSuccessMsg(t('passwordReset.successMessage'));
      } else {
        throw new Error('Unexpected status');
      }
    } catch (err: any) {
      if (err.response && err.response.data?.code) {
        setErrorMsg(getErrorMessage(t, err.response.data.code));
      } else if (err.isAxiosError) {
        setErrorMsg(getErrorMessage(t, 'network_error'));
      } else {
        logError('PasswordResetPage:handleSubmit', err);
        setErrorMsg(getErrorMessage(t, 'generic_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper disableCard>
        <Box
          component="form"
          onSubmit={handleSubmit}
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
          <Typography variant="h4" gutterBottom align="center">
            {t('passwordReset.title')}
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 2 }}>
            {t('passwordReset.description')}
          </Typography>

          {(errorMsg || successMsg) && (
            <Box aria-live="polite" sx={{ mb: 2 }}>
              <AlertMessage
                message={errorMsg ?? successMsg!}
                severity={successMsg ? 'success' : 'error'}
              />
            </Box>
          )}

          {!successMsg && (
            <Stack spacing={2}>
              <PasswordWithConfirmation
                password={password}
                onPasswordChange={setPassword}
                confirmPassword={confirmPassword}
                onConfirmChange={setConfirmPassword}
                touched={touched}
                onBlur={() => setTouched(true)}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={
                  loading ||
                  !pwStrong ||
                  !pwsMatch
                }
                startIcon={
                  loading
                    ? <CircularProgress color="inherit" size={16} />
                    : undefined
                }
              >
                {loading
                  ? `${t('passwordReset.buttonLoading')}…`
                  : t('passwordReset.button')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                >
                  {t('passwordReset.backToLogin')}
                </Link>
              </Box>
            </Stack>
          )}

          {successMsg && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
              >
                {t('passwordReset.goToLogin')}
              </Button>
            </Box>
          )}
        </Box>
      </PageWrapper>
    </>
  );
}
