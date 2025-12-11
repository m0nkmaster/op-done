import { describe, test, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { EffectsPanel } from './EffectsPanel';
import type { SoundConfig } from '../types/soundConfig';

describe('EffectsPanel', () => {
  test('should render without errors with empty effects', () => {
    const effects: SoundConfig['effects'] = {};
    const onUpdate = () => {};

    const html = renderToString(
      createElement(EffectsPanel, { effects, onUpdate })
    );

    expect(html).toBeTruthy();
  });

  test('should render with all effects enabled', () => {
    const effects: SoundConfig['effects'] = {
      reverb: { decay: 2, damping: 0.5, mix: 0.3 },
      delay: { time: 0.5, feedback: 0.3, mix: 0.3 },
      distortion: { type: 'soft', amount: 0.5, mix: 0.5 },
      compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 30 },
      gate: { attack: 0.01, hold: 0.1, release: 0.1 },
    };
    const onUpdate = () => {};

    const html = renderToString(
      createElement(EffectsPanel, { effects, onUpdate })
    );

    expect(html).toBeTruthy();
    expect(html).toContain('Reverb');
    expect(html).toContain('Delay');
    expect(html).toContain('Distortion');
    expect(html).toContain('Compressor');
    expect(html).toContain('Gate');
  });
});
