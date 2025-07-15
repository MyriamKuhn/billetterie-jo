import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import OlympicLoader from '../OlympicLoader';
import { ErrorDisplay } from '../ErrorDisplay';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { User } from '../../types/user';
import Typography from '@mui/material/Typography';
import { formatDate, formatTime } from '../../utils/format';
import { API_BASE_URL } from '../../config';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { logError } from '../../utils/logger';

// Shape of a pending email-change request
interface PendingEmail {
  old_email: string;
  new_email: string;
  created_at: string;
  updated_at: string;
}

// Props accepted by the AdminUserDetailsModal component
interface Props {
  lang: string;
  open: boolean;
  userId: number | null;
  token: string;
  onClose: () => void;
  isEmployee: boolean;
}

/**
 * AdminUserDetailsModal component displays detailed information about a user.
 * It fetches user details and any pending email changes, showing them in a modal dialog.
 * @param {Props} props - The properties for the component.
 * @return {JSX.Element} The rendered component.
 */
export function AdminUserDetailsModal({ lang, open, userId, token, onClose, isEmployee }: Props) {
  const { t } = useTranslation('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<PendingEmail | null>(null);

  // Fetch user details and any pending email-change when modal opens
  useEffect(() => {
    // Only run when modal is open and a userId is provided
    if (!open || userId === null) return;
    setLoading(true);
    setError(null);

    const headers = { Authorization: `Bearer ${token}` };

    // Execute both API calls in parallel
    Promise.all([
      axios.get(`${API_BASE_URL}/api/users/${userId}`, { headers }),
      axios.get(`${API_BASE_URL}/api/users/email/${userId}`, { headers })
    ])
    .then(([userRes, pendingRes]) => {
      setUser(userRes.data.user as User); // Set the user object from the first response
      setPendingEmail(pendingRes.data.data as PendingEmail);  // Set pending email data from the second response
    })
    .catch(err => {
      logError('AdminUserDetailsModal', err); // Log the error for debugging
      // Set an appropriate error message based on user type
      setError(isEmployee ? t('errors.not_found_employee') : t('errors.not_found'));
    })
    .finally(() => setLoading(false));  // Hide loading spinner
  }, [open, userId, token, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Modal title */}
      <DialogTitle sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          {isEmployee ? t('user.details_title_employee', { id: userId }) : t('user.details_title', { id: userId })}
        </Typography>
      </DialogTitle>

      {/* Loading state: show spinner */}
      {loading && <Box textAlign="center" py={4}><OlympicLoader/></Box>}
      {/* Error state: show error display */}
      {error && <ErrorDisplay title={t('errors.title')} message={isEmployee ? t('errors.error_employee') : t('errors.error_user')} />}

      {/* Success state: show user details */}
      {!loading && !error && user && (
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 2 }}>
            {/* Display user's full name */}
            <Typography variant="subtitle1"><strong>{t('user.name')}</strong> {user.firstname} {user.lastname}</Typography>
            <Typography variant="subtitle1"><strong>{t('user.details_email')}</strong> {user.email}</Typography>

            {/* Show pending email-change details if present */}
            {pendingEmail ? (
              <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">{t('user.pending_email_change')}</Typography>
                <Typography variant="body2">{t('user.old_email')}: {pendingEmail.old_email}</Typography>
                <Typography variant="body2">{t('user.new_email')}: {pendingEmail.new_email}</Typography>
                <Typography variant="body2">
                  {t('user.requested_on', { date: formatDate(pendingEmail.created_at, lang), time: formatTime(pendingEmail.created_at, lang) })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('user.updated_on', { date: formatDate(pendingEmail.updated_at, lang), time: formatTime(pendingEmail.updated_at, lang) })}
                </Typography>
              </Box>
            ) : (
              // No pending email change
              <Typography variant="body2" sx={{ mt: 2, p: 2 }}>
                {t('user.no_pending_email')}
              </Typography>
            )}
          </Box>
        </DialogContent>
      )}
      {/* Modal action: Close button */}
      <DialogActions>
        <Button onClick={onClose} size="small">
          {t('user.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
