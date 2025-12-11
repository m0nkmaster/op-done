import { Box, Stack } from '@mui/material';
import { Knob } from './Knob';
import { SegmentedButton } from './SegmentedButton';
import { Switch } from './Switch';
import type { SoundConfig } from '../types/soundConfig';

export interface LFOPanelProps {
  lfo: SoundConfig['lfo'];
  onUpdate: (lfo: SoundConfig['lfo']) => void;
}

const LFO_WAVEFORMS: Array<{ value: NonNullable<SoundConfig['lfo']>['waveform']; label: string }> = [
  { value: 'sine', label: 'Sine' },
  { value: 'square', label: 'Square' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'triangle', label: 'Tri' },
  { value: 'random', label: 'Rand' },
];

const LFO_TARGETS: Array<{ value: NonNullable<SoundConfig['lfo']>['target']; label: string }> = [
  { value: 'pitch', label: 'Pitch' },
  { value: 'filter', label: 'Filter' },
  { value: 'amplitude', label: 'Amp' },
  { value: 'pan', label: 'Pan' },
];

export function LFOPanel({ lfo, onUpdate }: LFOPanelProps) {
  const enabled = lfo !== undefined;

  const toggleLFO = (value: boolean) => {
    if (value) {
      onUpdate({
        waveform: 'sine',
        frequency: 5,
        depth: 0.5,
        target: 'pitch',
        delay: 0,
        fade: 0,
      });
    } else {
      onUpdate(undefined);
    }
  };

  const updateLFO = <K extends keyof NonNullable<SoundConfig['lfo']>>(
    field: K,
    value: NonNullable<SoundConfig['lfo']>[K]
  ) => {
    if (!lfo) return;
    onUpdate({ ...lfo, [field]: value });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Switch
          label="Enable"
          value={enabled}
          onChange={toggleLFO}
        />
      </Box>

      {enabled && lfo && (
        <>
          <SegmentedButton
            label="Waveform"
            value={lfo.waveform}
            options={LFO_WAVEFORMS}
            onChange={(value) => updateLFO('waveform', value)}
          />

          <SegmentedButton
            label="Target"
            value={lfo.target}
            options={LFO_TARGETS}
            onChange={(value) => updateLFO('target', value)}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Knob
              label="Frequency"
              value={lfo.frequency}
              min={0.01}
              max={20}
              step={0.01}
              unit=" Hz"
              onChange={(value) => updateLFO('frequency', value)}
            />
            <Knob
              label="Depth"
              value={lfo.depth}
              min={0}
              max={1}
              step={0.01}
              unit=""
              onChange={(value) => updateLFO('depth', value)}
            />
            <Knob
              label="Delay"
              value={lfo.delay ?? 0}
              min={0}
              max={5}
              step={0.01}
              unit=" s"
              onChange={(value) => updateLFO('delay', value)}
            />
            <Knob
              label="Fade"
              value={lfo.fade ?? 0}
              min={0}
              max={5}
              step={0.01}
              unit=" s"
              onChange={(value) => updateLFO('fade', value)}
            />
          </Box>
        </>
      )}
    </Stack>
  );
}
