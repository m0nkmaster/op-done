# Slice Alignment Fix

## Issue

Drum Kit Creator slicing was producing slices that "bled" into subsequent samples. The symptom worsened progressively - later slices showed more misalignment than earlier ones.

## Root Causes Identified

### 1. Wrong End Position Convention

The `calculateSliceBoundaries` function treated end positions as **inclusive** and added a safety buffer:

```typescript
// WRONG - treated end as inclusive and subtracted safety buffer
const safetyBuffer = 20;
end.push(cursor + targetLen - 1);
```

**The OP-Z format uses EXCLUSIVE end positions** (like Python's `range()`).

### 2. FFmpeg Conversion Artifacts

FFmpeg adds extra frames during audio conversion (filter latency, encoder padding). We were reading frame counts from the **converted** AIFF files, which included these artifacts:

| Sample | TE Length | Our Length | Difference |
|--------|-----------|------------|------------|
| 1      | 2200      | 2200       | 0          |
| 5      | 6416      | 6456       | +40        |
| 10     | 8856      | 8918       | +62        |
| 20     | 55300     | 55799      | +499       |

**Total extra frames: ~2,943 (66.7ms)**

These extra frames accumulated with each slice, causing:
- Slice starts to drift progressively later
- Slice ends to extend past actual audio content

## The Fixes

### Fix 1: Correct End Position Convention

Simplified `calculateSliceBoundaries` in `src/utils/opz.ts`:

```typescript
export const calculateSliceBoundaries = (
  sliceFrames: number[]
): { start: number[]; end: number[] } => {
  const start: number[] = [];
  const end: number[] = [];
  let cursor = 0;

  for (let i = 0; i < MAX_SLICES; i++) {
    const frames = sliceFrames[i] ?? 0;
    start.push(cursor);

    if (frames === 0) {
      end.push(cursor);
    } else {
      end.push(cursor + frames);  // Exclusive end, no safety buffer
      cursor += frames;
    }
  }

  return { start, end };
};
```

### Fix 2: Use Original File Frame Counts

Changed `transcodeAndConcat` in `src/audio/ffmpeg.ts` to calculate expected frames from **original file metadata** instead of reading from FFmpeg output:

```typescript
// Calculate expected frames at target sample rate from original file
const expectedFrames = getExpectedFrames(originalData);
sliceFrames.push(expectedFrames);
```

The `getExpectedFrames` function:
1. Reads original file's frame count and sample rate
2. Calculates expected frames at 44100Hz: `originalFrames * (44100 / originalSampleRate)`
3. Avoids FFmpeg's conversion artifacts affecting slice positions

## Technical Details

### OP-Z Slice Position Format

- Positions stored as `frame * 4096` (scaled for precision)
- End positions are **exclusive** (like Python range)
- Slices are **tightly packed** - no gaps
- Empty slices have `start == end`

### Example

For 3 samples with lengths [2200, 3460, 4725]:

| Slice | Start | End   | Frames |
|-------|-------|-------|--------|
| 1     | 0     | 2200  | 2200   |
| 2     | 2200  | 5660  | 3460   |
| 3     | 5660  | 10385 | 4725   |

**Key**: `end[N] == start[N+1]` (no gaps)

### Why FFmpeg Adds Extra Frames

During sample rate conversion, FFmpeg's resampler adds:
1. Filter latency (anti-aliasing filter priming)
2. Encoder padding for block alignment
3. Typically 100-500 extra samples per file

These artifacts are in the **output audio**, but shouldn't affect **slice position calculations**.

## Files Changed

- `src/utils/opz.ts` - Fixed `calculateSliceBoundaries` (exclusive ends, no safety buffer)
- `src/utils/opz.test.ts` - Updated tests for new behavior
- `src/audio/pack.ts` - Updated to use simplified function signature
- `src/audio/ffmpeg.ts` - Added `getExpectedFrames` to read original file metadata

