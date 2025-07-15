import { useState, useMemo, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { useCreateEmployee } from '../../hooks/useCreateEmployee';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PasswordWithConfirmation from '../PasswordWithConfirmation';

interface Props {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface EmployeeFormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Modal for creating a new employee.
 *
 * Resets its form state when opened, validates inputs, and
 * calls the `createEmployee` hook to submit new user data.
 */
export function AdminEmployeeCreateModal({ open, onClose, onRefresh }: Props) {
  const { t } = useTranslation('users');
  const { notify } = useCustomSnackbar();
  const createEmployee = useCreateEmployee();
  const [saving, setSaving] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Initial form values (memoized so it's stable across renders)
  const initialValues = useMemo<EmployeeFormData>(() => ({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    password_confirmation: ''
  }), []);

  const [formData, setFormData] = useState<EmployeeFormData>(initialValues);

  /**
   * Reset form and touched flags whenever modal is (re)opened.
   */
  useEffect(() => {
    if (open) {
      setFormData(initialValues);
      setPwdTouched(false);
      setEmailTouched(false);
    }
  }, [open, initialValues]);

  /**
   * Validate email format against a simple regex.
   *
   * @returns {boolean} true if `formData.email` matches the pattern.
   */
  const emailValid = useMemo(() => {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(formData.email);
  }, [formData.email]);

  /**
   * Check that all fields are non-empty, email is valid,
   * and password matches confirmation.
   *
   * @returns {boolean} true if the form is ready to submit.
   */
  const allFilled = useMemo(() => {
    return (
      formData.firstname.trim() !== '' &&
      formData.lastname.trim()  !== '' &&
      formData.email.trim()     !== '' &&
      emailValid &&
      formData.password !== '' &&
      formData.password === formData.password_confirmation
    );
  }, [formData, emailValid]);

  /**
   * Handle the Create button click:
   * 1. Show spinner
   * 2. Call createEmployee hook
   * 3. Notify success or error
   * 4. Refresh list and close on success
   */
  const handleSubmit = async () => {
    setSaving(true);
    const body = {
      firstname: formData.firstname,
      lastname:  formData.lastname,
      email:     formData.email,
      password:  formData.password,
      password_confirmation: formData.password_confirmation
    };

    // Await API call result
    const ok = await createEmployee(body);
    setSaving(false);
    if (ok) {
      notify(t('employee.success'), 'success');
      onRefresh();
      onClose();
    } else {
      notify(t('errors.creation_failed'), 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('employee.create_new')}</DialogTitle>

      <DialogContent dividers>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('user.lastname')}
            value={formData.lastname}
            onChange={e => setFormData(fd => ({ ...fd, lastname: e.target.value }))}
            fullWidth
          />
          <TextField
            label={t('user.firstname')}
            value={formData.firstname}
            onChange={e => setFormData(fd => ({ ...fd, firstname: e.target.value }))}
            fullWidth
          />
          <TextField
            label={t('user.email')}
            type="email"
            value={formData.email}
            onChange={e => setFormData(fd => ({ ...fd, email: e.target.value }))}
            onBlur={() => setEmailTouched(true)}
            error={emailTouched && !emailValid}
            helperText={emailTouched && !emailValid ? t('employee.invalid_email') : ''}
            fullWidth
          />
          {/* Password inputs with confirmation and inline mismatch indicator */}
          <PasswordWithConfirmation
            password={formData.password}
            onPasswordChange={pw => setFormData(fd => ({ ...fd, password: pw }))}
            confirmPassword={formData.password_confirmation}
            onConfirmChange={pw => setFormData(fd => ({ ...fd, password_confirmation: pw }))}
            touched={pwdTouched}
            onBlur={() => setPwdTouched(true)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{t('user.close')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!allFilled || saving}
          startIcon={saving ? <CircularProgress size={16}/> : undefined}
        >
          {saving ? t('employee.creation') : t('employee.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
