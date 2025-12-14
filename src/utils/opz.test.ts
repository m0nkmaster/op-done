import { describe, it, expect } from 'vitest';
import { encodePositions, calculateSliceBoundaries } from './opz';

describe('encodePositions', () => {
  it('scales frames by 4058 (TE scale factor)', () => {
    expect(encodePositions([1])[0]).toBe(4058);
  });

  it('clamps to max position', () => {
    const result = encodePositions([999999999]);
    expect(result[0]).toBe(0x7ffffffe);
  });

  it('handles zero', () => {
    expect(encodePositions([0])[0]).toBe(0);
  });
});

describe('calculateSliceBoundaries', () => {
  it('calculates boundaries for single slice', () => {
    // 22050 frames = 0.5 seconds at 44100 Hz
    const result = calculateSliceBoundaries([22050]);
    expect(result.start[0]).toBe(0);
    // End is EXCLUSIVE: 0 + 22050 = 22050
    expect(result.end[0]).toBe(22050);
  });

  it('pads to 24 slices', () => {
    const result = calculateSliceBoundaries([22050]);
    expect(result.start).toHaveLength(24);
    expect(result.end).toHaveLength(24);
  });

  it('handles multiple slices with no gaps (TE format)', () => {
    // Two slices: 11025 frames each
    const result = calculateSliceBoundaries([11025, 11025]);

    // Slice 1: [0, 11025) - plays frames 0..11024
    expect(result.start[0]).toBe(0);
    expect(result.end[0]).toBe(11025);

    // Slice 2: [11025, 22050) - plays frames 11025..22049
    // End of slice 1 equals start of slice 2 (no gap)
    expect(result.start[1]).toBe(11025);
    expect(result.end[1]).toBe(22050);

    // Verify no gap: end[0] === start[1]
    expect(result.end[0]).toBe(result.start[1]);
  });

  it('empty slices use 0,0 (TE format)', () => {
    const result = calculateSliceBoundaries([1000]);
    // First slice is active
    expect(result.start[0]).toBe(0);
    expect(result.end[0]).toBe(1000);

    // Empty slices use 0,0 per TE format
    expect(result.start[1]).toBe(0);
    expect(result.end[1]).toBe(0);
  });

  it('matches TE official format exactly', () => {
    // Simulate 3 samples: 2200, 3460, 4725 frames
    const result = calculateSliceBoundaries([2200, 3460, 4725]);

    // Slice 1: [0, 2200)
    expect(result.start[0]).toBe(0);
    expect(result.end[0]).toBe(2200);

    // Slice 2: [2200, 5660)
    expect(result.start[1]).toBe(2200);
    expect(result.end[1]).toBe(5660);

    // Slice 3: [5660, 10385)
    expect(result.start[2]).toBe(5660);
    expect(result.end[2]).toBe(10385);

    // All ends equal next starts (tight packing)
    expect(result.end[0]).toBe(result.start[1]);
    expect(result.end[1]).toBe(result.start[2]);
  });
});
