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

interface Props {
  lang: string;
  user: User;
  onViewDetails: (id: number) => void;
  onSave: (id: number, updates: {
    is_active: boolean;
    twofa_enabled: boolean;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    verify_email: boolean;
  }) => Promise<boolean>;
  onRefresh: () => void;
  isEmployee: boolean;
}

export function AdminUserCard({ lang, user, onViewDetails, onSave, onRefresh, isEmployee }: Props) {
  const { t } = useTranslation('users');
  const { notify } = useCustomSnackbar();
  // états locaux pour les champs modifiables
  const [active, setActive] = useState(user.is_active);
  const [twofa, setTwofa] = useState(user.twofa_enabled);
  const [firstname, setFirstname] = useState(user.firstname);
  const [lastname, setLastname] = useState(user.lastname);
  const [email, setEmail] = useState(user.email);
  const role = isEmployee ? 'employee' : 'user'; 
  const [verifyEmail, setVerifyEmail] = useState(user.email_verified_at ? true : false);
  const [saving, setSaving] = useState(false);

  // calcul du statut "dirty" : vrai si au moins une valeur a changé
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

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(user.id, { is_active: active, twofa_enabled: twofa, firstname, lastname, email, role, verify_email: verifyEmail });
    setSaving(false);
    if (ok) {
      notify(isEmployee ? t('user.success_employee') : t('user.success'), 'success');
      onRefresh();
    } else {
      notify(t('errors.save_failed'), 'error');
    }
  };

  return (
    <Card sx={{ p:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('user.created_on', { date: formatDate(user.created_at, lang), time: formatTime(user.created_at, lang) })}
        </Typography>
        {user.updated_at && (
          <Typography variant="body2" color="text.secondary">
            {t('user.updated_on', { date: formatDate(user.updated_at, lang), time: formatTime(user.updated_at, lang) })}
          </Typography>
        )}
      </CardContent>

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
