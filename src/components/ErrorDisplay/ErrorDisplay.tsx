import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

interface ErrorDisplayProps {
  title: string;
  message: string;
  showRetry?: boolean;
  retryButtonText?: string;
  onRetry?: () => void;
  showHome?: boolean;
  homeButtonText?: string;
}

export function ErrorDisplay({
  title,
  message,
  showRetry = true,
  retryButtonText,
  onRetry,
  showHome = true,
  homeButtonText,
}: ErrorDisplayProps) {
  const navigate = useNavigate();

  // Handlers
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };
  const handleHome = () => {
    navigate('/');
  };

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {showRetry && (
        <Button variant="text" onClick={handleRetry}>
          {retryButtonText}
        </Button>
      )}
      {showHome && (
        <Button
          variant="contained"
          onClick={handleHome}
          sx={{ ml: 2 }}
        >
          {homeButtonText}
        </Button>
      )}
    </Box>
  );
}
