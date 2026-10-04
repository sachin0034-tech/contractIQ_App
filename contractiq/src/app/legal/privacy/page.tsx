import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy | ContractIQ' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      sections={[
        {
          heading: 'What we store',
          paragraphs: [
            'Your account email and optional name; the contracts you upload (the PDF and the text extracted from it); the key terms extracted, including any corrections you make; your chat questions and answers; and any feedback you send.',
          ],
        },
        {
          heading: 'How your contract is processed',
          paragraphs: [
            'The text of your contract and your questions are sent to an AI agent hosted on Microsoft Azure AI Foundry to produce key terms and answers. We do not use your contracts to train any model, and we ask the service not to store your content in the agent’s memory.',
            'Only the content needed to answer your request is sent. Your name and email are not included.',
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'Data is encrypted in transit and at rest. Each user can only access their own contracts. PDF downloads use links that expire after one hour.',
          ],
        },
        {
          heading: 'Retention and deletion',
          paragraphs: [
            'Uploaded PDF files are deleted automatically 90 days after you last opened the contract. You can delete a contract, with its key terms and chat history, at any time from your dashboard.',
            'To delete your account and all associated data, contact us and we will remove it.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'You can ask for a copy of your data or for it to be deleted. Where required by law, a data processing agreement is available on request.',
          ],
        },
      ]}
    />
  );
}
