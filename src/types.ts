export type SliceStatus = 'pending' | 'processing' | 'ready' | 'error';

export type NormalizeMode = 'loudnorm' | 'peak' | 'off';

export type SampleType = 'drum_hit' | 'melodic' | 'unknown';

export type DrumClass = 'kick' | 'snare' | 'hat' | 'cymbal' | 'other';

export interface SampleAnalysis {
  type: SampleType;
  drumClass?: DrumClass;
  noteName?: string;
  midiNote?: number;
  confidence: number; // 0 to 1
}

export type Slice = {
  id: string;
  file: File;
  name: string;
  duration: number; // seconds
  status: SliceStatus;
  error?: string;
  analysis?: SampleAnalysis;
};

export type DrumMetadata = {
  name: string;
  octave: number;
  drumVersion: number;
  pitch: number[]; // length <= 24
  playmode: number[];
  reverse: number[];
  volume: number[];
};

export type PackOptions = {
  normalizeMode: NormalizeMode;
  silenceThreshold: number;
  maxDuration: number;
};
