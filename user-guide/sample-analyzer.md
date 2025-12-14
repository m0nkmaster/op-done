# sample analyzer

Inspect existing OP-Z drum packs to verify slice markers, metadata, and audio layout.

## what it parses
- Reads AIFF/AIFC, locates the `APPL` chunk, and expects `op-1` JSON with `start`, `end`, `volume`, `pitch`, `reverse`, `playmode`, `name`, `octave`, and `drum_version`.
- Decodes positions by dividing the OP-Z scaled values (×4096) back to frame indices.
- Renders the waveform at 44.1k and overlays start/end lines using the original AIFF frame count to avoid resample drift.

## usage
1) Click **Select File** and choose an `.aif/.aiff` with OP-Z metadata.  
2) The metadata card shows name, octave, and drum version.  
3) Waveform view draws slice boundaries; click inside a region to audition that slice.  
4) Slice list shows start/end frames plus volume and pitch parameters. Empty slots (start=0, end=0) are hidden.

## troubleshooting
- **“No APPL chunk found”**: The file is missing OP-Z metadata—export again from Drum Kit Creator.  
- **Playback silent**: Click the page to unlock audio; check system output.  
- **Boundaries look offset**: Positions are drawn relative to the original frame count; if the source had odd sample rates, minor visual offsets can appear but metadata remains accurate.  
- **Can’t open file**: Ensure AIFF extension and that the pack is mono/44.1k with OP-Z JSON present.
