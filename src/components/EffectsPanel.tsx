import { Box, Stack, Collapse, Divider } from '@mui/material';
import { useState } from 'react';
import { Switch } from './Switch';
import { Knob } from './Knob';
import { SegmentedButton } from './SegmentedButton';
import type { SoundConfig } from '../types/soundConfig';

interface EffectsPanelProps {
  effects: SoundConfig['effects'];
  onUpdate: (effects: SoundConfig['effects']) => void;
}

export function EffectsPanel({ effects, onUpdate }: EffectsPanelProps) {
  const [reverbOpen, setReverbOpen] = useState(!!effects.reverb);
  const [delayOpen, setDelayOpen] = useState(!!effects.delay);
  const [distortionOpen, setDistortionOpen] = useState(!!effects.distortion);
  const [compressorOpen, setCompressorOpen] = useState(!!effects.compressor);
  const [gateOpen, setGateOpen] = useState(!!effects.gate);

  // Reverb handlers
  const toggleReverb = (enabled: boolean) => {
    setReverbOpen(enabled);
    if (enabled) {
      onUpdate({
        ...effects,
        reverb: effects.reverb || { decay: 2, damping: 0.5, mix: 0.3 },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reverb, ...rest } = effects;
      onUpdate(rest);
    }
  };

  const updateReverb = (updates: Partial<NonNullable<SoundConfig['effects']['reverb']>>) => {
    if (effects.reverb) {
      onUpdate({
        ...effects,
        reverb: { ...effects.reverb, ...updates },
      });
    }
  };

  // Delay handlers
  const toggleDelay = (enabled: boolean) => {
    setDelayOpen(enabled);
    if (enabled) {
      onUpdate({
        ...effects,
        delay: effects.delay || { time: 0.5, feedback: 0.3, mix: 0.3 },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { delay, ...rest } = effects;
      onUpdate(rest);
    }
  };

  const updateDelay = (updates: Partial<NonNullable<SoundConfig['effects']['delay']>>) => {
    if (effects.delay) {
      onUpdate({
        ...effects,
        delay: { ...effects.delay, ...updates },
      });
    }
  };

  // Distortion handlers
  const toggleDistortion = (enabled: boolean) => {
    setDistortionOpen(enabled);
    if (enabled) {
      onUpdate({
        ...effects,
        distortion: effects.distortion || { type: 'soft', amount: 0.5, mix: 0.5 },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { distortion, ...rest } = effects;
      onUpdate(rest);
    }
  };

  const updateDistortion = (updates: Partial<NonNullable<SoundConfig['effects']['distortion']>>) => {
    if (effects.distortion) {
      onUpdate({
        ...effects,
        distortion: { ...effects.distortion, ...updates },
      });
    }
  };

  // Compressor handlers
  const toggleCompressor = (enabled: boolean) => {
    setCompressorOpen(enabled);
    if (enabled) {
      onUpdate({
        ...effects,
        compressor: effects.compressor || {
          threshold: -24,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
          knee: 30,
        },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { compressor, ...rest } = effects;
      onUpdate(rest);
    }
  };

  const updateCompressor = (updates: Partial<NonNullable<SoundConfig['effects']['compressor']>>) => {
    if (effects.compressor) {
      onUpdate({
        ...effects,
        compressor: { ...effects.compressor, ...updates },
      });
    }
  };

  // Gate handlers
  const toggleGate = (enabled: boolean) => {
    setGateOpen(enabled);
    if (enabled) {
      onUpdate({
        ...effects,
        gate: effects.gate || { attack: 0.01, hold: 0.1, release: 0.1 },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { gate, ...rest } = effects;
      onUpdate(rest);
    }
  };

  const updateGate = (updates: Partial<NonNullable<SoundConfig['effects']['gate']>>) => {
    if (effects.gate) {
      onUpdate({
        ...effects,
        gate: { ...effects.gate, ...updates },
      });
    }
  };

  return (
    <Stack spacing={2}>
      {/* Reverb */}
      <Box>
        <Switch
          label="Reverb"
          value={reverbOpen}
          onChange={toggleReverb}
        />
        <Collapse in={reverbOpen}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {effects.reverb && (
              <>
                <Knob
                  label="Decay"
                  value={effects.reverb.decay}
                  min={0}
                  max={10}
                  step={0.1}
                  unit=" s"
                  onChange={(decay) => updateReverb({ decay })}
                />
                <Knob
                  label="Damping"
                  value={effects.reverb.damping}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(damping) => updateReverb({ damping })}
                />
                <Knob
                  label="Mix"
                  value={effects.reverb.mix}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(mix) => updateReverb({ mix })}
                />
              </>
            )}
          </Box>
        </Collapse>
      </Box>

      <Divider />

      {/* Delay */}
      <Box>
        <Switch
          label="Delay"
          value={delayOpen}
          onChange={toggleDelay}
        />
        <Collapse in={delayOpen}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {effects.delay && (
              <>
                <Knob
                  label="Time"
                  value={effects.delay.time}
                  min={0}
                  max={2}
                  step={0.01}
                  unit=" s"
                  onChange={(time) => updateDelay({ time })}
                />
                <Knob
                  label="Feedback"
                  value={effects.delay.feedback}
                  min={0}
                  max={0.9}
                  step={0.01}
                  onChange={(feedback) => updateDelay({ feedback })}
                />
                <Knob
                  label="Mix"
                  value={effects.delay.mix}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(mix) => updateDelay({ mix })}
                />
              </>
            )}
          </Box>
        </Collapse>
      </Box>

      <Divider />

      {/* Distortion */}
      <Box>
        <Switch
          label="Distortion"
          value={distortionOpen}
          onChange={toggleDistortion}
        />
        <Collapse in={distortionOpen}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {effects.distortion && (
              <>
                <SegmentedButton
                  label="Type"
                  value={effects.distortion.type}
                  options={[
                    { value: 'soft', label: 'Soft' },
                    { value: 'hard', label: 'Hard' },
                    { value: 'fuzz', label: 'Fuzz' },
                    { value: 'bitcrush', label: 'Bit' },
                    { value: 'waveshaper', label: 'Wave' },
                  ]}
                  onChange={(type) => updateDistortion({ type })}
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Knob
                    label="Amount"
                    value={effects.distortion.amount}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(amount) => updateDistortion({ amount })}
                  />
                  <Knob
                    label="Mix"
                    value={effects.distortion.mix}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(mix) => updateDistortion({ mix })}
                  />
                </Box>
              </>
            )}
          </Stack>
        </Collapse>
      </Box>

      <Divider />

      {/* Compressor */}
      <Box>
        <Switch
          label="Compressor"
          value={compressorOpen}
          onChange={toggleCompressor}
        />
        <Collapse in={compressorOpen}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {effects.compressor && (
              <>
                <Knob
                  label="Threshold"
                  value={effects.compressor.threshold}
                  min={-60}
                  max={0}
                  step={1}
                  unit=" dB"
                  onChange={(threshold) => updateCompressor({ threshold })}
                />
                <Knob
                  label="Ratio"
                  value={effects.compressor.ratio}
                  min={1}
                  max={20}
                  step={0.1}
                  unit=":1"
                  onChange={(ratio) => updateCompressor({ ratio })}
                />
                <Knob
                  label="Attack"
                  value={effects.compressor.attack}
                  min={0.001}
                  max={1}
                  step={0.001}
                  unit=" s"
                  onChange={(attack) => updateCompressor({ attack })}
                />
                <Knob
                  label="Release"
                  value={effects.compressor.release}
                  min={0.01}
                  max={2}
                  step={0.01}
                  unit=" s"
                  onChange={(release) => updateCompressor({ release })}
                />
                <Knob
                  label="Knee"
                  value={effects.compressor.knee}
                  min={0}
                  max={40}
                  step={1}
                  unit=" dB"
                  onChange={(knee) => updateCompressor({ knee })}
                />
              </>
            )}
          </Box>
        </Collapse>
      </Box>

      <Divider />

      {/* Gate */}
      <Box>
        <Switch
          label="Gate"
          value={gateOpen}
          onChange={toggleGate}
        />
        <Collapse in={gateOpen}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {effects.gate && (
              <>
                <Knob
                  label="Attack"
                  value={effects.gate.attack}
                  min={0.001}
                  max={1}
                  step={0.001}
                  unit=" s"
                  onChange={(attack) => updateGate({ attack })}
                />
                <Knob
                  label="Hold"
                  value={effects.gate.hold}
                  min={0}
                  max={2}
                  step={0.01}
                  unit=" s"
                  onChange={(hold) => updateGate({ hold })}
                />
                <Knob
                  label="Release"
                  value={effects.gate.release}
                  min={0.001}
                  max={2}
                  step={0.001}
                  unit=" s"
                  onChange={(release) => updateGate({ release })}
                />
              </>
            )}
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );
}
