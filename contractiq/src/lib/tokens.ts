import 'server-only';
import { getEncoding, type Tiktoken } from 'js-tiktoken';

let encoder: Tiktoken | null = null;

/** Counts tokens with the GPT-4o tokenizer (o200k_base). The encoder is built once per process. */
export function countTokens(text: string): number {
  encoder ??= getEncoding('o200k_base');
  return encoder.encode(text).length;
}
