/**
 * Shared state management hook for all synth prototypes
 * Manages SoundConfig state and provides update functions
 */

import { useState, useCallback } from 'react';
import { DEFAULT_SOUND_CONFIG, type SoundConfig } from '../../../types/soundConfig';
import type { SynthState, SynthActions } from './types';
import { synthesizeSound } from '../../../audio/synthesizer';
import { audioBufferToWav } from './audioExport';

export function useSynthState(): SynthState & SynthActions {
  const [config, setConfig] = useState<SoundConfig>(DEFAULT_SOUND_CONFIG);
  const [activeTab, setActiveTab] = useState<string>('synthesis');
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLayer = useCallback((index: number, layer: SoundConfig['synthesis']['layers'][0]) => {
    setConfig(prev => {
      const newLayers = [...prev.synthesis.layers];
      newLayers[index] = layer;
      return {
        ...prev,
        synthesis: {
          ...prev.synthesis,
          layers: newLayers,
        },
      };
    });
  }, []);

  const addLayer = useCallback((type: 'oscillator' | 'noise' | 'fm' | 'karplus-strong') => {
    setConfig(prev => {
      if (prev.synthesis.layers.length >= 8) {
        return prev;
      }

      const newLayer: SoundConfig['synthesis']['layers'][0] = {
        type,
        gain: 0.5,
      };

      // Add type-specific defaults
      switch (type) {
        case 'oscillator':
          newLayer.oscillator = {
            waveform: 'sine',
            frequency: 440,
            detune: 0,
            unison: { voices: 1, detune: 0, spread: 0 },
          };
          break;
        case 'noise':
          newLayer.noise = { type: 'white' };
          break;
        case 'fm':
          newLayer.fm = {
            carrier: 440,
            modulator: 880,
            modulationIndex: 100,
          };
          break;
        case 'karplus-strong':
          newLayer.karplus = {
            frequency: 440,
            damping: 0.5,
          };
          break;
      }

      return {
        ...prev,
        synthesis: {
          ...prev.synthesis,
          layers: [...prev.synthesis.layers, newLayer],
        },
      };
    });
  }, []);

  const removeLayer = useCallback((index: number) => {
    setConfig(prev => {
      const newLayers = prev.synthesis.layers.filter((_, i) => i !== index);
      // Ensure at least one layer remains
      if (newLayers.length === 0) {
        return prev;
      }
      return {
        ...prev,
        synthesis: {
          ...prev.synthesis,
          layers: newLayers,
        },
      };
    });
  }, []);

  const updateEnvelope = useCallback((envelope: SoundConfig['envelope']) => {
    setConfig(prev => ({
      ...prev,
      envelope,
    }));
  }, []);

  const updateFilter = useCallback((filter: SoundConfig['filter']) => {
    setConfig(prev => ({
      ...prev,
      filter,
    }));
  }, []);

  const updateLFO = useCallback((lfo: SoundConfig['lfo']) => {
    setConfig(prev => ({
      ...prev,
      lfo,
    }));
  }, []);

  const updateEffects = useCallback((effects: SoundConfig['effects']) => {
    setConfig(prev => ({
      ...prev,
      effects,
    }));
  }, []);

  const updateDuration = useCallback((duration: number) => {
    setConfig(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        duration: Math.max(0.1, Math.min(10, duration)),
      },
    }));
  }, []);

  const play = useCallback(async () => {
    if (playing) return;

    setPlaying(true);
    setError(null);

    try {
      const buffer = await synthesizeSound(config);
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();

      source.onended = () => {
        setPlaying(false);
        audioContext.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize sound');
      setPlaying(false);
    }
  }, [config, playing]);

  const exportWav = useCallback(async () => {
    if (exporting) return;

    setExporting(true);
    setError(null);

    try {
      const buffer = await synthesizeSound(config);
      const wavData = audioBufferToWav(buffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.metadata.name || 'sound'}.wav`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export sound');
    } finally {
      setExporting(false);
    }
  }, [config, exporting]);

  return {
    config,
    activeTab,
    playing,
    exporting,
    error,
    updateLayer,
    addLayer,
    removeLayer,
    updateEnvelope,
    updateFilter,
    updateLFO,
    updateEffects,
    updateDuration,
    setActiveTab,
    play,
    exportWav,
    setError,
  };
}
