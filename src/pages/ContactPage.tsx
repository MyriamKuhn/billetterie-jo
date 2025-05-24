import { Box, Link, Stack, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/PageWrapper';

export default function ContactPage() {
  const { t } = useTranslation('contact');

  return (
    <PageWrapper>
      <Typography variant="h4" gutterBottom>
        {t('contact.title')}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          {t('contact.intro')}
        </Typography>

        <Stack spacing={4}>
          <Box>
            <Typography variant="h6">{t('contact.emailLabel')}</Typography>
            <Link href="mailto:contact@jo2024-ticketing.com">
              contact@jo2024-ticketing.com
            </Link>
          </Box>

          <Box>
            <Typography variant="h6">{t('contact.phoneLabel')}</Typography>
            <Link href="tel:+33123456789">+33 1 23 45 67 89</Link>
          </Box>

          <Box>
            <Typography variant="h6">{t('contact.addressLabel')}</Typography>
            <Typography>
              10 rue des Jeux<br />
              75015 Paris<br />
              France
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">{t('contact.hoursLabel')}</Typography>
            <Typography>
              {t('contact.hours')}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          <Trans i18nKey="contact.note">
            Cette page est purement informative. Aucune prise de rendez-vous ou de support direct n’est effectuée ici.
          </Trans>
        </Typography>
      </Box>
    </PageWrapper>
  );
}

