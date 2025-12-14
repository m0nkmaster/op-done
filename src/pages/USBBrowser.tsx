import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';

// File System Access API types (not fully typed in TypeScript lib)
interface FSADirectoryHandle extends FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface WindowWithFSA {
  showDirectoryPicker: (opts: { id: string; mode: string }) => Promise<FSADirectoryHandle>;
  showOpenFilePicker: (opts: { types: { description: string; accept: Record<string, string[]> }[]; multiple: boolean }) => Promise<FileSystemFileHandle[]>;
}

const DRUM_TRACKS = ['1-kick', '2-snare', '3-perc', '4-fx'];
const SYNTH_TRACKS = ['5-bass', '6-lead', '7-arpeggio', '8-chord'];
const TRACKS = [...DRUM_TRACKS, ...SYNTH_TRACKS];
const SLOTS = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));

interface SlotFile {
  name: string;
  size: number;
  isFactory: boolean;
  type: 'sample' | 'engine' | 'factory' | 'unknown';
  engineId?: number; // For engine references
}

interface SlotData {
  track: string;
  slot: string;
  file: SlotFile | null;
}

// Factory slots can't be detected due to browser API limitations with ~ prefix files
const FACTORY_WARNING = "⚠️ Factory presets (files starting with ~) cannot be detected by browsers. Empty slots may contain factory content.";

export function USBBrowser() {
  const [connected, setConnected] = useState(false);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [samplePacksFolderName, setSamplePacksFolderName] = useState<string>('samplepacks');
  const [opzRootName, setOpzRootName] = useState<string>('OP-Z');

  const openInFinder = (track: string, slot: string) => {
    const path = `/Volumes/${opzRootName}/${samplePacksFolderName}/${track}/${slot}`;
    // Show instructions since we can't open Finder directly
    window.alert(
      `To check this slot in Finder:\n\n` +
      `1. Open Finder\n` +
      `2. Press Cmd+Shift+G\n` +
      `3. Paste this path:\n\n${path}\n\n` +
      `(Path has been copied to clipboard)`
    );
    navigator.clipboard.writeText(path);
  };


  const checkConnection = async () => {
    try {
      const fsa = window as unknown as WindowWithFSA;
      const handle = await fsa.showDirectoryPicker({ id: 'opz', mode: 'readwrite' });
      
      // Store the root name for path generation
      setOpzRootName(handle.name);
      
      // List contents of selected directory
      const entries: string[] = [];
      for await (const entry of handle.values()) {
        entries.push(`${entry.kind}: ${entry.name}`);
      }
      
      // Look for sample packs directory (try common variants)
      let samplePacksHandle: FSADirectoryHandle | null = null;
      let foundFolderName = '';
      const samplePacksVariants = ['sample packs', 'samplepacks', 'sample-packs'];
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory' && samplePacksVariants.includes(entry.name.toLowerCase())) {
          samplePacksHandle = await handle.getDirectoryHandle(entry.name) as FSADirectoryHandle;
          foundFolderName = entry.name;
          console.log('Found sample packs folder:', entry.name);
          break;
        }
      }
      
      if (foundFolderName) {
        setSamplePacksFolderName(foundFolderName);
      }
      
      if (!samplePacksHandle) {
        setConnected(false);
        setError(`No "sample packs" folder found. Found: ${entries.filter(e => e.startsWith('directory:')).map(e => e.replace('directory: ', '')).join(', ') || 'no folders'}`);
        return;
      }
      
      await scanSlots(samplePacksHandle);
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('Connection error:', err);
      setConnected(false);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Selection cancelled');
        } else {
          setError(`Connection failed: ${err.message}`);
        }
      } else {
        setError('OP-Z connection failed - check console for details');
      }
    }
  };

  const scanSlots = async (samplePacksHandle: FSADirectoryHandle) => {
    const data: SlotData[] = [];
    for (const track of TRACKS) {
      try {
        const trackHandle = await samplePacksHandle.getDirectoryHandle(track) as FSADirectoryHandle;
        for (const slot of SLOTS) {
          try {
            const slotHandle = await trackHandle.getDirectoryHandle(slot) as FSADirectoryHandle;
            let file: SlotFile | null = null;
            
            // Collect all entries to find best match
            // Note: Files starting with ~ (factory presets) are not visible via iteration
            const entries: { name: string; kind: string }[] = [];
            for await (const entry of slotHandle.values()) {
              entries.push({ name: entry.name, kind: entry.kind });
            }
            
            
            
            // Look for audio files (prioritize non-link files)
            // Sort entries: regular .aif files first, then links
            const sortedEntries = [...entries].sort((a, b) => {
              const aIsLink = a.name.startsWith('~');
              const bIsLink = b.name.startsWith('~');
              if (aIsLink && !bIsLink) return 1;
              if (!aIsLink && bIsLink) return -1;
              return 0;
            });
            
            for (const entry of sortedEntries) {
              if (entry.kind === 'file') {
                const name = entry.name;
                const isAiff = name.endsWith('.aif') || name.endsWith('.aiff');
                const isEngine = name.endsWith('.engine');
                const isLink = name.startsWith('~');
                
                // Relevant files: .aif samples, .engine references, or ~ link files
                const isRelevant = isAiff || isEngine || isLink;
                
                // Detect file type and engine ID
                let type: SlotFile['type'] = 'unknown';
                let engineId: number | undefined;
                
                if (isEngine) {
                  type = 'engine';
                  // Extract engine ID from filename like "~26.engine"
                  const match = name.match(/~?(\d+)\.engine/);
                  if (match) {
                    engineId = parseInt(match[1], 10);
                  }
                } else if (isLink && isAiff) {
                  type = 'factory'; // Factory preset sample pack
                } else if (isAiff) {
                  type = 'sample'; // User-uploaded sample file
                }
                
                if (isRelevant) {
                  try {
                    const fileHandle = await slotHandle.getFileHandle(name);
                    const fileData = await fileHandle.getFile();
                    file = {
                      name,
                      size: fileData.size,
                      isFactory: isLink,
                      type,
                      engineId
                    };
                    // Prefer user samples over factory/engine, so break if we found one
                    if (!isLink && !isEngine) break;
                  } catch {
                    // File might be a symlink that can't be read - still show it
                    file = {
                      name,
                      size: 0,
                      isFactory: isLink,
                      type: isEngine ? 'engine' : 'factory',
                      engineId
                    };
                  }
                }
              }
            }
            
            // If no audio file found but entries exist, it might be a factory file we couldn't read
            if (!file && entries.length > 0) {
              // Check if there's a factory file we couldn't read
              const factoryEntry = entries.find(e => e.name.startsWith('~'));
              if (factoryEntry) {
                file = {
                  name: factoryEntry.name,
                  size: 0,
                  isFactory: true,
                  type: factoryEntry.name.endsWith('.engine') ? 'engine' : 'factory',
                  engineId: factoryEntry.name.endsWith('.engine') 
                    ? parseInt(factoryEntry.name.match(/(\d+)/)?.[1] || '0', 10)
                    : undefined
                };
              }
            }
            
            data.push({ track, slot, file });
          } catch {
            data.push({ track, slot, file: null });
          }
        }
      } catch {
        for (const slot of SLOTS) {
          data.push({ track, slot, file: null });
        }
      }
    }
    setSlots(data);
  };

  const handleUpload = async (slotData: SlotData) => {
    // Warn about potential factory content in empty slots
    if (!slotData.file) {
      const confirmed = window.confirm(
        `⚠️ Slot ${slotData.track}/${slotData.slot} appears empty, but may contain a factory preset that browsers cannot detect.\n\nAre you sure you want to upload to this slot?`
      );
      if (!confirmed) return;
    }
    
    try {
      const fsa = window as unknown as WindowWithFSA;
      const [fileHandle] = await fsa.showOpenFilePicker({
        types: [{ description: 'AIFF Files', accept: { 'audio/aiff': ['.aif', '.aiff'] } }],
        multiple: false
      });
      const file = await fileHandle.getFile();
      const handle = await fsa.showDirectoryPicker({ id: 'opz', mode: 'readwrite' });
      const samplePacksHandle = await handle.getDirectoryHandle(samplePacksFolderName) as FSADirectoryHandle;
      const trackHandle = await samplePacksHandle.getDirectoryHandle(slotData.track);
      const slotHandle = await trackHandle.getDirectoryHandle(slotData.slot);
      const newFileHandle = await slotHandle.getFileHandle(file.name, { create: true });
      const writable = await (newFileHandle as unknown as { createWritable: () => Promise<WritableStream & { write: (data: ArrayBuffer) => Promise<void>; close: () => Promise<void> }> }).createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();
      await scanSlots(samplePacksHandle);
      setError(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed');
    }
  };

  const handleDelete = async (slotData: SlotData) => {
    if (!slotData.file) return;
    try {
      const fsa = window as unknown as WindowWithFSA;
      const handle = await fsa.showDirectoryPicker({ id: 'opz', mode: 'readwrite' });
      const samplePacksHandle = await handle.getDirectoryHandle(samplePacksFolderName) as FSADirectoryHandle;
      const trackHandle = await samplePacksHandle.getDirectoryHandle(slotData.track);
      const slotHandle = await trackHandle.getDirectoryHandle(slotData.slot);
      await slotHandle.removeEntry(slotData.file.name);
      await scanSlots(samplePacksHandle);
      setError(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Delete failed');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      <Container maxWidth="lg" sx={{ py: 2, px: 2 }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">OP-Z USB Browser</Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={connected ? 'Connected' : 'Disconnected'}
                  color={connected ? 'success' : 'default'}
                  size="small"
                />
                <IconButton size="small" onClick={checkConnection}>
                  <RefreshIcon />
                </IconButton>
              </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!connected && (
              <Alert severity="info">
                Connect OP-Z in disk mode and click refresh
              </Alert>
            )}
            
            {connected && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {FACTORY_WARNING}
              </Alert>
            )}

            {connected && (
              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary">Drum Tracks</Typography>
                {DRUM_TRACKS.map((track) => (
                  <Paper key={track} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <FolderIcon fontSize="small" />
                      <Typography variant="subtitle2">{track}</Typography>
                      <Chip label="Drum" size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Stack>
                    <Stack spacing={1}>
                      {SLOTS.map((slot) => {
                        const slotData = slots.find((s) => s.track === track && s.slot === slot);
                        if (!slotData) return null;
                        return (
                          <Paper
                            key={`${track}-${slot}`}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              bgcolor: slotData.file ? 'background.paper' : 'action.hover',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: 'primary.main' }
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 24 }}>
                                  {slot}
                                </Typography>
                                {slotData.file ? (
                                  <>
                                    <AudioFileIcon fontSize="small" />
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                      {slotData.file.type === 'engine' 
                                        ? `Engine #${slotData.file.engineId ?? '?'}`
                                        : slotData.file.name.replace(/^~/, '')}
                                    </Typography>
                                    {slotData.file.type === 'factory' && (
                                      <Chip label="Factory" size="small" color="default" variant="outlined" />
                                    )}
                                    {slotData.file.type === 'sample' && slotData.file.size > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        {(slotData.file.size / 1024).toFixed(0)} KB
                                      </Typography>
                                    )}
                                  </>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Unknown (may have factory preset)
                                  </Typography>
                                )}
                              </Stack>
                              <Stack direction="row" spacing={0.5}>
                                {!slotData.file && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInFinder(slotData.track, slotData.slot);
                                    }}
                                    title="Check in Finder"
                                  >
                                    <FolderOpenIcon fontSize="small" />
                                  </IconButton>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpload(slotData);
                                  }}
                                >
                                  <CloudUploadIcon fontSize="small" />
                                </IconButton>
                                {slotData.file && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(slotData);
                                    }}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Paper>
                ))}
                
                <Typography variant="overline" color="text.secondary" sx={{ mt: 2 }}>Synth Tracks</Typography>
                {SYNTH_TRACKS.map((track) => (
                  <Paper key={track} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <FolderIcon fontSize="small" />
                      <Typography variant="subtitle2">{track}</Typography>
                      <Chip label="Synth" size="small" color="secondary" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Stack>
                    <Stack spacing={1}>
                      {SLOTS.map((slot) => {
                        const slotData = slots.find((s) => s.track === track && s.slot === slot);
                        if (!slotData) return null;
                        return (
                          <Paper
                            key={`${track}-${slot}`}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              bgcolor: slotData.file ? 'background.paper' : 'action.hover',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: 'primary.main' }
                            }}

                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 24 }}>
                                  {slot}
                                </Typography>
                                {slotData.file ? (
                                  <>
                                    <AudioFileIcon fontSize="small" />
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                      {slotData.file.type === 'engine' 
                                        ? `Engine #${slotData.file.engineId ?? '?'}`
                                        : slotData.file.name.replace(/^~/, '')}
                                    </Typography>
                                    {slotData.file.type === 'factory' && (
                                      <Chip label="Factory" size="small" color="default" variant="outlined" />
                                    )}
                                    {slotData.file.type === 'engine' && (
                                      <Chip label="Synth Engine" size="small" color="secondary" variant="outlined" />
                                    )}
                                    {slotData.file.type === 'sample' && slotData.file.size > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        {(slotData.file.size / 1024).toFixed(0)} KB
                                      </Typography>
                                    )}
                                  </>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Unknown (may have factory preset)
                                  </Typography>
                                )}
                              </Stack>
                              <Stack direction="row" spacing={0.5}>
                                {!slotData.file && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInFinder(slotData.track, slotData.slot);
                                    }}
                                    title="Check in Finder"
                                  >
                                    <FolderOpenIcon fontSize="small" />
                                  </IconButton>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpload(slotData);
                                  }}
                                >
                                  <CloudUploadIcon fontSize="small" />
                                </IconButton>
                                {slotData.file && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(slotData);
                                    }}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

