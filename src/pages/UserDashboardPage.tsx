import { useState, useEffect, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import { PageWrapper } from '../components/PageWrapper';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { fetchUser } from '../services/userService';
import { useAuthStore } from '../stores/useAuthStore';
import { getErrorMessage } from '../utils/errorUtils';
import OlympicLoader from './../components/OlympicLoader';
import { Navigate } from 'react-router-dom';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { NameSection } from '../components/NameSection';

export interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  twoFAEnabled: boolean;
}

export default function UserDashboardPage(): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);

  // États initiaux: charger les données utilisateur existantes
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      setLoadingUser(true);
      setErrorMsg(null);
      try {
        if (!token) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }
        const response = await fetchUser(token);
        const { status, data } = response;
        if (status === 200 && data.user) {
          if (isMounted) {
            setUser({
              firstname: data.user.firstname,
              lastname: data.user.lastname,
              email: data.user.email,
              twoFAEnabled: data.user.twofa_enabled,
            });
          }
        } else {
          if (isMounted) {
            setErrorMsg(t('errors.fetchProfile'));
          }
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
        const { data } = err.response;
        if (data.code) {
            if (isMounted) setErrorMsg(getErrorMessage(t, data.code));
          } else {
            if (isMounted) setErrorMsg(getErrorMessage(t, 'generic_error'));
          }
        } else {
          if (isMounted) setErrorMsg(getErrorMessage(t, 'network_error'));
        }
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }
    loadUser()
    return () => {
      isMounted = false;
    };
  }, [token, t]);

  if (loadingUser) {
    return (
      <PageWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <OlympicLoader />
        </Box>
      </PageWrapper>
    );
  }

  if (errorMsg) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.genericErrorTitle')}
          message={errorMsg}
          showRetry={true}
          retryButtonText={t('errors.retry')}
          onRetry={() => {
            window.location.reload();
          }}
          showHome={true}
          homeButtonText={t('errors.home')}
        />
      </PageWrapper>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
            {t('dashboard.subtitle')}
          </Typography>
          <Stack spacing={2}>
            <NameSection user={user} onUpdate={(vals) => setUser((prev) => prev ? ({ ...prev, ...vals }) : prev)} />
            <EmailSection currentEmail={user.email} onUpdate={(newEmail) => setUser((prev) => prev ? ({ ...prev, email: newEmail }) : prev)} />
            <PasswordSection />
            <TwoFASection enabled={user.twoFAEnabled} onToggle={(enabled) => setUser((prev) => prev ? ({ ...prev, twoFAEnabled: enabled }) : prev)} />
          </Stack>
        </Box>
      </PageWrapper>
    </>
  );
}

interface EmailSectionProps {
  currentEmail: string;
  onUpdate: (newEmail: string) => void;
}

function EmailSection({ currentEmail, onUpdate }: EmailSectionProps): JSX.Element {
  const { t } = useTranslation('account');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>(currentEmail);
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (newEmail === currentEmail) {
      setError(t('errors.sameEmail'));
      return;
    }
    const emailPattern = /.+@.+\..+/;
    if (!emailPattern.test(newEmail)) {
      setError(t('errors.invalidEmail'));
      return;
    }
    if (!password) {
      setError(t('errors.currentPasswordRequired'));
      return;
    }
    setLoading(true);
    try {
      await axios.put('/api/user/profile/email', { email: newEmail, currentPassword: password });
      setSuccess(t('success.emailChangeInitiated'));
      onUpdate(newEmail);
      setExpanded(false);
    } catch (err) {
      console.error(err);
      setError(t('errors.updateEmail'));
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography>{t('sections.email')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {currentEmail}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
          <TextField
            label={t('fields.newEmail')}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            type="email"
          />
          <TextField
            label={t('fields.currentPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            type="password"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => { setExpanded(false); setNewEmail(currentEmail); setPassword(''); }} disabled={loading}>
              {t('buttons.cancel')}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
              {t('buttons.save')}
            </Button>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function PasswordSection(): JSX.Element {
  const { t } = useTranslation('account');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validatePassword = (): boolean => {
    // exemple basique: longueur minimale
    return newPassword.length >= 8;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('errors.passwordFieldsRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('errors.passwordsDontMatch'));
      return;
    }
    if (!validatePassword()) {
      setError(t('errors.passwordNotStrong'));
      return;
    }
    setLoading(true);
    try {
      await axios.put('/api/user/profile/password', { currentPassword, newPassword });
      setSuccess(t('success.passwordUpdated'));
      setExpanded(false);
    } catch (err) {
      console.error(err);
      setError(t('errors.updatePassword'));
    } finally {
      setLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Typography>{t('sections.password')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
          <TextField
            label={t('fields.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            type="password"
          />
          <TextField
            label={t('fields.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            type="password"
          />
          <TextField
            label={t('fields.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            type="password"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => { setExpanded(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} disabled={loading}>
              {t('buttons.cancel')}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
              {t('buttons.save')}
            </Button>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

interface TwoFASectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function TwoFASection({ enabled, onToggle }: TwoFASectionProps): JSX.Element {
  const { t } = useTranslation('account');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>('');

  const handleToggle = async () => {
    setError(null);
    setSuccess(null);
    if (!enabled) {
      // Activer: démarrer le flow: obtenir le QR code
      setLoading(true);
      try {
        const resp = await axios.post('/api/user/2fa/setup');
        setQrCodeUrl(resp.data.qrCodeUrl);
        setDialogOpen(true);
      } catch (err) {
        console.error(err);
        setError(t('errors.2faSetup'));
      } finally {
        setLoading(false);
      }
    } else {
      // Désactiver: demander OTP pour confirmer
      setDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!enabled) {
        // Soumettre OTP pour activer
        await axios.post('/api/user/2fa/enable', { otp: otpCode });
        onToggle(true);
        setSuccess(t('success.2faEnabled'));
      } else {
        // Soumettre OTP pour désactiver
        await axios.post('/api/user/2fa/disable', { otp: otpCode });
        onToggle(false);
        setSuccess(t('success.2faDisabled'));
      }
      setDialogOpen(false);
      setOtpCode('');
      setQrCodeUrl(null);
      setExpanded(false);
    } catch (err) {
      console.error(err);
      setError(t('errors.2faConfirm'));
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setOtpCode('');
    setQrCodeUrl(null);
  };

  return (
    <>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Typography>{t('sections.twoFA')}</Typography>
            <FormControlLabel
              control={
                <Switch checked={enabled} onChange={handleToggle} disabled={loading} />
              }
              label={enabled ? t('enabled') : t('disabled')}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
          <Typography variant="body2">
            {enabled ? t('info.2faEnabled') : t('info.2faDisabled')}
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {enabled ? t('dialog.disable2faTitle') : t('dialog.enable2faTitle')}
        </DialogTitle>
        <DialogContent>
          {!enabled && qrCodeUrl && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" gutterBottom>{t('dialog.scanQRCode')}</Typography>
              <Box component="img" src={qrCodeUrl} alt="QR Code" sx={{ mx: 'auto', width: 200, height: 200 }} />
            </Box>
          )}
          <TextField
            label={t('fields.otpCode')}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            fullWidth
            type="text"
          />
          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>{t('buttons.cancel')}
          </Button>
          <Button variant="contained" onClick={handleConfirm} disabled={loading || !otpCode} startIcon={loading ? <CircularProgress size={16} /> : null}>
            {t('buttons.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
