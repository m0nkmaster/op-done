import { describe, it, expect } from 'vitest';
import { normalizeBuffer, trimSilence, computeRMS } from './dsp';

describe('normalizeBuffer', () => {
  it('normalizes to peak of 1.0', () => {
    const input = new Float32Array([0.5, -0.25, 0.1]);
    const result = normalizeBuffer(input);
    expect(Math.max(...Array.from(result))).toBe(1.0);
  });

  it('handles zero buffer', () => {
    const input = new Float32Array([0, 0, 0]);
    const result = normalizeBuffer(input);
    expect(result).toHaveLength(3);
  });
});

describe('trimSilence', () => {
  it('trims leading and trailing silence', () => {
    const input = new Float32Array([0.001, 0.001, 0.5, 0.6, 0.001, 0.001]);
    const result = trimSilence(input, -40);
    expect(result.length).toBeLessThan(input.length);
  });

  it('returns empty for all silence', () => {
    const input = new Float32Array([0.001, 0.001, 0.001]);
    const result = trimSilence(input, -40);
    expect(result.length).toBe(0);
  });
});

describe('computeRMS', () => {
  it('computes RMS correctly', () => {
    const input = new Float32Array([1, -1, 1, -1]);
    const rms = computeRMS(input);
    expect(rms).toBeCloseTo(1.0);
  });

  it('handles zero buffer', () => {
    const input = new Float32Array([0, 0, 0]);
    expect(computeRMS(input)).toBe(0);
  });
});
