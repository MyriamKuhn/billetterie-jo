import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';

/**
 * ContactPage component displays contact information for the JO 2024 ticketing service.
 * It includes email, phone, address, and hours of operation.
 * The content is localized using react-i18next.
 */
export default function ContactPage() {
  const { t } = useTranslation('contact');

  return (
    <>
      {/* SEO metadata */}
      <Seo title={t('contact.seoTitle')} description={t('contact.seoDescription')} />
      {/* Page container */}
      <PageWrapper>
        {/* Page heading */}
        <Typography variant="h4" gutterBottom>
          {t('contact.title')}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {/* Intro text */}
          <Typography variant="body1">
            {t('contact.intro')}
          </Typography>

          {/* Contact details list */}
          <Stack spacing={4}>
            {/* Email */}
            <Box>
              <Typography variant="h6">{t('contact.emailLabel')}</Typography>
              <Link href="mailto:contact@jo2024-ticketing.com">
                contact@jo2024-ticketing.com
              </Link>
            </Box>

            {/* Phone */}
            <Box>
              <Typography variant="h6">{t('contact.phoneLabel')}</Typography>
              <Link href="tel:+33123456789">+33 1 23 45 67 89</Link>
            </Box>

            {/* Address and hours */}
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

          {/* Additional note */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
            {t('contact.note')}
          </Typography>
        </Box>
      </PageWrapper>
    </ >
  );
}

