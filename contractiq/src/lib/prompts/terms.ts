import type { ContractType } from '@/types/domain';

/** Standard key terms extracted per contract type. Order is display order. */
export const STANDARD_TERMS: Record<ContractType, readonly string[]> = {
  NDA: [
    'Parties',
    'Effective Date',
    'Confidentiality Obligations',
    'Permitted Disclosures',
    'Term & Duration',
    'Governing Law',
    'Jurisdiction',
    'IP Ownership',
    'Non-Solicitation',
    'Breach & Remedy',
  ],
  MSA: [
    'Parties',
    'Service Scope',
    'Payment Terms',
    'Invoice Schedule',
    'Late Payment Penalty',
    'Liability Cap',
    'Indemnification',
    'IP Ownership',
    'Termination Clause',
    'Governing Law',
    'Dispute Resolution',
    'Notice Period',
  ],
};

/** One-sentence plain-English explanation per term, shown in tooltips. */
export const TERM_HELP: Record<string, string> = {
  Parties: 'The people or companies who are bound by this agreement.',
  'Effective Date': 'The date the agreement starts to apply.',
  'Confidentiality Obligations': 'What you must keep secret, and how carefully you must protect it.',
  'Permitted Disclosures': 'The situations where sharing confidential information is still allowed.',
  'Term & Duration': 'How long the agreement lasts, and how long secrecy duties continue afterwards.',
  'Governing Law': 'Which place’s laws decide how the agreement is interpreted.',
  Jurisdiction: 'Which courts can hear a dispute about the agreement.',
  'IP Ownership': 'Who owns the ideas, work and materials created or shared under the agreement.',
  'Non-Solicitation': 'Limits on hiring or approaching the other side’s staff or customers.',
  'Breach & Remedy': 'What counts as breaking the agreement and what the other side can do about it.',
  'Service Scope': 'The work or services one side has agreed to provide.',
  'Payment Terms': 'How much is paid and when payment is due.',
  'Invoice Schedule': 'How often invoices are sent and the timing for sending them.',
  'Late Payment Penalty': 'Extra charges that apply when a payment is late.',
  'Liability Cap': 'The maximum amount one side can be made to pay if something goes wrong.',
  Indemnification: 'Who pays if the other side is sued or suffers a loss because of this deal.',
  'Termination Clause': 'How and when either side can end the agreement, including notice and auto-renewal.',
  'Dispute Resolution': 'How disagreements must be handled, such as negotiation, mediation or arbitration.',
  'Notice Period': 'How much warning must be given before ending or changing the agreement.',
};

export function standardTermsFor(type: ContractType): readonly string[] {
  return STANDARD_TERMS[type];
}
