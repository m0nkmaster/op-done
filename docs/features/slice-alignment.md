# Slice Alignment

## Position Scale Factor

OP-Z/OP-1 encodes positions using a scale factor of **4058**, not 4096 as commonly assumed.

### The Math

```
MAX_POSITION = 2147483646 (0x7FFFFFFE)
MAX_SAMPLES = 44100 Hz × 12 seconds = 529,200 frames
SCALE_FACTOR = MAX_POSITION / MAX_SAMPLES ≈ 4058
```

This was confirmed by analyzing TE's official output and the [teoperator](https://github.com/schollz/teoperator) project.

### Encoding/Decoding

```typescript
// Encode: frame position → metadata value
encoded = frames * 4058

// Decode: metadata value → frame position  
frames = encoded / 4058
```

## Slice Boundaries

- End positions are **exclusive** (like Python ranges)
- Slices are **contiguous**: `end[N] === start[N+1]`
- Empty slices use `start=0, end=0`

### Example

For slices of 2200, 3450, and 4702 frames:

| Slice | Start | End | Plays Frames |
|-------|-------|-----|--------------|
| 1 | 0 | 2200 | 0–2199 |
| 2 | 2200 | 5650 | 2200–5649 |
| 3 | 5650 | 10352 | 5650–10351 |

## Technical Details

- Sample rate: 44,100 Hz
- Max duration: 12 seconds (11.8 for safety)
- Max slices: 24
