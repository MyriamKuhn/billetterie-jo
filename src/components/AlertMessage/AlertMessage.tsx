import Typography from '@mui/material/Typography';

interface AlertMessageProps {
  message: string;
  severity: 'error' | 'success';
}

export default function AlertMessage({ message, severity }: AlertMessageProps) {
  return (
    <Typography
      color={severity === 'error' ? 'error' : 'success.main'}
      variant="body2"
      sx={{ mb: 2, textAlign: 'center' }}
      role={severity === 'error' ? 'alert' : undefined}
    >
      {message}
    </Typography>
  );
}
