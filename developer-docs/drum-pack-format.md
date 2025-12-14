# OP-Z/OP-1 Drum Pack Format Specification

This document describes the exact format requirements for drum pack AIFF files that are compatible with the TE Drum Utility and OP-Z/OP-1 devices.

## Overview

Drum packs are AIFF-C (AIFC) files containing:
- Audio data (mono, 16-bit, 44.1kHz, little-endian PCM)
- Metadata in an APPL chunk with slice positions and settings

## File Structure

```
FORM (AIFC)
├── FVER (version chunk)
├── COMM (common chunk with audio format)
├── APPL (application-specific chunk with drum metadata)
└── SSND (sound data chunk)
```

### Chunk Order

Chunks must appear in this exact order:
1. **FVER** - AIFC version
2. **COMM** - Audio format description
3. **APPL** - Drum metadata (op-1 format)
4. **SSND** - Audio samples

## FVER Chunk

```
FVER | Size: 4 bytes
Version: 0xA2805140 (2726318400)
```

## COMM Chunk

```
COMM | Size: 64 bytes (for AIFC with compression name)
- Channels: 1 (mono)
- Sample frames: <total frames>
- Bits per sample: 16
- Sample rate: 44100 Hz (80-bit extended float)
- Compression type: 'sowt' (little-endian PCM)
- Compression name: "Signed integer (little-endian) linear PCM"
```

## APPL Chunk (Critical)

The APPL chunk contains the drum metadata in a specific format:

### Structure

```
APPL | Size: <payload_size>
├── App type: "op-1" (4 bytes, ASCII)
├── JSON metadata (variable length)
└── Null terminator: 0x00 (1 byte) ← REQUIRED!
```

### JSON Field Order (CRITICAL)

The TE Drum Utility is **sensitive to JSON field order**. Fields MUST appear in this exact sequence:

```json
{
  "drum_version": 2,
  "type": "drum",
  "name": "<kit name>",
  "start": [<24 position values>],
  "end": [<24 position values>],
  "octave": 0,
  "pitch": [<24 values>],
  "playmode": [<24 values>],
  "reverse": [<24 values>],
  "volume": [<24 values>],
  "dyna_env": [0, 8192, 0, 8192, 0, 0, 0, 0],
  "fx_active": false,
  "fx_type": "delay",
  "fx_params": [8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000],
  "lfo_active": false,
  "lfo_type": "tremolo",
  "lfo_params": [16000, 16000, 16000, 16000, 0, 0, 0, 0]
}
```

### Position Encoding

Start and end positions are encoded as:
```
encoded_position = frame_number × 4096
```

Maximum value: `0x7FFFFFFE` (2147483646)

### Default Parameter Values

| Parameter | Default Value | Notes |
|-----------|---------------|-------|
| pitch | 0 | Center pitch |
| playmode | 4096 | Required for AIFC format |
| reverse | 8192 | Normal playback |
| volume | 8192 | Full volume |

### Null Terminator

The JSON **MUST** be followed by a null byte (`0x00`) as part of the APPL chunk payload. This is included in the chunk size calculation.

```
Chunk size = 4 (op-1) + JSON length + 1 (null terminator)
```

## SSND Chunk

Standard AIFF sound data chunk:
```
SSND | Size: <audio_data_size + 8>
├── Offset: 0 (4 bytes)
├── Block size: 0 (4 bytes)
└── Audio data: <16-bit little-endian PCM samples>
```

## Audio Constraints

| Constraint | Value |
|------------|-------|
| Format | AIFF-C (AIFC) |
| Channels | 1 (mono) |
| Sample rate | 44,100 Hz |
| Bit depth | 16-bit |
| Encoding | Little-endian PCM (sowt) |
| Max duration | 12 seconds |
| Max slices | 24 |
| Max slice duration | 4 seconds each |

## Slice Placement

Slices should be placed **contiguously** in the audio file with small gaps between them:

```
[Slice 0][gap][Slice 1][gap][Slice 2]...
```

The gap is typically ~0.5ms (21 samples at 44.1kHz) to prevent audio bleeding.

## Common Mistakes

### 1. Wrong JSON Field Order ❌

```json
// WRONG - octave/pitch before start/end
{"drum_version":2,"type":"drum","name":"kit","octave":0,"pitch":[...],"start":[...],...}

// CORRECT - start/end before octave/pitch
{"drum_version":2,"type":"drum","name":"kit","start":[...],"end":[...],"octave":0,"pitch":[...],...}
```

### 2. Missing Null Terminator ❌

```
// WRONG - no null byte after JSON
...0,0,0,0]}SSND...

// CORRECT - null byte after closing brace
...0,0,0,0]}\x00SSND...
```

### 3. Wrong Playmode Value ❌

```json
// WRONG for AIFC format
"playmode": [8192, 8192, ...]

// CORRECT for AIFC format
"playmode": [4096, 4096, ...]
```

### 4. Non-Contiguous Slices ❌

Slices should not jump around the audio file. They should be placed sequentially from the beginning.

## Validation Checklist

- [ ] File type is AIFC (not plain AIFF)
- [ ] FVER version is 0xA2805140
- [ ] COMM compression is 'sowt'
- [ ] APPL starts with 'op-1'
- [ ] JSON field order is correct
- [ ] Null terminator after JSON
- [ ] playmode values are 4096 for AIFC
- [ ] All arrays have exactly 24 elements
- [ ] Slices are contiguous
- [ ] Total duration ≤ 12 seconds

## Reference Implementation

See `src/audio/aiff.ts` for the reference implementation of `buildDrumMetadataChunk()`.

## Tools

- **TE Drum Utility**: https://teenage.engineering/apps/drum-utility (official tool for testing)
- **analyze_aiff.py**: `scripts/analyze_aiff.py` (local validation tool)

## Resources

- [OP-Z Samples Guide](../wip-docs/guides/op-z-samples-guide.md)
- [OP-Z Official Documentation](https://teenage.engineering/guides/op-z)

