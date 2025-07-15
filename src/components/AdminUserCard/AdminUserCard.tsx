import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { User } from '../../types/user';
import { useTranslation } from 'react-i18next';
import { formatDate, formatTime } from '../../utils/format';
import { useMemo, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// Props received by the component
interface Props {
  lang: string; // Current language code for formatting and translations
  user: User; // User object with fields like id, firstname, etc.
  onViewDetails: (id: number) => void;  // Callback to view full details of the user
  onSave: (id: number, updates: {
    is_active: boolean;
    twofa_enabled: boolean;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    verify_email: boolean;
  }) => Promise<boolean>; // Callback to save changes, returns success flag
  onRefresh: () => void;  // Callback to refresh the list after saving
  isEmployee: boolean;  // Flag to distinguish employee vs regular user
}

/**
 * AdminUserCard component displays user details and allows editing.
 * It shows user status, allows editing of personal information,
 * and provides options to toggle active status, two-factor authentication, and email verification.
 * It also includes buttons to view details and save changes.
 * @param {Props} props - The properties for the component.
 * @return {JSX.Element} The rendered component.
 */
export function AdminUserCard({ lang, user, onViewDetails, onSave, onRefresh, isEmployee }: Props) {
  const { t } = useTranslation('users');
  const { notify } = useCustomSnackbar();
  // Local state for editable fields, initialized from the user prop
  const [active, setActive] = useState(user.is_active);
  const [twofa, setTwofa] = useState(user.twofa_enabled);
  const [firstname, setFirstname] = useState(user.firstname);
  const [lastname, setLastname] = useState(user.lastname);
  const [email, setEmail] = useState(user.email);
  const role = isEmployee ? 'employee' : 'user';  // Determine role string based on flag
  const [verifyEmail, setVerifyEmail] = useState(user.email_verified_at ? true : false);
  const [saving, setSaving] = useState(false);  // Indicates if a save operation is in progress

  // Compute whether any field has changed ("dirty" state)
  const isDirty = useMemo(() => {
    return (
      active !== user.is_active ||
      twofa !== user.twofa_enabled ||
      firstname !== user.firstname ||
      lastname !== user.lastname ||
      email !== user.email ||
      verifyEmail !== Boolean(user.email_verified_at)
    );
  }, [active, twofa, firstname, lastname, email, verifyEmail, user]);

  // Handler for saving changes
  const handleSave = async () => {
    setSaving(true);  // Show loading spinner
    const ok = await onSave(user.id, { is_active: active, twofa_enabled: twofa, firstname, lastname, email, role, verify_email: verifyEmail });
    setSaving(false);
    if (ok) {
      // Show success message then refresh list
      notify(isEmployee ? t('user.success_employee') : t('user.success'), 'success');
      onRefresh();
    } else {
      // Show error if save failed
      notify(t('errors.save_failed'), 'error');
    }
  };

  return (
    <Card sx={{ p:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header with title and status chips */}
      <CardContent>
        <Typography variant="h6">{isEmployee ? t('user.title_employee', { id: user.id }) : t('user.title', { id: user.id })}</Typography>
        <Chip
          label={active ? t('user.active') : t('user.inactive')}
          color={active ? 'success' : 'default'}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
        <Chip
          label={twofa ? t('user.twofa_enabled') : t('user.twofa_disabled')}
          color={twofa ? 'info' : 'default'}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
        <Chip
          label={verifyEmail ? t('user.email_verified') : t('user.email_not_verified')}
          color={verifyEmail ? 'primary' : 'default'}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
        {/* Display creation and last update timestamps */}
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('user.created_on', { date: formatDate(user.created_at, lang), time: formatTime(user.created_at, lang) })}
        </Typography>
        {user.updated_at && (
          <Typography variant="body2" color="text.secondary">
            {t('user.updated_on', { date: formatDate(user.updated_at, lang), time: formatTime(user.updated_at, lang) })}
          </Typography>
        )}
      </CardContent>
      
      {/* Editable text fields for first name, last name, email */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', px:2 }}>
        <TextField
          label={t('user.firstname')}
          type="text"
          value={firstname}
          onChange={e => setFirstname(e.target.value)}
          size="small"
        />
        <TextField
          label={t('user.lastname')}
          type="text"
          value={lastname}
          onChange={e => setLastname(e.target.value)}
          size="small"
        />
        <TextField
          label={t('user.email')}
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          size="small"
        />
      </Box>

      {/* Toggles for active, two-factor auth, and email verification */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, px:2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={active}
              onChange={e => setActive(e.target.checked)}
              size="small"
            />
          }
          label={t('user.toggle_active')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!twofa ? false : twofa}
              onChange={e => setTwofa(e.target.checked)}
              disabled={!twofa}
              size="small"
            />
          }
          label={t('user.toggle_twofa')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={verifyEmail}
              onChange={e => setVerifyEmail(e.target.checked)}
              disabled={verifyEmail}
              size="small"
            />
          }
          label={t('user.toggle_verify_email')}
        />
      </Box>

      {/* Action buttons: view details and save changes */}
      <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: { xs: 'column', md: 'row'}, gap: 1, mt: 2 }}>
        <Button size="small" variant="outlined" onClick={() => onViewDetails(user.id)}>
          {t('user.see_details')}
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={saving || !isDirty}
          onClick={handleSave}
          startIcon={
            saving
              ? <CircularProgress color="inherit" size={16} />
              : undefined
          }
        >
          {saving ? t('user.saving') : t('user.save')}
        </Button>
      </Box>
    </Card>
  );
}
