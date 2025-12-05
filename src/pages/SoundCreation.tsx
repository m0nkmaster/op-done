import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { generateSoundConfig } from '../services/openai';
import { synthesizeSound } from '../audio/synthesizer';
import type { SoundConfig } from '../types/soundConfig';

export function SoundCreation() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<SoundConfig | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const handleGenerate = async () => {
    if (!description) {
      setError('Description required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const generatedConfig = await generateSoundConfig(description);
      setConfig(generatedConfig);
      
      const buffer = await synthesizeSound(generatedConfig);
      setAudioBuffer(buffer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!audioBuffer) return;
    
    const ctx = new AudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };

  const handleDownload = () => {
    if (!audioBuffer || !config) return;
    
    const wav = audioBufferToWav(audioBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.metadata.name}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>AI Sound Creation</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Describe the sound"
          placeholder="e.g., Deep 808 kick with subtle distortion and reverb tail"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={loading || !description}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Sound'}
        </Button>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {config && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Generated Configuration</Typography>
          <Box sx={{ mb: 2, maxHeight: 400, overflow: 'auto', bgcolor: '#1e1e1e', p: 2, borderRadius: 1 }}>
            <pre style={{ margin: 0, color: '#d4d4d4', fontSize: 12 }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handlePlay} disabled={!audioBuffer}>
              Play
            </Button>
            <Button variant="outlined" onClick={handleDownload} disabled={!audioBuffer}>
              Download WAV
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}
