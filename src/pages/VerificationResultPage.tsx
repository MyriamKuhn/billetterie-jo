import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';

/**
 * VerificationResultPage component displays the result of a verification process.
 * It shows different messages based on the verification status passed in the URL.
 * It provides a button to navigate to the login page or home page based on the status.
 */
export default function VerificationResultPage() {
  const { status } = useParams<'status'>(); // URL param: verification status
  const navigate = useNavigate();
  const { t } = useTranslation(['verification']);

  // Define title, message, and button action per status
  const config = {
    success: {
      title: t('success.title'),
      message: t('success.message'),
      action: {
        label: t('loginLink'),
        onClick: () => navigate('/login'),
      }
    },
    invalid: {
      title: t('invalid.title'),
      message: t('invalid.message'),
      action: {
        label: t('loginLink'),
        onClick: () => navigate('/login'),
      }
    },
    'already-verified': {
      title: t('alreadyVerified.title'),
      message: t('alreadyVerified.message'),
      action: {
        label: t('loginLink'),
        onClick: () => navigate('/login'),
      }
    },
    error: {
      title: t('verification:error.title'),
      message: t('verification:error.message'),
      action: {
        label: t('homeButton'),
        onClick: () => navigate('/'),
      }
    }
  };

  // Fallback to error config if status is unrecognized
  const ctx = config[status as keyof typeof config] || config.error;

  return (
    <>
      {/* SEO metadata */}
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper>
        {/* Centered content */}
        <Box textAlign="center" mt={2}>
          {/* Title */}
          <Typography variant="h4" gutterBottom>{ctx.title}</Typography>
          {/* Message */}
          <Typography variant="body1" sx={{ mb: 4 }}>{ctx.message}</Typography>
          {/* Action button */}
          <Button variant="contained" onClick={ctx.action.onClick}>
            {ctx.action.label}
          </Button>
        </Box>
      </PageWrapper>
    </>
  );
}
