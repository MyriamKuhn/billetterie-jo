import { useTranslation } from "react-i18next";
import type { UserProfile } from "../../pages/UserDashboardPage";
import { useEffect, useState, type JSX } from "react";
import axios from "axios";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { updateUserProfile } from "../../services/userService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/errorUtils";
import AlertMessage from "../AlertMessage";

interface NameSectionProps {
  user: UserProfile;
  onUpdate: (vals: Partial<UserProfile>) => void;
}

/**
 * Renders an accordion section for viewing and updating the user's name (first + last), with validation, API call, and inline success/error messages.
 */
export function NameSection({ user, onUpdate }: NameSectionProps): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);
  const navigate = useNavigate();
  
  // Accordion open/closed state
  const [expanded, setExpanded] = useState<boolean>(false);
  // Form fields and touched flags for validation
  const [firstname, setFirstname] = useState<string>(user.firstname);
  const [lastname, setLastname] = useState<string>(user.lastname);
  const [firstnameTouched, setFirstnameTouched] = useState(false);
  const [lastnameTouched, setLastnameTouched]   = useState(false);
  // Loading and feedback message state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation flags
  const firstnameError = firstnameTouched && firstname.trim() === '';
  const lastnameError  = lastnameTouched  && lastname.trim() === '';
  const isFirstnameValid = firstname.trim() !== '';
  const isLastnameValid = lastname.trim()  !== '';

  // Reset fields when `user` prop changes
  useEffect(() => {
    setFirstname(user.firstname);
    setLastname(user.lastname);
    setFirstnameTouched(false);
    setLastnameTouched(false);
    setErrorMsg(null);
  }, [user.firstname, user.lastname]);

  // Toggle accordion and reset on collapse
  const handleAccordionChange = () => {
    if (expanded) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setFirstnameTouched(false);
      setLastnameTouched(false);
      setFirstname(user.firstname);
      setLastname(user.lastname);
    }
    setExpanded(prev => !prev);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate fields
    if (!isFirstnameValid || !isLastnameValid) {
      setErrorMsg(t('errors.nameRequired'));
      return;
    }
    // Ensure user is logged in
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      // Call API to update name
      const { status } = await updateUserProfile(token, { firstname, lastname });

      if (status === 204 || status === 200) {
        onUpdate({ firstname, lastname });  // Notify parent of change
        setSuccessMsg(t('dashboard.successMessageProfileUpdate'));
      } else {
        setErrorMsg(t('errors.nameUpdate'));
      }
    } catch (err: any) {
      // Handle axios errors with code mapping or network fallback
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
      {/* Header showing label and current name */}
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: { xs: 1, sm: 0 } }}>
          <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1.2rem' } }}>
            {t('dashboard.name')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
            {user.firstname} {user.lastname}
          </Typography>
        </Box>
      </AccordionSummary>

      {/* Expandable form */}
      <AccordionDetails>
        <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ width: '100%' }}>
          {/* Inline error or success alerts */}
          {errorMsg && <AlertMessage message={errorMsg} severity="error" />}
          {successMsg && <AlertMessage message={successMsg} severity="success" />}

          {/* Last name field */}
          <TextField
            required
            fullWidth
            id="lastname"
            label={t('dashboard.lastname')}
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            onBlur={() => setLastnameTouched(true)}
            autoComplete="family-name"
            error={lastnameError}
            helperText={lastnameError ? t('errors.lastnameRequired') : ''}
          />
          {/* First name field */}
          <TextField
            required
            fullWidth
            id="firstname"
            label={t('dashboard.firstname')}
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            onBlur={() => setFirstnameTouched(true)}
            autoComplete="given-name"
            error={firstnameError}
            helperText={firstnameError ? t('errors.firstnameRequired') : ''}
          />
          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {/* Cancel resets fields and messages */}
            <Button 
              onClick={() => { 
                setFirstname(user.firstname); 
                setLastname(user.lastname);
                setFirstnameTouched(false);
                setLastnameTouched(false);
                setErrorMsg(null);
                setSuccessMsg(null); 
              }} 
              disabled={loading}
            >
              {t('dashboard.cancel')}
            </Button>
            {/* Save submits the form */}
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isFirstnameValid || !isLastnameValid}
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