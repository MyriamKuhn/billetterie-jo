import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { PageWrapper } from '../components/PageWrapper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import AlertMessage from '../components/AlertMessage/AlertMessage';
import { useLanguageStore } from '../stores/useLanguageStore';
import axios from 'axios';
import { passwordForgottenDemand } from '../services/authService';
import { getErrorMessage } from '../utils/errorUtils';
import { logError } from '../utils/logger';
import { isEmailValid } from '../utils/validation';
import type { ApiResponse } from '../types/apiResponse';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('forgotPassword');
  const navigate = useNavigate();
  const lang = useLanguageStore.getState().lang;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validEmail = isEmailValid(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail) return;
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const { status } = await passwordForgottenDemand(
        email.trim(),
        lang
      );

      if (status >= 200 && status < 300) {
        setStatus('success');
        setMessage(t('forgotPassword.successMessage'));
      } else {
        throw new Error('Unexpected status');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as ApiResponse | undefined;
        if (data?.code) {
          setMessage(getErrorMessage(t, data?.code));
        } else {
          setMessage(getErrorMessage(t, 'generic_error'));
        }
      } else {
        logError('ForgotPasswordDemand:handleSubmit', err);
        setMessage(getErrorMessage(t, 'network_error'));
      }
      setStatus('error');
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
            {t('forgotPassword.title')}
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 2 }}>
            {t('forgotPassword.description')}
          </Typography>

          {(status === 'error' || status === 'success') && (
            <AlertMessage
              message={message}
              severity={status === 'success' ? 'success' : 'error'}
            />
          )}

          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              id="email"
              label={t('forgotPassword.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={email.length > 0 && !validEmail}
              helperText={
                email.length > 0 && !validEmail
                  ? t('forgotPassword.invalidEmail') 
                  : ''
              }
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !validEmail}
              startIcon={
                loading ? <CircularProgress color="inherit" size={16} /> : undefined
              }
            >
              {loading
                ? `${t('forgotPassword.buttonLoading')}…`
                : t('forgotPassword.button')}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
              >
                {t('forgotPassword.backToLogin')}
              </Link>
            </Box>
          </Stack>
        </Box>
      </PageWrapper>
    </>
  );
}