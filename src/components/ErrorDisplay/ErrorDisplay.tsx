import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface ErrorDisplayProps {
  title: string;
  message: string;
  retryButtonText: string;
  onRetry: () => void;
  showHome?: boolean;
  homeButtonText?: string;
}

export function ErrorDisplay({
  title,
  message,
  retryButtonText,
  onRetry,
  showHome = true,
  homeButtonText,
}: ErrorDisplayProps) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {message}
      </Typography>
      <Button variant="text" onClick={onRetry}>
        {retryButtonText}
      </Button>
      {showHome && (
        <Button
          variant="contained"
          onClick={() => (window.location.href = '/')}
          sx={{ ml: 2 }}
        >
          {homeButtonText}
        </Button>
      )}
    </Box>
  );
}
