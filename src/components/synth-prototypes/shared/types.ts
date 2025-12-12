/**
 * Shared types for synth prototype components
 */

import type { SoundConfig } from '../../../types/soundConfig';

export interface TabConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
  modified?: boolean;
}

export interface ContinuousDialProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  logarithmic?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface TabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export interface SynthState {
  config: SoundConfig;
  activeTab: string;
  playing: boolean;
  exporting: boolean;
  error: string | null;
}

export interface SynthActions {
  updateLayer: (index: number, layer: SoundConfig['synthesis']['layers'][0]) => void;
  addLayer: (type: 'oscillator' | 'noise' | 'fm' | 'karplus-strong') => void;
  removeLayer: (index: number) => void;
  updateEnvelope: (envelope: SoundConfig['envelope']) => void;
  updateFilter: (filter: SoundConfig['filter']) => void;
  updateLFO: (lfo: SoundConfig['lfo']) => void;
  updateEffects: (effects: SoundConfig['effects']) => void;
  updateDuration: (duration: number) => void;
  setActiveTab: (tab: string) => void;
  play: () => Promise<void>;
  exportWav: () => Promise<void>;
  setError: (error: string | null) => void;
}
