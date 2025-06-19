import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

interface AlertMessageProps {
  message: string;
  severity: 'error' | 'success' | 'info';
}

export default function AlertMessage({ message, severity }: AlertMessageProps) {
  const theme = useTheme();
  let colorValue: string;
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
