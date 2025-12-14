/**
 * Property-based tests for discrete parameter updates
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import type { SoundConfig } from '../types/soundConfig';
import { DEFAULT_SOUND_CONFIG } from '../types/soundConfig';

/**
 * Helper to create a deep copy of a config
 */
function cloneConfig(config: SoundConfig): SoundConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Helper to update oscillator waveform in a config
 */
function updateOscillatorWaveform(
  config: SoundConfig,
  layerIndex: number,
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle'
): SoundConfig {
  const newConfig = cloneConfig(config);
  const layer = newConfig.synthesis.layers[layerIndex];
  if (layer?.type === 'oscillator' && layer.oscillator) {
    layer.oscillator.waveform = waveform;
  }
  return newConfig;
}

/**
 * Helper to update filter type in a config
 */
function updateFilterType(
  config: SoundConfig,
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass' | 'peaking'
): SoundConfig {
  const newConfig = cloneConfig(config);
  if (!newConfig.filter) {
    newConfig.filter = {
      type: filterType,
      frequency: 1000,
      q: 1,
    };
  } else {
    newConfig.filter.type = filterType;
  }
  return newConfig;
}

/**
 * Helper to update LFO waveform in a config
 */
function updateLFOWaveform(
  config: SoundConfig,
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'random'
): SoundConfig {
  const newConfig = cloneConfig(config);
  if (!newConfig.lfo) {
    newConfig.lfo = {
      waveform,
      frequency: 1,
      depth: 0.5,
      target: 'pitch',
    };
  } else {
    newConfig.lfo.waveform = waveform;
  }
  return newConfig;
}

/**
 * Helper to update LFO target in a config
 */
function updateLFOTarget(
  config: SoundConfig,
  target: 'pitch' | 'filter' | 'amplitude' | 'pan'
): SoundConfig {
  const newConfig = cloneConfig(config);
  if (!newConfig.lfo) {
    newConfig.lfo = {
      waveform: 'sine',
      frequency: 1,
      depth: 0.5,
      target,
    };
  } else {
    newConfig.lfo.target = target;
  }
  return newConfig;
}

/**
 * Helper to update noise type in a config
 */
function updateNoiseType(
  config: SoundConfig,
  layerIndex: number,
  noiseType: 'white' | 'pink' | 'brown'
): SoundConfig {
  const newConfig = cloneConfig(config);
  const layer = newConfig.synthesis.layers[layerIndex];
  if (layer?.type === 'noise' && layer.noise) {
    layer.noise.type = noiseType;
  }
  return newConfig;
}

/**
 * Helper to update metadata category in a config
 */
function updateMetadataCategory(
  config: SoundConfig,
  category: 'kick' | 'snare' | 'hihat' | 'tom' | 'perc' | 'bass' | 'lead' | 'pad' | 'fx' | 'other'
): SoundConfig {
  const newConfig = cloneConfig(config);
  newConfig.metadata.category = category;
  return newConfig;
}

describe('Discrete Parameter Updates', () => {
  /**
   * Feature: synth-ui, Property 13: Discrete Parameter Updates
   * For any discrete parameter selection (waveform, filter type, LFO target, noise type, category),
   * the configuration should be updated to reflect the selected value.
   * Validates: Requirements 3.1, 4.1, 6.2, 6.4, 10.1, 13.2
   */
  
  test('oscillator waveform selection should update configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('sine', 'square', 'sawtooth', 'triangle'),
        (waveform) => {
          // Start with a config that has an oscillator layer
          const baseConfig = cloneConfig(DEFAULT_SOUND_CONFIG);
          
          // Ensure we have an oscillator layer
          if (baseConfig.synthesis.layers[0]?.type !== 'oscillator') {
            baseConfig.synthesis.layers[0] = {
              type: 'oscillator',
              gain: 1,
              oscillator: {
                waveform: 'sine',
                frequency: 440,
                detune: 0,
              },
            };
          }
          
          // Update the waveform
          const updatedConfig = updateOscillatorWaveform(baseConfig, 0, waveform);
          
          // Verify the waveform was updated
          const layer = updatedConfig.synthesis.layers[0];
          expect(layer?.type).toBe('oscillator');
          expect(layer?.oscillator?.waveform).toBe(waveform);
          
          // Verify the rest of the config is unchanged
          expect(updatedConfig.envelope).toEqual(baseConfig.envelope);
          expect(updatedConfig.metadata).toEqual(baseConfig.metadata);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('filter type selection should update configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'peaking'),
        (filterType) => {
          const baseConfig = cloneConfig(DEFAULT_SOUND_CONFIG);
          
          // Update the filter type
          const updatedConfig = updateFilterType(baseConfig, filterType);
          
          // Verify the filter type was updated
          expect(updatedConfig.filter).toBeDefined();
          expect(updatedConfig.filter?.type).toBe(filterType);
          
          // Verify the rest of the config is unchanged
          expect(updatedConfig.synthesis).toEqual(baseConfig.synthesis);
          expect(updatedConfig.envelope).toEqual(baseConfig.envelope);
          expect(updatedConfig.metadata).toEqual(baseConfig.metadata);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('LFO waveform selection should update configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('sine', 'square', 'sawtooth', 'triangle', 'random'),
        (waveform) => {
          const baseConfig = cloneConfig(DEFAULT_SOUND_CONFIG);
          
          // Update the LFO waveform
          const updatedConfig = updateLFOWaveform(baseConfig, waveform);
          
          // Verify the LFO waveform was updated
          expect(updatedConfig.lfo).toBeDefined();
          expect(updatedConfig.lfo?.waveform).toBe(waveform);
          
          // Verify the rest of the config is unchanged
          expect(updatedConfig.synthesis).toEqual(baseConfig.synthesis);
          expect(updatedConfig.envelope).toEqual(baseConfig.envelope);
          expect(updatedConfig.metadata).toEqual(baseConfig.metadata);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('LFO target selection should update configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('pitch', 'filter', 'amplitude', 'pan'),
        (target) => {
          const baseConfig = cloneConfig(DEFAULT_SOUND_CONFIG);
          
          // Update the LFO target
          const updatedConfig = updateLFOTarget(baseConfig, target);
          
          // Verify the LFO target was updated
          expect(updatedConfig.lfo).toBeDefined();
          expect(updatedConfig.lfo?.target).toBe(target);
          
          // Verify the rest of the config is unchanged
          expect(updatedConfig.synthesis).toEqual(baseConfig.synthesis);
          expect(updatedConfig.envelope).toEqual(baseConfig.envelope);
          expect(updatedConfig.metadata).toEqual(baseConfig.metadata);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('noise type selection should update configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('white', 'pink', 'brown'),
        (noiseType) => {
          // Start with a config that has a noise layer
          const baseConfig = cloneConfig(DEFAULT_SOUND_CONFIG);
          baseConfig.synthesis.layers[0] = {
            type: 'noise',
            gain: 1,
            noise: {
              type: 'white',
            },
          };
          
          // Update the noise type
          const updatedConfig = updateNoiseType(baseConfig, 0, noiseType);
          
          // Verify the noise type was updated
          const layer = updatedConfig.synthesis.layers[0];
          expect(layer?.type).toBe('noise');
          expect(layer?.noise?.type).toBe(noiseType);
          
          // Verify the rest of the config is unchanged
          expect(updatedConfig.envelope).toEqual(baseConfig.envelope);
          expect(updatedConfig.metadata).toEqual(baseConfig.metadata);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('metadata category selection should update configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('kick', 'snare', 'hihat', 'tom', 'perc', 'bass', 'lead', 'pad', 'fx', 'other'),
        (category) => {
          const baseConfig = cloneConfig(DEFAULT_SOUND_CONFIG);
          
          // Update the metadata category
          const updatedConfig = updateMetadataCategory(baseConfig, category);
          
          // Verify the category was updated
          expect(updatedConfig.metadata.category).toBe(category);
          
          // Verify the rest of the config is unchanged
          expect(updatedConfig.synthesis).toEqual(baseConfig.synthesis);
          expect(updatedConfig.envelope).toEqual(baseConfig.envelope);
          expect(updatedConfig.metadata.name).toBe(baseConfig.metadata.name);
          expect(updatedConfig.metadata.description).toBe(baseConfig.metadata.description);
          expect(updatedConfig.metadata.tags).toEqual(baseConfig.metadata.tags);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multiple discrete parameter updates should all be reflected in configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('sine', 'square', 'sawtooth', 'triangle'),
        fc.constantFrom('lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'peaking'),
        fc.constantFrom('kick', 'snare', 'hihat', 'tom', 'perc', 'bass', 'lead', 'pad', 'fx', 'other'),
        (waveform, filterType, category) => {
          let config = cloneConfig(DEFAULT_SOUND_CONFIG);
          
          // Ensure we have an oscillator layer
          if (config.synthesis.layers[0]?.type !== 'oscillator') {
            config.synthesis.layers[0] = {
              type: 'oscillator',
              gain: 1,
              oscillator: {
                waveform: 'sine',
                frequency: 440,
                detune: 0,
              },
            };
          }
          
          // Apply multiple updates
          config = updateOscillatorWaveform(config, 0, waveform);
          config = updateFilterType(config, filterType);
          config = updateMetadataCategory(config, category);
          
          // Verify all updates were applied
          expect(config.synthesis.layers[0]?.oscillator?.waveform).toBe(waveform);
          expect(config.filter?.type).toBe(filterType);
          expect(config.metadata.category).toBe(category);
        }
      ),
      { numRuns: 100 }
    );
  });
});
