# drum kit creator

Deep-dive on building OP-Z drum packs from your own audio.

## ingest & limits
- Accepts `.wav`, `.aif/.aiff`, `.mp3`, `.m4a`, `.flac`. AIFF inputs are transcoded to WAV for preview; all sources downmix to mono/16-bit/44.1k.
- Target cap: ~11.8s total audio (OP-Z limit). A warning appears if you exceed it; slices over ~4s raise a caution. Keep to 24 slices even though 25 slots are shown.
- A 0.1s pad is appended after every slice before concatenation. Slice positions are calculated against the content length (gap excluded) and written to OP-Z metadata.

## workflow
1) **Add slices:** Drag/drop or use the picker. Files process immediately (classification + pitch detection for melodic content).  
2) **Review list:** Each slice shows waveform, prefixed name (kick/snare/hat/etc.), duration, and status.  
3) **Per-slice controls:**  
   - Play (respects pitch/volume)  
   - Delete  
   - Volume 0–16383 (8192 = unity)  
   - Pitch −12..+12 semitones in 0.1 steps (note readout when pitch detected)  
4) **Pack metadata:** Set `name`, `octave`, and `drum version` (2 or 3). Arrays pad to the active slice count.  
5) **Export:** Enabled only when every slice is `ready`, duration is under the cap, and processing is idle. Exports `opz-drum-pack.aif` with OP-Z `APPL` chunk inserted before `SSND`.

## classification & naming
- Automatic classifier tags drum hits (kick/snare/hat/cymbal) or melodic/unknown, and prefixes filenames accordingly.
- Melodic detection runs pitch analysis; the pitch modal shows the resulting note once you shift semitones.
- Classification is cosmetic; it doesn’t change audio, just the suggested name.

## best practices for OP-Z
- Keep slices short and punchy; trim dead air before import to save the 11.8s budget.
- Normalize externally if needed; within the app, use per-slice volume to balance levels rather than overdriving.
- Leave one slot empty to avoid 25th-slot ambiguity; OP-Z expects 24 defined markers.
- If a slice is ignored on-device, shorten it below ~4s and re-export.
