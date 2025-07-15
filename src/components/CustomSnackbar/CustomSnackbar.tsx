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

/**
 * 
 * Custom Snackbar component that displays a message with a specific severity level.
 * It uses MUI's SnackbarContent for styling and includes a close button.
 * Wrap in forwardRef to pass ref through to the underlying SnackbarContent
 * 
 */
export const CustomSnackbar = React.forwardRef<HTMLDivElement, CustomSnackbarProps>(
  ({ message, severity, onClose }, ref) => {
    const theme = useTheme();
    const bgColor = theme.palette[severity].main;
    const textColor = theme.palette.getContrastText(bgColor);

    return (
      <SnackbarContent
        ref={ref}    // Forwarded ref
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderRadius: theme.shape.borderRadius,
        }}
        // Use Typography inside message prop for consistent text styling
        message={
          <Typography variant="body2" sx={{ color: textColor }}>
            {message}
          </Typography>
        }
        // Close action button on the right
        action={
          <IconButton size="small" onClick={onClose} sx={{ color: textColor }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    );
  }
);

// Set displayName for better DevTools identification
CustomSnackbar.displayName = 'CustomSnackbar';



