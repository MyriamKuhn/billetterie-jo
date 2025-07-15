import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import logoImg from '../assets/logos/jo_logo.png';
import ReCAPTCHA from 'react-google-recaptcha';
import { registerUser } from '../services/authService';
import AlertMessage from '../components/AlertMessage';
import { getErrorMessage } from '../utils/errorUtils';
import { RECAPTCHA_SITE_KEY } from '../config'
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useLanguageStore } from '../stores/useLanguageStore';
import axios from 'axios';
import { useSignupValidation } from '../hooks/useSignupValidation';
import PasswordWithConfirmation from '../components/PasswordWithConfirmation';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * SignupPage component
 * This page handles user registration, including form validation,
 * reCAPTCHA integration, and error handling.
 * It provides a user-friendly interface for new users to create an account.
 */
export default function SignupPage() {
  const { t } = useTranslation('signup');
  const lang = useLanguageStore(state => state.lang);
  const theme = useTheme();

  // Determine recaptcha widget variant
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';
  const widgetKey = `${lang}-${isDarkMode ? 'dark' : 'light'}-${isMobile ? 'compact' : 'normal'}`;

  // Form field states
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Touched flags for inline validation
  const [firstnameTouched, setFirstnameTouched] = useState(false);
  const [lastnameTouched, setLastnameTouched]   = useState(false);
  const [emailTouched, setEmailTouched]         = useState(false);
  const [pwdTouched, setPwdTouched]      = useState(false);

  // Front‑end validation logic
  const {
    firstnameError, lastnameError, emailError,
    pwStrong, pwsMatch,
    isFirstnameValid, isLastnameValid, isEmailValid
  } = useSignupValidation({firstname, lastname, email, password, confirmPassword, firstnameTouched, lastnameTouched, emailTouched});

  // Recaptcha token
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client‑side checks
    if (!pwStrong) {
      setErrorMsg(t('errors.passwordNotStrong')); 
      return;
    }
    if (!pwsMatch) {
      setErrorMsg(t('errors.passwordsDontMatch'));
      return;
    }
    if (!acceptTerms) {
      setErrorMsg(t('errors.mustAgreeTOS'));
      return;
    }
    if (!captchaToken) {
      setErrorMsg(t('errors.captchaRequired'));
      return;
    }

    setLoading(true);
    try {
      // Call registration API
      const { status } = await registerUser(
        {
          firstname,
          lastname,
          email,
          password,
          password_confirmation: confirmPassword,
          captcha_token: captchaToken,
          accept_terms: acceptTerms,
        },
        lang
      );

      if (status === 201) {
        setSuccessMsg(t('signup.successMessage'));
        // Reset captcha widget
        captchaRef.current?.reset();
      }
    } catch (err: any) {
      setLoading(false);
      captchaRef.current?.reset();
      setCaptchaToken(null);

      if (axios.isAxiosError(err) && err.response) {
        const { status, data } = err.response;

        if (status === 429) {
          setErrorMsg(getErrorMessage(t, 'too_many_requests'));
          return;
        }
        if (status === 500) {
          setErrorMsg(getErrorMessage(t, 'internal_error'));
          return;
        }
        if (status === 422 && data.code === 'validation_error') {
          // Handle unique‑email error specifically
          const emailErrors: string[] = data.errors?.email || [];
          setErrorMsg(getErrorMessage(t, data.code));
          if (emailErrors.includes('validation.unique')) {
            setErrorMsg(getErrorMessage(t, 'email_already_registered'));
          } else {
            setErrorMsg(getErrorMessage(t, 'validation_error'));
          }
          return;
        }
        if (data.code) {
          // Other business errors
          setErrorMsg(getErrorMessage(t, data.code));
        } else {
          setErrorMsg(getErrorMessage(t, 'generic_error'));
        }
      } else {
        setErrorMsg(getErrorMessage(t, 'network_error'));
      }
    }
  }

  return (
    <>
      {/* SEO metadata */}
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper disableCard>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: 400,
            mx: 'auto',
            mt: { xs: 0, sm: 1, md: 1 },
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
              alt={t('signup.logoAlt')}
              sx={{ height: 150, width: 'auto' }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h4" gutterBottom align="center">
            {t('signup.pageTitle')}
          </Typography>

          {/* Error or success message */}
          {errorMsg && <AlertMessage message={errorMsg} severity="error" />}
          {successMsg && (
            <>
              <AlertMessage message={successMsg} severity="success" />
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Button component={Link} href="/login" variant="outlined">
                  {t('signup.goToLogin')}
                </Button>
              </Box>
            </>
          )}

          {/* Form fields */}
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              id="firstname"
              label={t('signup.firstnameLabel')}
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              onBlur={() => setFirstnameTouched(true)}
              autoComplete="given-name"
              error={firstnameError}
              helperText={firstnameError ? t('errors.firstnameRequired') : ''}
            />
            <TextField
              required
              fullWidth
              id="lastname"
              label={t('signup.lastnameLabel')}
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              onBlur={() => setLastnameTouched(true)}
              autoComplete="family-name"
              error={lastnameError}
              helperText={lastnameError ? t('errors.lastnameRequired') : ''}
            />
            <TextField
              required
              fullWidth
              id="email"
              label={t('signup.emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              autoComplete="email"
              error={emailError}
              helperText={emailError ? t('errors.invalidEmail') : ''}
            />
            {/* Password + confirmation */}
            <PasswordWithConfirmation
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmChange={setConfirmPassword}
              touched={pwdTouched}
              onBlur={() => setPwdTouched(true)}
            />

            {/* Terms checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {t('signup.agreeTOS')}{' '}
                  <Link href="/privacy-policy" target="_blank" underline="hover">
                    {t('signup.termsLink')}
                  </Link>
                </Typography>
              }
            />

            {/* ReCAPTCHA widget */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <ReCAPTCHA
                key={widgetKey}
                ref={captchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                size={isMobile ? 'compact' : 'normal'}
                theme={isDarkMode ? 'dark' : 'light'} 
                hl={lang}
                onChange={setCaptchaToken}
                onExpired={() => setCaptchaToken(null)}
                onErrored={() => setCaptchaToken(null)}
              />
            </Box>

            {/* Submit button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !captchaToken || !acceptTerms || !pwsMatch || !pwStrong || !isFirstnameValid || !isLastnameValid || !isEmailValid}
              sx={{ mt: 2 }}
              startIcon={
                loading
                  ? <CircularProgress color="inherit" size={16} />
                  : undefined
              }
            >
              {loading
                ? `${t('signup.signupButtonLoad')}…`
                : t('signup.signupButton')}
            </Button>

            {/* Hints for missing requirements */}
            {!loading && (!captchaToken || !acceptTerms) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1, textAlign: 'center' }}
              >
                {!captchaToken && t('signup.hintCaptchaRequired')}
                {!acceptTerms && t('signup.hintMustAgreeTOS')}
              </Typography>
            )}

            {/* Link to login */}
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {t('signup.alreadyHaveAccount')}{' '}
                <Link href="/login" underline="hover" variant="body2">
                  {t('signup.loginLink')}
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </PageWrapper>
    </>
  );
}
