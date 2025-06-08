import { useState, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';

export interface PasswordWithConfirmationProps {
  password: string;
  onPasswordChange: (pw: string) => void;
  confirmPassword: string;
  onConfirmChange: (pw: string) => void;
  touched: boolean;
  onBlur: () => void;
}

export default function PasswordWithConfirmation({
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmChange,
  touched,
  onBlur,
}: PasswordWithConfirmationProps) {
  const { t } = useTranslation('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // critères de robustesse
  const criteria = useMemo(() => ({
    length: password.length >= 15,
    upper:  /[A-Z]/.test(password),
    lower:  /[a-z]/.test(password),
    number: /\d/.test(password),
    special:/[\W_]/.test(password),
  }), [password]);

  const pwStrong = Object.values(criteria).every(Boolean);
  const pwsMatch = password === confirmPassword;

  return (
    <Box>
      {/* Mot de passe */}
      <TextField
        required fullWidth
        type={showPassword ? 'text' : 'password'}
        label={t('signup.passwordLabel')}
        value={password}
        onChange={e => onPasswordChange(e.target.value)}
        onBlur={onBlur}
        error={touched && !pwStrong}
        helperText={
          touched && !pwStrong
            ? t('signup.hintPasswordCriteria')
            : ''
        }
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? t('signup.hidePassword') : t('signup.showPassword')}
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Checklist de critères */}
      <Box sx={{ pl: 1, mt: 1 }}>
        {Object.entries(criteria).map(([key, ok]) => (
          <Box
            key={key}
            sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
          >
            {ok
              ? <CheckCircleIcon fontSize="small" sx={{ color: 'success.main', mr: 1 }}/>
              : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.disabled', mr: 1 }}/>
            }
            <Typography variant="body2">
              {t(`passwordCriteria.${key}`)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Confirmation */}
      <TextField
        required fullWidth sx={{ mt: 2 }}
        type={showConfirm ? 'text' : 'password'}
        label={t('signup.confirmPasswordLabel')}
        value={confirmPassword}
        onChange={e => onConfirmChange(e.target.value)}
        onBlur={onBlur}
        error={touched && !pwsMatch}
        helperText={
          touched && !pwsMatch
            ? t('signup.hintPasswordsDontMatch')
            : ''
        }
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showConfirm ? t('signup.hidePassword') : t('signup.showPassword')}
                  onClick={() => setShowConfirm(!showConfirm)}
                  edge="end"
                >
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
);
}
