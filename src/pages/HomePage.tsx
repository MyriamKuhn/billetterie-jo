import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';

import heroImg from '../assets/home/jo-hero.jpg';
import openingImg from '../assets/home/opening.jpg';
import athleticsImg from '../assets/home/athletics.webp';
import swimmingImg from '../assets/home/swimming.webp';
import judoImg from '../assets/home/judo.jpg';

interface Event {
  id: number;
  imageUrl: string;
}

const events: Event[] = [
  { id: 1, imageUrl: openingImg },
  { id: 2, imageUrl: athleticsImg },
  { id: 3, imageUrl: swimmingImg },
  { id: 4, imageUrl: judoImg }, 
];

/**
 * HomePage component
 * Displays the homepage with a hero section, history, call to action, and events.
 * Uses Material-UI for styling and layout.
 */
export default function HomePage() {
  const { t } = useTranslation('home');

  return (
    <>
      {/* SEO metadata */}
      <Seo />

      {/* Hero section */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          height: 400,
          mb: 6,
          background: `url(${heroImg}) center/cover no-repeat`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dark overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.6)',
          }}
        />

        {/* Centered text */}
        <Box sx={{ position: 'relative', textAlign: 'center', px: 2 }}>
          <Typography
            variant="h2"
            sx={{
              position: 'relative',
              color: 'common.white',
              p: 2,
              borderRadius: 1,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {t('hero.title')}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'common.white',
              mt: 1,
              fontStyle: 'italic',
              opacity: 0.85,
            }}
          >
            {t('hero.subtitle')}
          </Typography>
        </Box>
      </Box>

      {/* History section */}
      <Box
        component="section"
        sx={{ maxWidth: 800, mx: 'auto', mb: 8, px: 2 }}
      >
        <Typography variant="h3" gutterBottom>
          {t('history.title')}
        </Typography>
        <Typography variant="body1">
          {t('history.text')}
        </Typography>
      </Box>

      {/* Call-to-action button */}
      <Box textAlign="center" mb={6}>
        <Button variant="contained" size="large" href="/tickets">
          {t('cta.title')}
        </Button>
      </Box>

      {/* Events gallery */}
      <Box component="section" sx={{ maxWidth: 800, mx: 'auto', mb: 4, px: 2 }}>
        <Typography variant="h3" gutterBottom>
          {t('events.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          {t('events.intro')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {events.map((evt) => (
            <Box
              key={evt.id}
              sx={{
                flex: '1 1 calc(33.333% - 32px)',
                minWidth: 260,
                maxWidth: 320,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Event image */}
              <Box
                component="img"
                src={evt.imageUrl}
                alt={t(`events.item${evt.id}.title`)}
                loading="lazy"
                sx={{ width: '100%', height: 180, objectFit: 'cover' }}
              />
              {/* Event title & description */}
              <Stack spacing={1} sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="h6">
                  {t(`events.item${evt.id}.title`)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(`events.item${evt.id}.description`)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}