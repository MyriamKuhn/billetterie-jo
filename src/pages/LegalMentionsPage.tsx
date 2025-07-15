import LegalPageLayout from '../components/LegalPageLayout';

const sections: readonly [string, string][] = [
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
];

/**
 * Legal Mentions Page
 * This page contains the legal mentions of the website.
 * It is structured using the LegalPageLayout component.
 */
export default function LegalMentionsPage() {
  return (
    <LegalPageLayout
      namespace="legal"
      seoTitle="legal.seoTitle"
      seoDescription="legal.seoDescription"
      pageTitle="legal.title"
      sections={sections}
    />
  );
}
