import axios from "axios";
import { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuthStore } from "../../stores/useAuthStore";
import { isStrongPassword } from "../../utils/validation";
import PasswordWithConfirmation from "../PasswordWithConfirmation";
import { useNavigate } from "react-router-dom";
import { updateUserPassword } from "../../services/userService";
import { getErrorMessage } from "../../utils/errorUtils";
import AlertMessage from "../AlertMessage";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";

export function PasswordSection(): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);
  const navigate = useNavigate();
  
  const [expanded, setExpanded] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [currentPwdTouched, setCurrentPwdTouched] = useState(false);
  const [newPwdTouched, setNewPwdTouched] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentPasswordError = currentPwdTouched && !currentPassword.trim();
  const pwStrong = isStrongPassword(newPassword);
  const pwsMatch = newPassword === confirmPassword;

  const handleAccordionChange = () => {
    if (expanded) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setCurrentPwdTouched(false);
      setNewPwdTouched(false);
    }
    setExpanded(prev => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (currentPasswordError) {
      setErrorMsg(t('errors.currentPasswordRequired'));
      return;
    }

    if (!pwStrong) {
      setErrorMsg(t('errors.passwordNotStrong')); 
      return;
    }

    if (!pwsMatch) {
      setErrorMsg(t('errors.passwordsDontMatch'));
      return;
    }
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);

    try {
      const { status } = await updateUserPassword(token, currentPassword, newPassword, confirmPassword);

      if (status === 200) {
        setSuccessMsg(t('dashboard.successMessagePasswordUpdate'));
      } else {
        setErrorMsg(t('errors.passwordUpdate'));
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { data } = err.response;
        if (data.code) {
          setErrorMsg(getErrorMessage(t, data.code));
        } else {
          setErrorMsg(getErrorMessage(t, 'generic_error'));
        }
      } else {
        setErrorMsg(getErrorMessage(t, 'network_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Accordion expanded={expanded} onChange={handleAccordionChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: { xs: 1, sm: 0 } }}>
          <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1.2rem' } }}>
            {t('dashboard.password')}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ width: '100%' }}>
          {errorMsg && <AlertMessage message={errorMsg} severity="error" />}
          {successMsg && <AlertMessage message={successMsg} severity="success" />}
          <TextField
            required
            fullWidth
            id="password"
            label={t('dashboard.currentPassword')}
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onBlur={() => setCurrentPwdTouched(true)}
            autoComplete="password"
            error={currentPasswordError}
            helperText={currentPasswordError ? t('errors.passwordInvalid') : ''}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showCurrent ? t('dashboard.hidePassword') : t('dashboard.showPassword')}
                      onClick={() => setShowCurrent(!showCurrent)}
                      edge="end"
                    >
                      {showCurrent ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <PasswordWithConfirmation
            password={newPassword}
            onPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmChange={setConfirmPassword}
            touched={newPwdTouched}
            onBlur={() => setNewPwdTouched(true)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              onClick={() => { 
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setCurrentPwdTouched(false);
                setNewPwdTouched(false);
                setErrorMsg(null);
                setSuccessMsg(null); 
              }} 
              disabled={loading}
            >
              {t('dashboard.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !pwStrong || !pwsMatch || currentPasswordError}
              startIcon={
                loading
                  ? <CircularProgress color="inherit" size={16} />
                  : undefined
              }
            >
              {loading
                ? `${t('dashboard.saveLoad')}…`
                : t('dashboard.save')}
            </Button>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}