import { describe, expect, it } from 'vitest';
import { bandFor, formatConfidence } from '@/lib/confidence';

describe('bandFor', () => {
  it('applies thresholds at their boundaries', () => {
    expect(bandFor(0)).toBe('low');
    expect(bandFor(0.4999)).toBe('low');
    expect(bandFor(0.5)).toBe('medium');
    expect(bandFor(0.7999)).toBe('medium');
    expect(bandFor(0.8)).toBe('high');
    expect(bandFor(1)).toBe('high');
  });
});

describe('formatConfidence', () => {
  it('rounds down so a low score never reads as 50%', () => {
    expect(formatConfidence(0.4999)).toBe('49%');
    expect(formatConfidence(0.5)).toBe('50%');
    expect(formatConfidence(0.58)).toBe('58%');
    expect(formatConfidence(0.97)).toBe('97%');
    expect(formatConfidence(1)).toBe('100%');
  });
});
