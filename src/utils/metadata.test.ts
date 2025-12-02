import { describe, it, expect } from 'vitest';
import { createDefaultMetadata, updateMetadataArray, ensureMetadataLength } from './metadata';

describe('createDefaultMetadata', () => {
  it('creates metadata with correct defaults', () => {
    const meta = createDefaultMetadata();
    expect(meta.name).toBe('op-done');
    expect(meta.octave).toBe(0);
    expect(meta.drumVersion).toBe(3);
    expect(meta.pitch).toHaveLength(24);
    expect(meta.volume).toHaveLength(24);
    expect(meta.pitch.every(v => v === 0)).toBe(true);
    expect(meta.volume.every(v => v === 8192)).toBe(true);
  });
});

describe('updateMetadataArray', () => {
  it('updates value at index immutably', () => {
    const meta = createDefaultMetadata();
    const updated = updateMetadataArray(meta, 'volume', 0, 16383);
    
    expect(updated.volume[0]).toBe(16383);
    expect(meta.volume[0]).toBe(8192);
    expect(updated).not.toBe(meta);
  });
});

describe('ensureMetadataLength', () => {
  it('pads arrays to slice count', () => {
    const meta = { ...createDefaultMetadata(), pitch: [1, 2] };
    const result = ensureMetadataLength(meta, 5);
    
    expect(result.pitch).toHaveLength(5);
    expect(result.pitch[0]).toBe(1);
    expect(result.pitch[2]).toBe(0);
  });

  it('caps at 24 slices', () => {
    const meta = createDefaultMetadata();
    const result = ensureMetadataLength(meta, 30);
    
    expect(result.pitch).toHaveLength(24);
  });
});
