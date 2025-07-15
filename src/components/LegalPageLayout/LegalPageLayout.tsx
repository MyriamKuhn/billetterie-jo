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

/**
 * A layout component for legal pages (e.g., Terms, Privacy), rendering SEO tags, page title, a table of contents, and content sections.
 * It uses the `useTranslation` hook for internationalization and expects a specific structure for sections.
 * It generates IDs for sections based on their keys to facilitate navigation.
 * It also ensures that the content is wrapped in a responsive layout with proper styling.
 */
export default function LegalPageLayout({
  seoTitle,
  seoDescription,
  pageTitle,
  sections,
  namespace,
}: LayoutProps) {
  const { t } = useTranslation(namespace);

  // Generate anchor IDs by converting camelCase keys to kebab-case
  const makeId = (key: string) =>
    key.replace(/([A-Z])/g, '-$1').toLowerCase();

  return (
    <>
      {/* SEO meta tags */}
      <Seo title={t(seoTitle)} description={t(seoDescription)} />
      {/* Main page wrapper */}
      <PageWrapper>
        {/* Page heading */}
        <Typography variant="h4" gutterBottom>
          {t(pageTitle)}
        </Typography>

        {/* Two-column layout: TOC on left, content on right (stacked on mobile) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          {/* Table of Contents: receives section keys, ID generator, and translation keys */}
          <TableOfContents
            sections={sections}
            makeId={makeId}
            namespace={namespace}
            titleKey={`${namespace}.subtitleTableOfContents`}
          />

          {/* Content sections */}
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
