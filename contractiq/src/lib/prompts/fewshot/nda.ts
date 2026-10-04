import { NOT_FOUND_VALUE } from '@/lib/constants';
import type { FewShotExample } from './types';

// All parties and facts below are fictional.

const MUTUAL_PARTIES_SENTENCE =
  'This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of March 1, 2025 (the "Effective Date") by and between Northwind Labs Inc., a Delaware corporation, and Harbor Analytics LLC, a California limited liability company.';

export const NDA_EXAMPLES: FewShotExample[] = [
  {
    // Explicit duration, governing law on a later page, and an absent term.
    excerpt: `[PAGE 1]
MUTUAL NON-DISCLOSURE AGREEMENT
${MUTUAL_PARTIES_SENTENCE}
Each party may disclose Confidential Information to the other for the purpose of evaluating a potential business relationship.

[PAGE 2]
2. Term. This Agreement shall remain in effect for three (3) years from the Effective Date.
3. Governing Law. This Agreement shall be governed by the laws of the State of Delaware.`,
    terms: ['Parties', 'Effective Date', 'Term & Duration', 'Governing Law', 'Non-Solicitation'],
    expected: {
      detected_type: 'NDA',
      terms: [
        {
          term_name: 'Parties',
          value: 'Northwind Labs Inc. (Delaware corporation) and Harbor Analytics LLC (California limited liability company).',
          page_number: 1,
          confidence_score: 0.97,
          source_sentence: MUTUAL_PARTIES_SENTENCE,
        },
        {
          term_name: 'Effective Date',
          value: 'March 1, 2025.',
          page_number: 1,
          confidence_score: 0.97,
          source_sentence: MUTUAL_PARTIES_SENTENCE,
        },
        {
          term_name: 'Term & Duration',
          value: 'The agreement lasts 3 years from the Effective Date.',
          page_number: 2,
          confidence_score: 0.96,
          source_sentence: '2. Term. This Agreement shall remain in effect for three (3) years from the Effective Date.',
        },
        {
          term_name: 'Governing Law',
          value: 'Delaware law.',
          page_number: 2,
          confidence_score: 0.98,
          source_sentence: '3. Governing Law. This Agreement shall be governed by the laws of the State of Delaware.',
        },
        {
          term_name: 'Non-Solicitation',
          value: NOT_FOUND_VALUE,
          page_number: null,
          confidence_score: 0,
          source_sentence: null,
        },
      ],
    },
  },
  {
    // One-way NDA with a survival period that depends on an undefined event: moderate confidence.
    excerpt: `[PAGE 1]
CONFIDENTIALITY AGREEMENT
Brightline Consulting Ltd. ("Recipient") agrees to receive confidential information from Orchard Health Inc. ("Discloser").

[PAGE 2]
3. Obligations. The Recipient shall hold all Confidential Information in strict confidence and shall not use it for any purpose other than evaluating the proposed transaction.
4. Duration of Obligations. The Recipient's obligations under this Agreement shall continue for five (5) years following the termination of the relationship between the parties, and with respect to trade secrets for so long as they remain trade secrets.`,
    terms: ['Parties', 'Confidentiality Obligations', 'Term & Duration'],
    expected: {
      detected_type: 'NDA',
      terms: [
        {
          term_name: 'Parties',
          value: 'Brightline Consulting Ltd. receives information (Recipient) from Orchard Health Inc. (Discloser). One-way agreement.',
          page_number: 1,
          confidence_score: 0.9,
          source_sentence:
            'Brightline Consulting Ltd. ("Recipient") agrees to receive confidential information from Orchard Health Inc. ("Discloser").',
        },
        {
          term_name: 'Confidentiality Obligations',
          value: 'The Recipient must keep all Confidential Information strictly confidential and use it only to evaluate the proposed transaction.',
          page_number: 2,
          confidence_score: 0.93,
          source_sentence:
            '3. Obligations. The Recipient shall hold all Confidential Information in strict confidence and shall not use it for any purpose other than evaluating the proposed transaction.',
        },
        {
          term_name: 'Term & Duration',
          value:
            'Duties last 5 years after the relationship between the parties ends, and for trade secrets as long as they remain trade secrets. The end of the relationship is not defined.',
          page_number: 2,
          confidence_score: 0.7,
          source_sentence:
            "4. Duration of Obligations. The Recipient's obligations under this Agreement shall continue for five (5) years following the termination of the relationship between the parties, and with respect to trade secrets for so long as they remain trade secrets.",
        },
      ],
    },
  },
  {
    // List-style value, multi-clause source sentence, and an absent term.
    excerpt: `[PAGE 3]
5. Permitted Disclosures. The Receiving Party may disclose Confidential Information only to its employees, advisors and professional representatives who need to know it and who are bound by confidentiality obligations, or as required by law or court order, provided it gives the Disclosing Party prompt written notice where legally permitted.
6. Remedies. The parties agree that breach may cause irreparable harm and that the Disclosing Party is entitled to seek injunctive relief in addition to any other remedy available at law.`,
    terms: ['Permitted Disclosures', 'Breach & Remedy', 'IP Ownership'],
    expected: {
      detected_type: 'NDA',
      terms: [
        {
          term_name: 'Permitted Disclosures',
          value:
            'Only to employees, advisors and professional representatives who need to know and are bound by confidentiality, or when required by law or court order (with prompt written notice where legally allowed).',
          page_number: 3,
          confidence_score: 0.95,
          source_sentence:
            '5. Permitted Disclosures. The Receiving Party may disclose Confidential Information only to its employees, advisors and professional representatives who need to know it and who are bound by confidentiality obligations, or as required by law or court order, provided it gives the Disclosing Party prompt written notice where legally permitted.',
        },
        {
          term_name: 'Breach & Remedy',
          value: 'A breach may cause irreparable harm, so the Disclosing Party can seek an injunction in addition to other legal remedies.',
          page_number: 3,
          confidence_score: 0.94,
          source_sentence:
            '6. Remedies. The parties agree that breach may cause irreparable harm and that the Disclosing Party is entitled to seek injunctive relief in addition to any other remedy available at law.',
        },
        {
          term_name: 'IP Ownership',
          value: NOT_FOUND_VALUE,
          page_number: null,
          confidence_score: 0,
          source_sentence: null,
        },
      ],
    },
  },
];
