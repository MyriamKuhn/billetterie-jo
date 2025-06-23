import React from 'react';
import SnackbarContent from '@mui/material/SnackbarContent';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

export interface CustomSnackbarProps {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
}

// On enveloppe dans forwardRef pour passer le ref à SnackbarContent
export const CustomSnackbar = React.forwardRef<HTMLDivElement, CustomSnackbarProps>(
  ({ message, severity, onClose }, ref) => {
    const theme = useTheme();
    const bgColor = theme.palette[severity].main;
    const textColor = theme.palette.getContrastText(bgColor);

    return (
      <SnackbarContent
        ref={ref}                           
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderRadius: theme.shape.borderRadius,
        }}
        message={
          <Typography variant="body2" sx={{ color: textColor }}>
            {message}
          </Typography>
        }
        action={
          <IconButton size="small" onClick={onClose} sx={{ color: textColor }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    );
  }
);

// Pour le displayName dans les devtools
CustomSnackbar.displayName = 'CustomSnackbar';



