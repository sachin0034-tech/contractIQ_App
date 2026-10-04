'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What types of contracts does ContractIQ support?',
    a: 'ContractIQ currently supports Non-Disclosure Agreements (NDAs) and Master Service Agreements (MSAs). Both standard and custom variants are handled. Support for additional contract types is on the roadmap.',
  },
  {
    q: 'How does the AI extract key terms?',
    a: 'The AI reads the full text of your contract and identifies key clauses using a combination of large language models and structured extraction prompts. Every term is grounded in the exact source sentence — you can see precisely where the AI found it.',
  },
  {
    q: 'Is my contract data secure?',
    a: 'Yes. Contracts are stored encrypted in Supabase (PostgreSQL) with row-level security policies so only you can access your data. Files are never used to train models, and you can delete your data at any time.',
  },
  {
    q: 'Can non-legal teams use ContractIQ?',
    a: 'Absolutely. ContractIQ is designed for anyone who needs to understand a contract quickly — founders, procurement teams, sales ops, and finance. The plain-English summaries and chat interface require no legal background.',
  },
  {
    q: 'How long does it take to review a contract?',
    a: 'Most contracts are fully analysed in under 2 minutes. You get every key term with its source sentence, confidence score, and the ability to ask follow-up questions immediately after.',
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderBottom: '1px solid #F0F0F1' }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '20px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, lineHeight: '22px', color: '#080A0E' }}>
                {faq.q}
              </span>
              <ChevronDown
                size={18}
                style={{
                  flexShrink: 0,
                  color: '#4A4C4F',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                }}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: '22px',
                  color: '#4A4C4F',
                  paddingBottom: 20,
                  margin: 0,
                }}
              >
                {faq.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
