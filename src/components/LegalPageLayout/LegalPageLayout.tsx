import { TableOfContents } from '../TableOfContents';
import LegalSection from '../LegalSection';
import { PageWrapper } from '../PageWrapper';
import Seo from '../Seo';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

interface LayoutProps {
  seoTitle: string;
  seoDescription: string;
  pageTitle: string;
  sections: readonly [string, string][]; 
  namespace: string;                     
}

export default function LegalPageLayout({
  seoTitle,
  seoDescription,
  pageTitle,
  sections,
  namespace,
}: LayoutProps) {
  const { t } = useTranslation(namespace);

  // Générateur d'ID pour l'ancre
  const makeId = (key: string) =>
    key.replace(/([A-Z])/g, '-$1').toLowerCase();

  return (
    <>
      <Seo title={t(seoTitle)} description={t(seoDescription)} />
      <PageWrapper>
        {/* 1) Titre de la page */}
        <Typography variant="h4" gutterBottom>
          {t(pageTitle)}
        </Typography>

        {/* 2) Layout : TOC + contenu */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          {/* → On passe titleKey et namespace, pas title */}
          <TableOfContents
            sections={sections}
            makeId={makeId}
            namespace={namespace}
            titleKey={`${namespace}.subtitleTableOfContents`}
          />

          <Box sx={{ flex: 1, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {sections.map(([subKey, textKey], idx) => (
              <LegalSection
                key={subKey}
                id={makeId(subKey)}
                title={t(`${namespace}.${subKey}`)}
                content={t(`${namespace}.${textKey}`)}
                isLast={idx === sections.length - 1}
              />
            ))}
          </Box>
        </Stack>
      </PageWrapper>
    </>
  );
}
