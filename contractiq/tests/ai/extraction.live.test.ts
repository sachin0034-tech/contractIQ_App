// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { calculateCostUsd } from '@/lib/ai/cost';
import { getLlmClient } from '@/lib/azure';
import { normaliseTerms } from '@/lib/extraction/normalise';
import { buildExtractionMessages } from '@/lib/prompts/extraction';
import { STANDARD_TERMS } from '@/lib/prompts/terms';
import { buildMarkedText, parsePages } from '@/lib/pdf/parse-pages';
import { parseExtractionOutput } from '@/lib/validation/extraction';

// Live call to the Azure AI Foundry agent on a fictional contract.
// Run with: set -a; . ./.env.local; set +a; RUN_LIVE_AI=1 npx vitest run tests/ai
const live = process.env.RUN_LIVE_AI === '1' && !!process.env.AZURE_API_KEY && !!process.env.AZURE_AGENT_ENDPOINT;

const PAGES = [
  {
    n: 1,
    text: `MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement (the "Agreement") is made effective as of June 12, 2026 (the "Effective Date") between Zephyr Robotics Inc., a Texas corporation, and Lumen Foods LLC, a Colorado limited liability company.
1. Confidential Information. Each party shall hold the other party's Confidential Information in strict confidence and shall not use it except to evaluate a possible commercial relationship.
2. Permitted Disclosures. A party may disclose Confidential Information to its employees and legal advisors who need to know it and are bound by written confidentiality duties, or where disclosure is compelled by law.`,
  },
  {
    n: 2,
    text: `3. Term. This Agreement continues for two (2) years from the Effective Date. Confidentiality obligations survive for three (3) years after expiry.
4. Governing Law. This Agreement is governed by the laws of the State of Texas, and the parties submit to the exclusive jurisdiction of the state courts located in Travis County, Texas.
5. Remedies. Each party acknowledges that unauthorized disclosure may cause irreparable harm and that the disclosing party may seek injunctive relief in addition to other remedies.`,
  },
];

describe.skipIf(!live)('live extraction via Azure AI Foundry agent', () => {
  it('extracts grounded terms from a fictional NDA', async () => {
    const text = buildMarkedText(PAGES);
    const customTerms = ['Non-compete radius'];
    const messages = buildExtractionMessages({ type: 'NDA', text, customTerms });

    const started = Date.now();
    const completion = await getLlmClient().complete({ messages });
    const latencyMs = Date.now() - started;

    const output = parseExtractionOutput(completion.text);
    if (!output) console.log('RAW OUTPUT (not valid extraction JSON):', completion.text.slice(0, 1500));
    expect(output).not.toBeNull();

    const requested = [
      ...STANDARD_TERMS.NDA.map((name) => ({ name, isCustom: false })),
      ...customTerms.map((name) => ({ name, isCustom: true })),
    ];
    const { terms, stats } = normaliseTerms({ requested, returned: output!.terms, pages: parsePages(text) });

    console.log(
      JSON.stringify({
        latencyMs,
        cost: calculateCostUsd(completion.inputTokens, completion.outputTokens),
        tokens: [completion.inputTokens, completion.outputTokens],
        detected: output!.detected_type,
        stats,
        terms: terms.map((t) => [t.term_name, t.page_number, t.confidence_score, t.value.slice(0, 60)]),
      }),
    );

    expect(output!.detected_type).toBe('NDA');
    expect(terms).toHaveLength(requested.length);
    const byName = Object.fromEntries(terms.map((t) => [t.term_name, t]));
    expect(byName['Governing Law'].page_number).toBe(2);
    expect(byName['Governing Law'].value.toLowerCase()).toContain('texas');
    expect(byName['Non-compete radius'].value).toBe('Not found in document');
  }, 90_000);
});
