import LegalPageLayout from '../components/LegalPageLayout';

const sections: readonly [string, string][] = [
  ['subtitleIntroduction', 'introduction'],
  ['subtitleDefinition', 'definition'],
  ['subtitleApplication', 'application'],
  ['subtitleOrder', 'order'],
  ['subtitleUserPrizes', 'prizes'],
  ['subtitleDelivery', 'delivery'],
  ['subtitleCancellation', 'cancellation'],
  ['subtitleResponsibility', 'responsibility'],
  ['subtitlePersonalData', 'personalData'],
  ['subtitleIntellectualProperty', 'intellectualProperty'],
  ['subtitleGoverningLaw', 'governingLaw'],
  ['subtitleContact', 'contact'],
  ['subtitleUpdate', 'update'],
];

export default function LegalMentionsPage() {
  return (
    <LegalPageLayout
      namespace="terms"
      seoTitle="terms.seoTitle"
      seoDescription="terms.seoDescription"
      pageTitle="terms.title"
      sections={sections}
    />
  );
}
