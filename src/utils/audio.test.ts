import { describe, it, expect } from 'vitest';
import { freqToMidi, midiToNoteName, frequencyToNote, semitonesToPitchParam, formatDuration } from './audio';

describe('freqToMidi', () => {
  it('converts A4 (440Hz) to MIDI 69', () => {
    expect(freqToMidi(440)).toBe(69);
  });

  it('converts C4 (261.63Hz) to MIDI 60', () => {
    expect(Math.round(freqToMidi(261.63))).toBe(60);
  });
});

describe('midiToNoteName', () => {
  it('converts MIDI 60 to C4', () => {
    expect(midiToNoteName(60)).toBe('C4');
  });

  it('converts MIDI 69 to A4', () => {
    expect(midiToNoteName(69)).toBe('A4');
  });

  it('handles sharps correctly', () => {
    expect(midiToNoteName(61)).toBe('C#4');
  });
});

describe('frequencyToNote', () => {
  it('converts 440Hz to A4', () => {
    expect(frequencyToNote(440)).toBe('A4');
  });
});

describe('semitonesToPitchParam', () => {
  it('returns 8192 for 0 semitones', () => {
    expect(semitonesToPitchParam(0)).toBe(8192);
  });

  it('increases for positive semitones', () => {
    expect(semitonesToPitchParam(1)).toBeGreaterThan(8192);
  });

  it('decreases for negative semitones', () => {
    expect(semitonesToPitchParam(-1)).toBeLessThan(8192);
  });
});

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(65.123)).toBe('1:05.123');
  });

  it('pads single digit seconds', () => {
    expect(formatDuration(5.5)).toBe('0:05.500');
  });
});
