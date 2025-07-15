import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuthStore } from "../../stores/useAuthStore";
import { isEmailValid } from '../../utils/validation';
import { useNavigate } from "react-router-dom";
import { updateUserEmail } from "../../services/userService";
import axios from "axios";
import { getErrorMessage } from "../../utils/errorUtils";
import AlertMessage from "../AlertMessage";
import { useLanguageStore } from "../../stores/useLanguageStore";

interface EmailSectionProps {
  currentEmail: string;
  onUpdate: (newEmail: string) => void;
}

/**
 * 
 * This component allows users to view and update their email address within an accordion panel.
 * It provides validation for the email format and ensures that the new email is different from the current one.
 * The component handles loading states, error messages, and success notifications.
 * It handles form state, validation, API submission, and displays success/error messages.
 * 
 */
export function EmailSection({ currentEmail, onUpdate }: EmailSectionProps): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);
  const navigate = useNavigate();
  const lang = useLanguageStore(state => state.lang);

  // Accordion open/closed state
  const [expanded, setExpanded] = useState<boolean>(false);
  // Email input state and touched flag for validation
  const [newEmail, setNewEmail] = useState<string>(currentEmail);
  const [newEmailTouched, setNewEmailTouched] = useState(false);
  // Loading and feedback messages
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Determine if current input is invalid (only after user has blurred the field)
  const emailError = newEmailTouched && !isEmailValid(newEmail);

  // Reset input and errors whenever the currentEmail prop changes
  useEffect(() => {
    setNewEmail(currentEmail);
    setNewEmailTouched(false);
    setErrorMsg(null);
  }, [currentEmail]);

  // Toggle accordion; if closing, clear messages and reset input
  const handleAccordionChange = () => {
    if (expanded) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setNewEmailTouched(false);
      setNewEmail(currentEmail);
    }
    setExpanded(prev => !prev);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate email format
    if (!isEmailValid(newEmail)) {
      setErrorMsg(t('errors.emailRequired'));
      return;
    }
    // Prevent updating to the same email
    if (newEmail === currentEmail) {
      setErrorMsg(t('errors.emailUnchanged'));
      return;
    }
    // Ensure user is authenticated
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      // Call API to update email
      const { status } = await updateUserEmail(token, newEmail, lang);

      if (status === 204 || status === 200) {
        onUpdate(newEmail);
        setSuccessMsg(t('dashboard.successMessageEmailUpdate'));
      } else {
        setErrorMsg(t('errors.emailUpdate'));
      }
    } catch (err: any) {
      // Handle axios errors with error codes or network failures
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
      {/* Header showing section title and current email */}
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: { xs: 1, sm: 0 } }}>
          <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1.2rem' } }}>
            {t('dashboard.email')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
            {currentEmail}
          </Typography>
        </Box>
      </AccordionSummary>

      {/* Details area with form */}
      <AccordionDetails>
        <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ width: '100%' }}>
          {/* Display error or success messages */}
          {errorMsg && <AlertMessage message={errorMsg} severity="error" />}
          {successMsg && <AlertMessage message={successMsg} severity="success" />}

          {/* Email input field */}
          <TextField
            required
            fullWidth
            id="email"
            label={t('dashboard.email')}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onBlur={() => setNewEmailTouched(true)}
            autoComplete="email"
            error={emailError}
            helperText={emailError ? t('errors.emailInvalid') : ''}
          />

          {/* Action buttons: Cancel and Save */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              onClick={() => { 
                setNewEmail(currentEmail); 
                setNewEmailTouched(false);
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
              disabled={loading || !isEmailValid(newEmail)}
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