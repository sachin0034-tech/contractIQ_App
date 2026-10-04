import { describe, expect, it } from 'vitest';
import {
  AzureConfigError,
  extractOutputText,
  normalizeAgentEndpoint,
} from '@/lib/ai/azure-helpers';
import { flattenMessages } from '@/lib/ai/flatten';
import { AppError } from '@/lib/errors';

describe('normalizeAgentEndpoint', () => {
  const base = 'https://acct.services.ai.azure.com/api/projects/p/agents/a/endpoint/protocols/openai';

  it('strips the trailing /responses so the SDK does not double it', () => {
    expect(normalizeAgentEndpoint(`${base}/responses`)).toBe(base);
    expect(normalizeAgentEndpoint(`${base}/responses/`)).toBe(base);
    expect(normalizeAgentEndpoint(`  ${base}/responses  `)).toBe(base);
  });

  it('leaves an endpoint without the suffix alone and drops any query string', () => {
    expect(normalizeAgentEndpoint(base)).toBe(base);
    expect(normalizeAgentEndpoint(`${base}/responses?api-version=v1`)).toBe(base);
  });

  it('rejects wrong endpoint kinds with a helpful message', () => {
    expect(() => normalizeAgentEndpoint('')).toThrow(AzureConfigError);
    expect(() => normalizeAgentEndpoint('not a url')).toThrow(AzureConfigError);
    expect(() => normalizeAgentEndpoint('http://acct.services.ai.azure.com/x')).toThrow(/https/);
    expect(() => normalizeAgentEndpoint('https://acct.openai.azure.com/openai/v1/responses')).toThrow(/Azure OpenAI resource/);
    expect(() => normalizeAgentEndpoint('https://example.com/responses')).toThrow(/services\.ai\.azure\.com/);
  });
});

describe('extractOutputText', () => {
  it('prefers output_text', () => {
    expect(extractOutputText({ output_text: 'hello' })).toBe('hello');
  });

  it('falls back to message output items and ignores tool-call items', () => {
    expect(
      extractOutputText({
        output: [
          { type: 'memory_search_call' },
          { type: 'message', content: [{ type: 'output_text', text: 'Hello ' }, { type: 'output_text', text: 'world' }] },
        ],
      }),
    ).toBe('Hello world');
  });

  it('returns an empty string when there is no text', () => {
    expect(extractOutputText({ output: [{ type: 'memory_search_call' }] })).toBe('');
  });
});

describe('flattenMessages', () => {
  it('produces one transcript with labelled sections ending at the assistant turn', () => {
    const text = flattenMessages([
      { role: 'system', content: 'RULES' },
      { role: 'user', content: 'example question' },
      { role: 'assistant', content: 'example answer' },
      { role: 'user', content: 'real question' },
    ]);
    const order = ['=== SYSTEM ===\nRULES', '=== USER ===\nexample question', '=== ASSISTANT ===\nexample answer', '=== USER ===\nreal question'];
    let cursor = -1;
    for (const part of order) {
      const index = text.indexOf(part);
      expect(index).toBeGreaterThan(cursor);
      cursor = index;
    }
    expect(text.trimEnd().endsWith('=== ASSISTANT (write this reply) ===')).toBe(true);
    expect(text).toContain('Reply with only the next ASSISTANT message');
  });
});

describe('AppError detail', () => {
  it('includes the upstream detail outside production', () => {
    const env = process.env as Record<string, string | undefined>;
    const original = { node: env.NODE_ENV, flag: env.EXPOSE_ERROR_DETAILS };
    try {
      env.NODE_ENV = 'development';
      expect(new AppError('AI_UNAVAILABLE', { detail: '401 bad key' }).toEnvelope().error.detail).toBe('401 bad key');

      env.NODE_ENV = 'production';
      delete env.EXPOSE_ERROR_DETAILS;
      expect(new AppError('AI_UNAVAILABLE', { detail: '401 bad key' }).toEnvelope().error.detail).toBeUndefined();

      env.EXPOSE_ERROR_DETAILS = 'true';
      expect(new AppError('AI_UNAVAILABLE', { detail: '401 bad key' }).toEnvelope().error.detail).toBe('401 bad key');
    } finally {
      env.NODE_ENV = original.node;
      if (original.flag === undefined) delete env.EXPOSE_ERROR_DETAILS;
      else env.EXPOSE_ERROR_DETAILS = original.flag;
    }
  });
});
