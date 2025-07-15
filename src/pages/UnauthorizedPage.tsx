import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';

/**
 * UnauthorizedPage component renders a page that informs the user
 * they do not have permission to access a certain resource.
 * It provides a button to navigate back to the home page.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('unauthorized');
  return (
    <>
      <Seo title={t('seoTitle')} description={t('seoDescription')} />
      <PageWrapper disableCard>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h4" gutterBottom>
            {t('access_denied')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('unauthorized')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            {t('go_home')}
          </Button>
        </Box>
      </PageWrapper>
    </>
  );
}
