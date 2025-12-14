# OP-Z Playmodes

Each slice in a drum pack can have one of four playmodes that control how the sample is triggered and plays back.

## Playmode Values

| Value | Name | Icon | Description |
|-------|------|------|-------------|
| 4096 | Standard | → | Default playmode. Sample plays once when triggered |
| 12288 | Play Out | →I | Sample plays to completion regardless of note length |
| 20480 | Gated | →G | Sample plays only while key is held |
| 28672 | Loop | ↻ | Sample loops continuously while key is held |

## Usage in Metadata

The `playmode` array in drum pack metadata contains 24 values (one per slice):

```json
{
  "playmode": [
    4096,   // Slice 1: Standard
    28672,  // Slice 2: Loop
    12288,  // Slice 3: Play Out
    20480,  // Slice 4: Gated
    4096,   // Slice 5: Standard
    // ... remaining slices
  ]
}
```

## Default Value

For AIFC format (OP-Z compatible), the default playmode is **4096 (Standard)**.

## Technical Notes

- Values are stored as integers in the JSON metadata
- The playmode affects real-time playback behavior on the OP-Z
- Icons shown are from the Teenage Engineering drum utility

