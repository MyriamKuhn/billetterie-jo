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

/**
 * ForgotPasswordPage component
 * This page allows users to request a password reset by entering their email address.
 * It handles form submission, validation, and displays success or error messages.
 * It uses the `passwordForgottenDemand` service to send the request.
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation('forgotPassword');
  const navigate = useNavigate();
  const lang = useLanguageStore.getState().lang;

  // Local form state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Validate email format
  const validEmail = isEmailValid(email.trim());

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail) return;  // prevent if invalid
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Send password-reset request
      const { status } = await passwordForgottenDemand(
        email.trim(),
        lang
      );

      if (status >= 200 && status < 300) {
        setStatus('success'); // show success message
        setMessage(t('forgotPassword.successMessage'));
      } else {
        throw new Error('Unexpected status');
      }
    } catch (err) {
      // Extract API error code or fallback
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
      {/* SEO tags */}
      <Seo title={t('seo.title')} description={t('seo.description')} />
      {/* Page container */}
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
          {/* Page title and description */}
          <Typography variant="h4" gutterBottom align="center">
            {t('forgotPassword.title')}
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 2 }}>
            {t('forgotPassword.description')}
          </Typography>

          {/* Feedback message */}
          {(status === 'error' || status === 'success') && (
            <AlertMessage
              message={message}
              severity={status === 'success' ? 'success' : 'error'}
            />
          )}

          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* Email input */}
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

            {/* Submit button */}
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

            {/* Back to login link */}
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