import { Box, Stack } from '@mui/material';
import { Knob } from './Knob';
import { EnvelopeVisualizer } from './EnvelopeVisualizer';
import type { SoundConfig } from '../types/soundConfig';

export interface GlobalEnvelopeControlsProps {
  envelope: SoundConfig['envelope'];
  duration: number;
  onUpdate: (envelope: SoundConfig['envelope']) => void;
}

export function GlobalEnvelopeControls({
  envelope,
  duration,
  onUpdate,
}: GlobalEnvelopeControlsProps) {
  const updateEnvelope = (field: keyof SoundConfig['envelope'], value: number) => {
    onUpdate({ ...envelope, [field]: value });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Knob
          label="Attack"
          value={envelope.attack}
          min={0.001}
          max={5}
          step={0.001}
          unit=" s"
          onChange={(value) => updateEnvelope('attack', value)}
        />
        <Knob
          label="Decay"
          value={envelope.decay}
          min={0.001}
          max={5}
          step={0.001}
          unit=" s"
          onChange={(value) => updateEnvelope('decay', value)}
        />
        <Knob
          label="Sustain"
          value={envelope.sustain}
          min={0}
          max={1}
          step={0.01}
          unit=""
          onChange={(value) => updateEnvelope('sustain', value)}
        />
        <Knob
          label="Release"
          value={envelope.release}
          min={0.001}
          max={10}
          step={0.001}
          unit=" s"
          onChange={(value) => updateEnvelope('release', value)}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <EnvelopeVisualizer
          attack={envelope.attack}
          decay={envelope.decay}
          sustain={envelope.sustain}
          release={envelope.release}
          duration={duration}
        />
      </Box>
    </Stack>
  );
}
