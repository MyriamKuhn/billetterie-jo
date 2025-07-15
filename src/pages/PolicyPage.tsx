import LegalPageLayout from '../components/LegalPageLayout';

const sections: readonly [string, string][] = [
  ['subtitleResponsible', 'responsible'],
  ['subtitleDataCollection', 'dataCollection'],
  ['subtitleDataUsage', 'dataUsage'],
  ['subtitleDataRetention', 'dataRetention'],
  ['subtitleDataSecurity', 'dataSecurity'],
  ['subtitleTransfer', 'transfer'],
  ['subtitleYourRights', 'yourRights'],
  ['subtitleCookies', 'cookies'],
  ['subtitleChanges', 'changes'],
];

/**
 * Legal Mentions Page Component
 * This component renders the legal mentions page with a layout that includes
 * various sections related to privacy policies.
 */
export default function LegalMentionsPage() {
  return (
    <LegalPageLayout
      namespace="privacy"
      seoTitle="privacy.seoTitle"
      seoDescription="privacy.seoDescription"
      pageTitle="privacy.title"
      sections={sections}
    />
  );
}
