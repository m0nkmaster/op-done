# Utilities

Pure functions extracted from components and hooks for better testability and reusability.

## Modules

### `array.ts`
- `padArray` - Pads/truncates arrays to target length
- `clamp` - Clamps numeric values to range

### `audio.ts`
- `freqToMidi` - Converts frequency to MIDI note number
- `midiToNoteName` - Converts MIDI to note name (e.g., "C4")
- `frequencyToNote` - Direct frequency to note name conversion
- `semitonesToPitchParam` - Converts semitones to OP-Z pitch parameter
- `formatDuration` - Formats seconds as MM:SS.mmm

### `dsp.ts`
- `downmixToMono` - Downmixes multi-channel audio to mono
- `normalizeBuffer` - Normalizes audio to peak amplitude
- `trimSilence` - Removes leading/trailing silence
- `computeRMS` - Calculates RMS of audio buffer

### `metadata.ts`
- `createDefaultMetadata` - Creates default OP-Z drum metadata
- `updateMetadataArray` - Immutably updates metadata array at index
- `ensureMetadataLength` - Pads metadata arrays to slice count

### `naming.ts`
- `formatNamePrefix` - Generates filename prefix from sample analysis

### `opz.ts`
- `encodePositions` - Encodes frame positions for OP-Z (scaled × 4096)
- `calculateSliceBoundaries` - Calculates slice start/end from durations

## Testing

All utilities have corresponding `.test.ts` files with unit tests.

Run tests:
```bash
bun test
```

Run tests with UI:
```bash
bun test:ui
```
