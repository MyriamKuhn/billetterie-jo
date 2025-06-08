import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';

export default function VerificationResultPage() {
  const { status } = useParams<'status'>();
  const navigate = useNavigate();
  const { t } = useTranslation(['verification']);

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

  const ctx = config[status as keyof typeof config] || config.error;

  return (
    <>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <PageWrapper>
        <Box textAlign="center" mt={2}>
          <Typography variant="h4" gutterBottom>{ctx.title}</Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>{ctx.message}</Typography>
          <Button variant="contained" onClick={ctx.action.onClick}>
            {ctx.action.label}
          </Button>
        </Box>
      </PageWrapper>
    </>
  );
}
