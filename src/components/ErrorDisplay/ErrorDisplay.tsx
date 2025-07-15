import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import Seo from '../Seo';
import { useTranslation } from 'react-i18next';

interface ErrorDisplayProps {
  title: string;
  message: string;
  showRetry?: boolean;
  retryButtonText?: string;
  onRetry?: () => void;
  showHome?: boolean;
  homeButtonText?: string;
}

/**
 * 
 * A reusable component to show an error message with optional retry and home navigation buttons, including SEO tags.
 * 
 */
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
  const { t } = useTranslation();

  // Handler for retry button click
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };
  // Handler for home button click
  const handleHome = () => {
    navigate('/');
  };

  return (
    <>
      {/* Set SEO title and description for the error page */}
      <Seo title={t('errors.seoTitle')} description={t('errors.seoDescription')} />

      {/* Main error display container */}
      <Box sx={{ p: 4, textAlign: 'center' }}>
        {/* Error title */}
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>

        {/* Error message */}
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>

        {/* Optional Retry button */}
        {showRetry && (
          <Button variant="text" onClick={handleRetry}>
            {retryButtonText}
          </Button>
        )}

        {/* Optional Home button */}
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
    </>
  );
}
