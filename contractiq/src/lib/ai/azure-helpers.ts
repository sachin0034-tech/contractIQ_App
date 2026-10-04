/** Pure helpers for the Azure AI Foundry agent client (kept free of server-only imports so they are unit-testable). */

export class AzureConfigError extends Error {}

/**
 * The portal gives the agent endpoint ending in /responses. The OpenAI SDK appends /responses itself,
 * so the suffix must be removed or every call hits /responses/responses and returns 405.
 */
export function normalizeAgentEndpoint(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new AzureConfigError('AZURE_AGENT_ENDPOINT is empty.');

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AzureConfigError('AZURE_AGENT_ENDPOINT is not a valid URL.');
  }
  if (url.protocol !== 'https:') throw new AzureConfigError('AZURE_AGENT_ENDPOINT must use https.');
  if (url.hostname.endsWith('openai.azure.com')) {
    throw new AzureConfigError(
      'AZURE_AGENT_ENDPOINT is an Azure OpenAI resource URL. Use the agent endpoint from Agents in the Foundry portal (services.ai.azure.com).',
    );
  }
  if (!url.hostname.endsWith('services.ai.azure.com')) {
    throw new AzureConfigError('AZURE_AGENT_ENDPOINT must be a services.ai.azure.com agent endpoint.');
  }

  const path = url.pathname.replace(/\/+$/, '').replace(/\/responses$/, '');
  return `${url.origin}${path}`;
}

interface OutputContent {
  type?: string;
  text?: string;
}
interface OutputItem {
  type?: string;
  content?: OutputContent[];
}

export interface AzureResponseLike {
  status?: string;
  output_text?: string;
  output?: OutputItem[];
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string } | null;
  incomplete_details?: { reason?: string } | null;
}

/** Extracts the assistant text from a Responses API result, whether or not the SDK populated `output_text`. */
export function extractOutputText(response: AzureResponseLike): string {
  if (typeof response.output_text === 'string' && response.output_text.length > 0) return response.output_text;
  const parts: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue;
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('');
}
