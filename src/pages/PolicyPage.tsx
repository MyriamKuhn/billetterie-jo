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
