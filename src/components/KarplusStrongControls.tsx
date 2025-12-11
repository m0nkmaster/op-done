import { Box, Stack } from '@mui/material';
import { Knob } from './Knob';
import type { SoundConfig } from '../types/soundConfig';

type Layer = SoundConfig['synthesis']['layers'][0];
type KarplusConfig = NonNullable<Layer['karplus']>;

export interface KarplusStrongControlsProps {
  layer: Layer & { type: 'karplus-strong'; karplus: KarplusConfig };
  onChange: (layer: Layer & { type: 'karplus-strong'; karplus: KarplusConfig }) => void;
}

export function KarplusStrongControls({ layer, onChange }: KarplusStrongControlsProps) {
  const karplus = layer.karplus!;

  const updateKarplus = (updates: Partial<typeof karplus>) => {
    onChange({
      ...layer,
      karplus: { ...karplus, ...updates },
    });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Knob
          label="Frequency"
          value={karplus.frequency}
          min={20}
          max={2000}
          step={1}
          unit=" Hz"
          logarithmic
          onChange={(frequency) => updateKarplus({ frequency })}
        />
        <Knob
          label="Damping"
          value={karplus.damping}
          min={0}
          max={1}
          step={0.01}
          onChange={(damping) => updateKarplus({ damping })}
        />
        <Knob
          label="Pluck Loc"
          value={karplus.pluckLocation ?? 0.5}
          min={0}
          max={1}
          step={0.01}
          onChange={(pluckLocation) => updateKarplus({ pluckLocation })}
        />
      </Box>
    </Stack>
  );
}
