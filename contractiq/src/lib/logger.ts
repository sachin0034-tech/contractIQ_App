import 'server-only';
import pino from 'pino';

/**
 * Structured JSON logger. Contract text, prompts, chat content and credentials
 * are redacted even if a caller passes them by mistake.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: undefined,
  redact: {
    paths: [
      '*.contract_text',
      '*.contractText',
      '*.message',
      '*.content',
      '*.prompt',
      '*.messages',
      'contract_text',
      'contractText',
      'req.headers.authorization',
      'req.headers.cookie',
      '*.authorization',
      '*.cookie',
      '*.password',
    ],
    censor: '[redacted]',
  },
});
