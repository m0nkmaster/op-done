/** Converts frequency to MIDI note number */
export const freqToMidi = (freq: number): number =>
  69 + 12 * Math.log2(freq / 440);

/** Converts MIDI note to note name with octave */
export const midiToNoteName = (midi: number): string => {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const note = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[note]}${octave}`;
};

/** Converts frequency to note name */
export const frequencyToNote = (freq: number): string =>
  midiToNoteName(Math.round(freqToMidi(freq)));

/** Converts semitones to OP-Z pitch parameter (8192 = center) */
export const semitonesToPitchParam = (semitones: number): number =>
  Math.round(8192 + semitones * 683);

/** Formats duration in seconds to MM:SS.mmm */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
};
