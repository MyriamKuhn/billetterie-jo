import Typography     from '@mui/material/Typography';
import Box            from '@mui/material/Box';
import Divider        from '@mui/material/Divider';
import Stack          from '@mui/material/Stack';
import Link           from '@mui/material/Link';
import List           from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText   from '@mui/material/ListItemText';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';
import { useTranslation } from 'react-i18next';

export default function LegalMentionsPage() {
  const { t } = useTranslation('legal');

  // Liste des sections : [key pour le titre, key pour le contenu]
  const sections = [
    ['subtitleEditor', 'editor'],
    ['subtitleDirector', 'director'],
    ['subtitleHosting', 'hosting'],
    ['subtitleAccessibility', 'accessibility'],
    ['subtitleIntellectualProperty', 'intellectualProperty'],
    ['subtitlePersonalData', 'personalData'],
    ['subtitleCookies', 'cookies'],
    ['subtitleLiability', 'liability'],
    ['subtitleLinks', 'links'],
    ['subtitleGoverningLaw', 'governingLaw'],
    ['subtitleContact', 'contact'],
    ['subtitleCredits', 'credits'],
    ['subtitleUpdate', 'update'],
    ['subtitleLastUpdate', 'lastUpdate'],
  ] as const;

  // Génère un ID d'ancrage à partir de la clé
  const makeId = (key: string) => key.replace(/([A-Z])/g, '-$1').toLowerCase();

  return (
    <>
      <Seo title={t('legal.seoTitle')} description={t('legal.seoDescription')}/>
      <PageWrapper>
        <Stack spacing={4}>
          {/* Titre principal */}
          <Typography variant="h4">{t('legal.title')}</Typography>

          {/* Table des matières */}
          <Box component="nav" sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: theme => `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" gutterBottom>
              {t('legal.subtitleTableOfContents')}
            </Typography>
            <List disablePadding>
              {sections.map(([subKey]) => {
                const id = makeId(subKey);
                return (
                  <ListItemButton
                    key={subKey}
                    component="a"
                    href={`#${id}`}
                    sx={{ pl: 2 }}
                  >
                    <ListItemText primary={t(`legal.${subKey}`)} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {/* Contenu des sections */}
          {sections.map(([subKey, textKey], i) => {
            const id = makeId(subKey);
            return (
              <Box key={subKey} id={id}>
                <Typography variant="h6" gutterBottom>
                  {t(`legal.${subKey}`)}
                </Typography>
                <Typography component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', fontWeight: 200, pl: 2 }}>
                  {t(`legal.${textKey}`)
                    .split(/(\s+)/) 
                    .map((segment, idx) => {
                      // URL ?
                      if (/https?:\/\/[^\s]+/.test(segment)) {
                        return (
                          <Link
                            key={idx}
                            href={segment}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {segment}
                          </Link>
                        );
                      }
                      // e-mail ?
                      if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(segment)) {
                        return (
                          <Link 
                            key={idx} 
                            href={`mailto:${segment}`}
                          >
                            {segment}
                          </Link>
                        );
                      }
                      return segment;
                    })}
                </Typography>
                {/* Séparateur sauf après la dernière section */}
                {i < sections.length - 1 && <Divider sx={{ mb: 0, mt: 5 }} />}
              </Box>
            );
          })}
        </Stack>
      </PageWrapper>
    </>
  );
}
