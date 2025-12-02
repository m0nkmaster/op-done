import { describe, it, expect } from 'vitest';
import { padArray, clamp } from './array';

describe('padArray', () => {
  it('pads array to target length', () => {
    expect(padArray([1, 2], 5, 0)).toEqual([1, 2, 0, 0, 0]);
  });

  it('truncates array if longer than target', () => {
    expect(padArray([1, 2, 3, 4], 2, 0)).toEqual([1, 2]);
  });

  it('returns copy when length matches', () => {
    const input = [1, 2, 3];
    const result = padArray(input, 3, 0);
    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(input);
  });
});

describe('clamp', () => {
  it('clamps value to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps value to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
