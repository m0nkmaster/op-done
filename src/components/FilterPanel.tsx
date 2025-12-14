import { Box, Stack, Divider } from '@mui/material';
import { Knob } from './Knob';
import { SegmentedButton } from './SegmentedButton';
import { Switch } from './Switch';
import type { SoundConfig } from '../types/soundConfig';

export interface FilterPanelProps {
  filter: SoundConfig['filter'];
  onUpdate: (filter: SoundConfig['filter']) => void;
}

const FILTER_TYPES: Array<{ value: NonNullable<SoundConfig['filter']>['type']; label: string }> = [
  { value: 'lowpass', label: 'LP' },
  { value: 'highpass', label: 'HP' },
  { value: 'bandpass', label: 'BP' },
  { value: 'notch', label: 'Notch' },
  { value: 'allpass', label: 'AP' },
  { value: 'peaking', label: 'Peak' },
];

export function FilterPanel({ filter, onUpdate }: FilterPanelProps) {
  const enabled = filter !== undefined;

  const toggleFilter = (value: boolean) => {
    if (value) {
      onUpdate({
        type: 'lowpass',
        frequency: 1000,
        q: 1,
      });
    } else {
      onUpdate(undefined);
    }
  };

  const updateFilter = <K extends keyof NonNullable<SoundConfig['filter']>>(
    field: K,
    value: NonNullable<SoundConfig['filter']>[K]
  ) => {
    if (!filter) return;
    onUpdate({ ...filter, [field]: value });
  };

  const toggleEnvelope = (value: boolean) => {
    if (!filter) return;
    if (value) {
      onUpdate({
        ...filter,
        envelope: {
          amount: 1000,
          attack: 0.01,
          decay: 0.1,
          sustain: 0.5,
          release: 0.3,
        },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { envelope, ...rest } = filter;
      onUpdate(rest);
    }
  };

  const updateEnvelope = <K extends keyof NonNullable<NonNullable<SoundConfig['filter']>['envelope']>>(
    field: K,
    value: NonNullable<NonNullable<SoundConfig['filter']>['envelope']>[K]
  ) => {
    if (!filter?.envelope) return;
    onUpdate({
      ...filter,
      envelope: { ...filter.envelope, [field]: value },
    });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Switch
          label="Enable"
          value={enabled}
          onChange={toggleFilter}
        />
      </Box>

      {enabled && filter && (
        <>
          <SegmentedButton
            label="Type"
            value={filter.type}
            options={FILTER_TYPES}
            onChange={(value) => updateFilter('type', value)}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Knob
              label="Cutoff"
              value={filter.frequency}
              min={20}
              max={20000}
              step={1}
              unit=" Hz"
              logarithmic
              onChange={(value) => updateFilter('frequency', value)}
            />
            <Knob
              label="Resonance"
              value={filter.q}
              min={0.0001}
              max={100}
              step={0.01}
              unit=""
              logarithmic
              onChange={(value) => updateFilter('q', value)}
            />
            {filter.type === 'peaking' && (
              <Knob
                label="Gain"
                value={filter.gain ?? 0}
                min={-40}
                max={40}
                step={0.1}
                unit=" dB"
                onChange={(value) => updateFilter('gain', value)}
              />
            )}
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Switch
              label="Envelope"
              value={filter.envelope !== undefined}
              onChange={toggleEnvelope}
            />
          </Box>

          {filter.envelope && (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Knob
                  label="Amount"
                  value={filter.envelope.amount}
                  min={-10000}
                  max={10000}
                  step={10}
                  unit=" Hz"
                  onChange={(value) => updateEnvelope('amount', value)}
                />
                <Knob
                  label="Attack"
                  value={filter.envelope.attack}
                  min={0.001}
                  max={5}
                  step={0.001}
                  unit=" s"
                  onChange={(value) => updateEnvelope('attack', value)}
                />
                <Knob
                  label="Decay"
                  value={filter.envelope.decay}
                  min={0.001}
                  max={5}
                  step={0.001}
                  unit=" s"
                  onChange={(value) => updateEnvelope('decay', value)}
                />
                <Knob
                  label="Sustain"
                  value={filter.envelope.sustain}
                  min={0}
                  max={1}
                  step={0.01}
                  unit=""
                  onChange={(value) => updateEnvelope('sustain', value)}
                />
                <Knob
                  label="Release"
                  value={filter.envelope.release}
                  min={0.001}
                  max={5}
                  step={0.001}
                  unit=" s"
                  onChange={(value) => updateEnvelope('release', value)}
                />
              </Box>
            </>
          )}
        </>
      )}
    </Stack>
  );
}
