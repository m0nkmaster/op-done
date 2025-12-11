import { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Stack, Typography, Button, Alert, CircularProgress, IconButton, Collapse } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import { LayerManager } from '../components/LayerManager';
import { PresetManager } from '../components/PresetManager';
import { Knob } from '../components/Knob';
import { GlobalEnvelopeControls } from '../components/GlobalEnvelopeControls';
import { FilterPanel } from '../components/FilterPanel';
import { LFOPanel } from '../components/LFOPanel';
import { EffectsPanel } from '../components/EffectsPanel';
import { MetadataPanel } from '../components/MetadataPanel';
import { JSONEditor } from '../components/JSONEditor';
import { ValidationDisplay } from '../components/ValidationDisplay';
import { useDefaultPreset } from '../hooks/useDefaultPreset';
import { synthesizeSound } from '../audio/synthesizer';
import { validateSoundConfigJSON, type ValidationError } from '../utils/validation';
import type { SoundConfig } from '../types/soundConfig';

export function SynthesizerUI() {
  const defaultPreset = useDefaultPreset();
  const [config, setConfig] = useState<SoundConfig>(defaultPreset);
  const [jsonValue, setJsonValue] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [showJSONEditor, setShowJSONEditor] = useState(false);
  const isUpdatingFromUI = useRef(false);
  const isUpdatingFromJSON = useRef(false);

  // Initialize JSON value from config
  useEffect(() => {
    setJsonValue(JSON.stringify(config, null, 2));
  }, []);

  // Synchronize JSON when config changes (UI to JSON)
  useEffect(() => {
    if (!isUpdatingFromJSON.current) {
      isUpdatingFromUI.current = true;
      setJsonValue(JSON.stringify(config, null, 2));
      setTimeout(() => {
        isUpdatingFromUI.current = false;
      }, 0);
    }
  }, [config]);

  // Handle JSON changes (JSON to UI)
  const handleJSONChange = (newJsonValue: string) => {
    setJsonValue(newJsonValue);

    // Try to parse and validate
    const validationResult = validateSoundConfigJSON(newJsonValue);

    // Update validation errors and warnings
    setValidationErrors(validationResult.errors);
    setValidationWarnings(validationResult.warnings);

    if (validationResult.valid && !isUpdatingFromUI.current) {
      try {
        const parsedConfig = JSON.parse(newJsonValue) as SoundConfig;
        isUpdatingFromJSON.current = true;
        setConfig(parsedConfig);
        setError(null);
        setTimeout(() => {
          isUpdatingFromJSON.current = false;
        }, 0);
      } catch (err) {
        // Parsing failed, don't update config
        console.error('Failed to parse JSON:', err);
      }
    } else if (!validationResult.valid) {
      // Clear validation state when JSON becomes valid again
      if (validationResult.errors.length === 0) {
        setValidationErrors([]);
      }
    }
  };

  // Update layers
  const updateLayers = (layers: SoundConfig['synthesis']['layers']) => {
    setConfig({
      ...config,
      synthesis: { ...config.synthesis, layers },
    });
  };

  // Update duration
  const updateDuration = (duration: number) => {
    setConfig({
      ...config,
      timing: { ...config.timing, duration },
    });
  };

  // Update envelope
  const updateEnvelope = (envelope: SoundConfig['envelope']) => {
    setConfig({ ...config, envelope });
  };

  // Update filter
  const updateFilter = (filter: SoundConfig['filter']) => {
    setConfig({ ...config, filter });
  };

  // Update LFO
  const updateLFO = (lfo: SoundConfig['lfo']) => {
    setConfig({ ...config, lfo });
  };

  // Update effects
  const updateEffects = (effects: SoundConfig['effects']) => {
    setConfig({ ...config, effects });
  };

  // Update metadata
  const updateMetadata = (metadata: SoundConfig['metadata']) => {
    setConfig({ ...config, metadata });
  };

  // Load preset
  const handleLoadPreset = (loadedConfig: SoundConfig) => {
    setConfig(loadedConfig);
  };

  // Play sound
  const handlePlay = async () => {
    setPlaying(true);
    setError(null);

    try {
      const buffer = await synthesizeSound(config);
      const ctx = new AudioContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => {
        setPlaying(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synthesis failed');
      setPlaying(false);
    }
  };

  // Export sound
  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      // Synthesize the sound
      const buffer = await synthesizeSound(config);

      // Convert AudioBuffer to WAV
      const wav = audioBufferToWav(buffer);
      const blob = new Blob([wav], { type: 'audio/wav' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.metadata.name || 'sound'}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const data = new Float32Array(buffer.length * numChannels);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        data[i * numChannels + channel] = channelData[i];
      }
    }

    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Synthesizer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professional sound design interface
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowJSONEditor(!showJSONEditor)}
            color={showJSONEditor ? 'primary' : 'default'}
            sx={{ mt: 1 }}
          >
            <CodeIcon />
          </IconButton>
        </Box>

        {/* JSON Editor Panel */}
        <Collapse in={showJSONEditor}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
              JSON Configuration
            </Typography>
            
            <ValidationDisplay
              errors={validationErrors}
              warnings={validationWarnings}
            />
            
            <Box sx={{ mt: validationErrors.length > 0 || validationWarnings.length > 0 ? 2 : 0 }}>
              <JSONEditor
                value={jsonValue}
                onChange={handleJSONChange}
                height="400px"
              />
            </Box>
          </Paper>
        </Collapse>

        {/* Main Layout */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          {/* Left Column */}
          <Stack spacing={3}>
            {/* Preset Manager */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                Presets
              </Typography>
              <PresetManager
                currentConfig={config}
                onLoadPreset={handleLoadPreset}
              />
            </Paper>

            {/* Layer Manager */}
            <Paper sx={{ p: 3 }}>
              <LayerManager
                layers={config.synthesis.layers}
                onUpdate={updateLayers}
              />
            </Paper>

            {/* Global Envelope */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                Global Envelope
              </Typography>
              <GlobalEnvelopeControls
                envelope={config.envelope}
                duration={config.timing.duration}
                onUpdate={updateEnvelope}
              />
            </Paper>
          </Stack>

          {/* Right Column */}
          <Stack spacing={3}>
            {/* Playback Controls */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                Playback
              </Typography>
              
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={handlePlay}
                    disabled={playing || exporting}
                    sx={{ minWidth: 120 }}
                  >
                    {playing ? 'Playing...' : 'Play'}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleExport}
                    disabled={playing || exporting}
                    sx={{ minWidth: 120 }}
                  >
                    {exporting ? 'Exporting...' : 'Export'}
                  </Button>
                  
                  <Knob
                    label="Duration"
                    value={config.timing.duration}
                    min={0.1}
                    max={10}
                    step={0.1}
                    unit=" s"
                    onChange={updateDuration}
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Filter */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                Filter
              </Typography>
              <FilterPanel
                filter={config.filter}
                onUpdate={updateFilter}
              />
            </Paper>

            {/* LFO */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                LFO
              </Typography>
              <LFOPanel
                lfo={config.lfo}
                onUpdate={updateLFO}
              />
            </Paper>

            {/* Effects */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                Effects
              </Typography>
              <EffectsPanel
                effects={config.effects}
                onUpdate={updateEffects}
              />
            </Paper>

            {/* Metadata */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>
                Metadata
              </Typography>
              <MetadataPanel
                metadata={config.metadata}
                onUpdate={updateMetadata}
              />
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
