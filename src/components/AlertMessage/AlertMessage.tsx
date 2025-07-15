import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// Properties for the AlertMessage component
interface AlertMessageProps {
  message: string;
  severity: 'error' | 'success' | 'info';
}

/**
 * AlertMessage component displays a message with a specific severity level.
 * It uses MUI's Typography for styling and theming.
 *
 * @param {AlertMessageProps} props - The properties for the AlertMessage component.
 * @returns {JSX.Element} The rendered AlertMessage component.
 */
export default function AlertMessage({ message, severity }: AlertMessageProps) {
  const theme = useTheme();
  let colorValue: string;

  // Choose color based on severity
  switch (severity) {
    case 'error':
      colorValue = theme.palette.error.main;
      break;
    case 'success':
      colorValue = theme.palette.success.main;
      break;
    case 'info':
      colorValue = theme.palette.info.main;
      break;
    default:
      colorValue = theme.palette.text.primary;
      break;
  }

  // Use ARIA role 'alert' for errors, 'status' for others
  const roleValue = severity === 'error' ? 'alert' : 'status';

  return (
    <Typography
      variant="body2"
      sx={{ mb: 2, textAlign: 'center', color: colorValue }}
      role={roleValue}
    >
      {message}
    </Typography>
  );
}
