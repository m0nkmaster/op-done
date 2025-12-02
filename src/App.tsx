import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  Checkbox,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import theme from './theme';
import { ThemeProvider } from '@mui/material/styles';
import { useSlices } from './hooks/useSlices';
import type { Slice, DrumMetadata } from './types';
import { buildDrumPack } from './audio/pack';

function formatDuration(value: number): string {
  if (!Number.isFinite(value)) return '0.0s';
  return `${value.toFixed(2)}s`;
}

function WaveformPreview({
  file,
  height = 60,
  width = 60,
  color = '#cfcfcf'
}: {
  file: File;
  height?: number;
  width?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !file) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ac = new AudioContext();
    file
      .arrayBuffer()
      .then((buf) => ac.decodeAudioData(buf.slice(0)))
      .then((audioBuffer) => {
        if (cancelled || !canvasRef.current) return;
        const w = width;
        const h = height;
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        const data = audioBuffer.getChannelData(0);
        const buckets = Math.min(32, Math.max(8, Math.floor(w / 2)));
        const samplesPerBucket = Math.max(1, Math.floor(data.length / buckets));
        const mid = h / 2;
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = color;
        const barWidth = Math.max(1, Math.floor(w / buckets) - 1);
        for (let b = 0; b < buckets; b++) {
          const start = b * samplesPerBucket;
          const end = Math.min(start + samplesPerBucket, data.length);
          let min = 1;
          let max = -1;
          for (let i = start; i < end; i++) {
            const v = data[i];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const amp = Math.max(Math.abs(min), Math.abs(max));
          const barHeight = Math.max(1, amp * (h * 0.45));
          const x = b * (barWidth + 1);
          ctx.fillRect(x, mid - barHeight, barWidth, barHeight * 2);
        }
      })
      .catch(() => {})
      .finally(() => {
        ac.close().catch(() => {});
      });

    return () => {
      cancelled = true;
      ac.close().catch(() => {});
    };
  }, [file, height, width, color]);

  return <canvas ref={canvasRef} style={{ width, height, borderRadius: 4 }} />;
}

function SliceList({
  slices,
  onRemove,
  meta,
  onMetaChange,
  onPlay,
  playingId
}: {
  slices: Slice[];
  onRemove: (id: string) => void;
  meta: { volume: number[]; pitch: number[]; reverse: number[]; playmode: number[] };
  onMetaChange: (index: number, key: 'volume' | 'pitch' | 'reverse' | 'playmode', value: number) => void;
  onPlay: (slice: Slice) => void;
  playingId: string | null;
}) {
  if (!slices.length) {
    return (
      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        Drop audio files to start building your pack.
      </Paper>
    );
  }

  return (
    <Stack spacing={0.75}>
      {slices.map((slice, idx) => (
        <Paper
          key={slice.id}
          variant="outlined"
          sx={{ p: 0.75, display: 'grid', gap: 0.4 }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <WaveformPreview file={slice.file} height={32} width={32} />
              <Typography variant="body2" fontWeight={700} noWrap title={slice.name} sx={{ minWidth: 0 }}>
                {slice.name}
              </Typography>
              <Chip
                label={slice.status === 'ready' ? 'Ready' : slice.status === 'processing' ? 'Proc' : 'Pending'}
                size="small"
                color={slice.status === 'ready' ? 'success' : slice.status === 'processing' ? 'warning' : 'default'}
                variant="outlined"
              />
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                size="small"
                aria-label="Preview slice"
                color={playingId === slice.id ? 'primary' : 'default'}
                onClick={() => onPlay(slice)}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Remove slice" onClick={() => onRemove(slice.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
              <Checkbox
                size="small"
                checked={(meta.reverse[idx] ?? 8192) === 0}
                onChange={(e) => onMetaChange(idx, 'reverse', e.target.checked ? 0 : 8192)}
                inputProps={{ 'aria-label': 'Reverse' }}
              />
              <TextField
                size="small"
                label="Vol"
                type="number"
                inputProps={{ min: 0, max: 16383, style: { width: 64, fontSize: 12 } }}
                value={meta.volume[idx] ?? 8192}
                onChange={(e) => onMetaChange(idx, 'volume', Number(e.target.value))}
              />
              <TextField
                size="small"
                label="Pitch"
                type="number"
                inputProps={{ style: { width: 64, fontSize: 12 } }}
                value={meta.pitch[idx] ?? 0}
                onChange={(e) => onMetaChange(idx, 'pitch', Number(e.target.value))}
              />
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {formatDuration(slice.duration)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function App() {
  const {
    slices,
    addFiles,
    removeSlice,
    isProcessing,
    error,
    normalizeMode,
    silenceThreshold,
    maxDuration,
    totalDuration,
    setNormalizeMode,
    setSilenceThreshold
  } = useSlices();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DrumMetadata>({
    name: 'op-done',
    octave: 0,
    drumVersion: 3,
    pitch: new Array(24).fill(0),
    playmode: new Array(24).fill(8192),
    reverse: new Array(24).fill(8192),
    volume: new Array(24).fill(8192)
  });

  const overDuration = useMemo(() => totalDuration > maxDuration, [totalDuration, maxDuration]);
  const disabledExport = !slices.length || overDuration || isProcessing || slices.some((s) => s.status !== 'ready');

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await addFiles(files);
      event.target.value = '';
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      await addFiles(event.dataTransfer.files);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePlay = async (slice: Slice) => {
    try {
      if (playingId === slice.id) {
        stopAudio();
        return;
      }
      stopAudio();
      const url = URL.createObjectURL(slice.file);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingId(slice.id);
      audio.onended = stopAudio;
      await audio.play();
    } catch (err) {
      console.error('Playback failed', err);
      stopAudio();
    }
  };

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const readySlices = slices.filter((s) => s.status === 'ready');
      if (!readySlices.length) {
        setExportError('No ready slices to export.');
        return;
      }
      const blob = await buildDrumPack(readySlices, {
        normalizeMode,
        silenceThreshold,
        maxDuration,
        metadata
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'opz-drum-pack.aif';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setExportError(err?.message ?? 'Export failed. Please retry.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setMetadata((prev) => {
      const resize = (arr: number[], fill: number) => {
        const next = arr.slice(0, 24);
        while (next.length < Math.min(24, slices.length || 24)) {
          next.push(fill);
        }
        return next;
      };
      return {
        ...prev,
        pitch: resize(prev.pitch, 0),
        playmode: resize(prev.playmode, 8192),
        reverse: resize(prev.reverse, 8192),
        volume: resize(prev.volume, 8192)
      };
    });
  }, [slices.length]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handleMetaArrayChange = (
    index: number,
    key: 'volume' | 'pitch' | 'reverse' | 'playmode',
    value: number
  ) => {
    setMetadata((prev) => {
      const nextArr = [...(prev[key] as number[])];
      nextArr[index] = value;
      return { ...prev, [key]: nextArr };
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e6e8ef' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              OP Done — Drum Pack Builder
            </Typography>
            <IconButton color="inherit" aria-label="settings">
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={700}>
                      Inputs
                    </Typography>
                    <Paper
                      variant="outlined"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        bgcolor: '#f9fbff',
                        cursor: 'pointer'
                      }}
                      onClick={handleSelectFiles}
                    >
                      <CloudUploadIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                      <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                        Drop files here
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Up to 24 slices · wav/aiff/mp3/m4a/flac
                      </Typography>
                      <Button variant="contained" sx={{ mt: 2 }} onClick={handleSelectFiles}>
                        Select files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".wav,.aif,.aiff,.mp3,.m4a,.flac"
                        multiple
                        hidden
                        onChange={handleFileInput}
                      />
                    </Paper>

                    <Divider flexItem />

                    <Typography variant="h6" fontWeight={700}>
                      Processing
                    </Typography>
                    <TextField
                      select
                      size="small"
                      label="Normalize mode"
                      value={normalizeMode}
                      onChange={(e) => setNormalizeMode(e.target.value as any)}
                    >
                      <MenuItem value="loudnorm">Loudness (LUFS + limiter)</MenuItem>
                      <MenuItem value="peak">Peak + limiter</MenuItem>
                      <MenuItem value="off">Limiter only</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      label="Silence threshold (dB)"
                      value={silenceThreshold}
                      onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                    />
                    <TextField size="small" label="Max duration (s)" value={maxDuration} disabled helperText="Device cap for drum packs" />
                    <Divider flexItem />
                    <Typography variant="h6" fontWeight={700}>
                      Metadata
                    </Typography>
                    <TextField
                      size="small"
                      label="Patch name"
                      value={metadata.name}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <TextField
                      size="small"
                      label="Octave"
                      type="number"
                      value={metadata.octave}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, octave: Number(e.target.value) }))}
                    />
                    <TextField
                      select
                      size="small"
                      label="Drum version"
                      value={metadata.drumVersion}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, drumVersion: Number(e.target.value) }))}
                    >
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                    </TextField>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.5}>
                        <Typography variant="h6" fontWeight={700}>
                          Slices
                        </Typography>
                        <Typography variant="body2" color={overDuration ? 'error.main' : 'text.secondary'}>
                          {formatDuration(totalDuration)} / {maxDuration}s · {slices.length} / 24 slices
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" startIcon={<FolderOpenIcon />} color="inherit" disabled>
                          Choose slot
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          disabled={disabledExport}
                          onClick={handleExport}
                        >
                          Export .aif
                        </Button>
                      </Stack>
                    </Stack>

                    {error && <Alert severity="error">{error}</Alert>}
                    {overDuration && (
                      <Alert severity="warning">
                        Over the 12s cap. Remove or trim slices to proceed.
                      </Alert>
                    )}
                    {exportError && <Alert severity="error">{exportError}</Alert>}

                    <SliceList
                      slices={slices}
                      onRemove={removeSlice}
                      meta={{
                        volume: metadata.volume,
                        pitch: metadata.pitch,
                        reverse: metadata.reverse,
                        playmode: metadata.playmode
                      }}
                      onMetaChange={handleMetaArrayChange}
                      onPlay={handlePlay}
                      playingId={playingId}
                    />

                    {(isProcessing || isExporting) && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          {isExporting ? 'Exporting pack…' : 'Processing files…'}
                        </Typography>
                        <LinearProgress />
                      </Paper>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
