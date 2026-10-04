import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service | ContractIQ' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 2026"
      sections={[
        {
          heading: 'Use of the service',
          paragraphs: [
            'ContractIQ helps you review non-disclosure agreements and master service agreements by extracting key terms and answering questions about a document you upload.',
            'ContractIQ is an AI-assisted review tool. It is not legal advice and does not create a lawyer-client relationship. Always verify critical terms with a qualified lawyer before you sign.',
          ],
        },
        {
          heading: 'Acceptable use',
          paragraphs: [
            'Only upload contracts you are entitled to share. You must not upload another party’s confidential contract without their permission.',
            'You must not attempt to access other users’ data, interfere with the service, or use it to process unlawful content.',
          ],
        },
        {
          heading: 'Your content',
          paragraphs: [
            'You keep ownership of everything you upload. You give ContractIQ permission to process it for the sole purpose of providing the service to you.',
            'Your contracts are not used to train any AI model.',
          ],
        },
        {
          heading: 'Accuracy and limits',
          paragraphs: [
            'Extracted terms and chat answers can be wrong or incomplete. Each term shows a confidence score and the sentence it came from so you can check it.',
            'The service supports English-language NDAs and MSAs in text-based PDF form, up to 20 pages.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: ['Questions about these terms can be sent to the ContractIQ team through your account contact.'],
        },
      ]}
    />
  );
}
