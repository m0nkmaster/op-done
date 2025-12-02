import { describe, it, expect } from 'vitest';
import { formatNamePrefix } from './naming';

describe('formatNamePrefix', () => {
  it('returns sample for undefined analysis', () => {
    expect(formatNamePrefix(undefined)).toBe('sample');
  });

  it('returns drum class for drum hits', () => {
    expect(formatNamePrefix({
      type: 'drum_hit',
      drumClass: 'kick',
      confidence: 0.8
    })).toBe('kick');
  });

  it('returns note name for melodic samples', () => {
    expect(formatNamePrefix({
      type: 'melodic',
      noteName: 'C4',
      confidence: 0.9
    })).toBe('C4');
  });

  it('strips whitespace from note names', () => {
    expect(formatNamePrefix({
      type: 'melodic',
      noteName: 'C 4',
      confidence: 0.9
    })).toBe('C4');
  });

  it('returns melodic for melodic without note name', () => {
    expect(formatNamePrefix({
      type: 'melodic',
      confidence: 0.7
    })).toBe('melodic');
  });

  it('returns sample for unknown type', () => {
    expect(formatNamePrefix({
      type: 'unknown',
      confidence: 0.3
    })).toBe('sample');
  });
});
