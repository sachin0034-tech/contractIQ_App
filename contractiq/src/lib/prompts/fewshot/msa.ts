import { NOT_FOUND_VALUE } from '@/lib/constants';
import type { FewShotExample } from './types';

// All parties and facts below are fictional.

const RENEWAL_SENTENCE =
  '11. Term and Renewal. This Agreement begins on the Effective Date and renews automatically for successive one (1) year terms unless either party gives written notice of non-renewal at least sixty (60) days before the end of the then-current term.';

export const MSA_EXAMPLES: FewShotExample[] = [
  {
    // Numeric exactness, high confidence, and an absent term.
    excerpt: `[PAGE 2]
4. Fees and Payment. Client shall pay each undisputed invoice within thirty (30) days of the invoice date.

[PAGE 5]
9. Limitation of Liability. Each party's total aggregate liability arising out of this Agreement shall not exceed the fees paid or payable by Client in the twelve (12) months preceding the claim.`,
    terms: ['Payment Terms', 'Liability Cap', 'Indemnification'],
    expected: {
      detected_type: 'MSA',
      terms: [
        {
          term_name: 'Payment Terms',
          value: 'Client must pay each undisputed invoice within 30 days of the invoice date.',
          page_number: 2,
          confidence_score: 0.97,
          source_sentence: '4. Fees and Payment. Client shall pay each undisputed invoice within thirty (30) days of the invoice date.',
        },
        {
          term_name: 'Liability Cap',
          value: "Each party's total liability is capped at the fees paid or payable by Client in the 12 months before the claim.",
          page_number: 5,
          confidence_score: 0.96,
          source_sentence:
            "9. Limitation of Liability. Each party's total aggregate liability arising out of this Agreement shall not exceed the fees paid or payable by Client in the twelve (12) months preceding the claim.",
        },
        {
          term_name: 'Indemnification',
          value: NOT_FOUND_VALUE,
          page_number: null,
          confidence_score: 0,
          source_sentence: null,
        },
      ],
    },
  },
  {
    // Auto-renewal and late fee extraction.
    excerpt: `[PAGE 3]
5. Late Payment. Overdue amounts shall accrue interest at 1.5% per month or the maximum rate permitted by law, whichever is lower.

[PAGE 6]
${RENEWAL_SENTENCE}`,
    terms: ['Late Payment Penalty', 'Termination Clause', 'Notice Period'],
    expected: {
      detected_type: 'MSA',
      terms: [
        {
          term_name: 'Late Payment Penalty',
          value: 'Overdue amounts accrue interest at 1.5% per month, or the legal maximum if lower.',
          page_number: 3,
          confidence_score: 0.96,
          source_sentence:
            '5. Late Payment. Overdue amounts shall accrue interest at 1.5% per month or the maximum rate permitted by law, whichever is lower.',
        },
        {
          term_name: 'Termination Clause',
          value: 'Renews automatically for 1-year terms unless either party gives written notice of non-renewal at least 60 days before the term ends.',
          page_number: 6,
          confidence_score: 0.9,
          source_sentence: RENEWAL_SENTENCE,
        },
        {
          term_name: 'Notice Period',
          value: '60 days written notice before the end of the current term to stop automatic renewal.',
          page_number: 6,
          confidence_score: 0.85,
          source_sentence: RENEWAL_SENTENCE,
        },
      ],
    },
  },
  {
    // Scope defined elsewhere: low confidence with the referencing sentence as the source.
    excerpt: `[PAGE 1]
This Master Services Agreement governs services that Provider will perform under one or more Statements of Work ("SOW") signed by the parties.

[PAGE 2]
2. Services. Provider shall perform the services described in each applicable SOW in accordance with this Agreement.`,
    terms: ['Service Scope', 'Dispute Resolution'],
    expected: {
      detected_type: 'MSA',
      terms: [
        {
          term_name: 'Service Scope',
          value: 'The services are defined in separate Statements of Work, not in this document.',
          page_number: 2,
          confidence_score: 0.4,
          source_sentence: '2. Services. Provider shall perform the services described in each applicable SOW in accordance with this Agreement.',
        },
        {
          term_name: 'Dispute Resolution',
          value: NOT_FOUND_VALUE,
          page_number: null,
          confidence_score: 0,
          source_sentence: null,
        },
      ],
    },
  },
];
