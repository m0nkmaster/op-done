# OP Done — Feature Requirements

Utility app for preparing content for Teenage Engineering devices (starting with OP-Z). This doc spells out the feature requirements, with the initial release centered on Drum Sample Packs.

## References
- OP-Z import rules: `docs/guides/how_to_import.txt`
- DMX guide (context only): `docs/guides/how_to_dmx.txt`
- Legacy conversion script: `legacy-scripts/to-opz.sh` (ffmpeg pipeline and defaults)
- Legacy OP-1 Drum Utility app bundle: `legacy-scripts/OP-1 Drum Utility.app`

## Delivery approach
- Web UI first (runs locally in browser; no backend). Plan to wrap in Electron later with minimal changes.
- Core processing runs client-side (ffmpeg.wasm or similar). Avoid network calls.
- File I/O uses browser file picker/drag-drop + OP-Z disk mount (later: Electron file system access).

### UI library choice (web/Electron-friendly)
- **Selected: MUI (Material UI)** — reasons: mature, strong accessibility defaults, theming support, large community, Electron-friendly, and easy to restyle away from default Material look.
- Keep Radix Primitives as an optional supplement for advanced a11y primitives if needed (e.g., Dialog, Toast), but default to MUI components.

## Feature scope (current/next)
- Drum Sample Pack builder (MVP shipping first)
- Synth Sample clipper (follow-up; stub requirements below)

---

## Drum Sample Pack builder (MVP)
Goal: ingest user-provided audio snippets and export an OP-Z-ready drum pack (OP-1 .aif format) capped to device limits, normalized, and placed in the correct folder structure for import.

### User flow (happy path)
1) User selects up to 24 audio files (wav, aiff, mp3, m4a, flac) via drag-drop or file picker.  
2) App converts each to mono 44.1 kHz, 16-bit PCM little-endian AIFF, applies normalization, trims silence (optional), and trims/loops so the total pack length is ≤ 12 seconds.  
3) App shows a slice list with waveform thumbnails (optional preview), allows drag/drop reorder, and generates a single drum .aif file with slices.  
4) User downloads the .aif or writes directly into a chosen OP-Z slot folder (Electron: native FS write; Web: download + user copies).  
5) User copies/ejects the OP-Z disk; import succeeds without “rejected” files.

### Functional requirements
- Accept up to 24 slices per pack; enforce cap with a clear error.
- Total pack duration must not exceed 12s; auto-trim or reject with guidance.
- Normalization options:
  - Default: loudness normalize (LUFS) with safety limiter (`loudnorm` + `alimiter` from legacy script).
  - Alternate: peak/limiter chain.
  - Allow bypass only if user opts out (still enforce max level to avoid clipping).
- Silence handling: optional leading-silence trim (default on) using the legacy `silenceremove` threshold (-35 dB).
- File ordering: deterministic; support manual reorder via UI drag/drop + numeric sorting fallback.
- Output format: `.aif` mono, 44.1 kHz, 16-bit PCM (per `to-opz.sh`).
- Metadata: strip all metadata tags before writing (per legacy script behavior).
- Folder targeting: user can choose track + slot; must conform to OP-Z structure:
  - 10 slots per track (subfolders `01`–`10`).
  - Any extra files in a slot are rejected by the device; ensure only one .aif written.
  - Duplicate use across tracks should reuse the same source file if possible (optional optimization).
- Size guardrail: warn if pack size risks exceeding the OP-Z 24 MB total sample budget; show estimated size before write.

### UI requirements (web)
- Layout: left panel for inputs/settings; main panel for slice list with reorder + per-slice controls; bottom bar for actions (preview/export).
- Slice cards: filename, duration, gain meter/normalize toggle, trim toggle, delete, drag handle; optional mini-waveform for context.
- Global controls: normalize mode select, silence trim toggle + threshold, max duration display, target track/slot picker, filename template.
- Validation messaging inline (per slice) plus a summary banner (e.g., “Over duration by 1.2s — trim or remove slices”).
- Export affordances: `Download .aif` (always available) and `Write to OP-Z slot` (Electron/native FS only).
- Progress feedback: conversion status per slice and overall; show errors with retry option on failed slices.

### Web vs Electron notes
- Web: use ffmpeg.wasm; avoid blocking UI; show that processing happens locally; instruct user to copy the exported file into OP-Z disk. No persistent storage beyond browser memory unless the user explicitly saves.
- Electron: direct file system writes to mounted OP-Z; reuse the same UI; enable remembering last paths/settings; optional drag file from slot to desktop for backup.
- Keep the processing/core module framework-agnostic (e.g., pure TS library) so UI shells (web/Electron) share logic.

### Validation & errors
- Pre-check inputs: unreadable file, unsupported codec, >24 files, total estimated length >12s.
- Processing errors: ffmpeg missing, conversion failure, clipping detected after normalization (if any), write permission issues.
- Import safety: confirm target path exists/created under `sample packs/<track>/<slot>/`; warn before overwriting an existing pack.
- Provide actionable messages (what failed, how to fix, max duration reminder, supported formats).

### Configuration surface (exposed to user)
- Max duration (default 12s; cannot exceed OP-Z drum limit).
- Normalize mode (`loudnorm` default, `peak`, or `off` with limiter-only safeguard).
- Loudness targets (LUFS/TP/LRA) and silence threshold override (advanced settings).
- Silence trim toggle.
- Output filename template (default `<pack-name>.aif`).
- Slot destination picker (track/slot).

### Non-functional requirements
- Deterministic renders: same inputs + settings produce bit-identical output.
- No network access required.
- Keep processing time minimal; parallelize per-slice prep if it does not change order.
- Logging that is readable for support (commands run, durations, normalization mode).

### Testing & verification
- Unit/CLI tests for: format conversion, duration enforcement, slice ordering, metadata stripping, overwrite guard.
- Golden sample fixtures covering: 24-slice max, silence-trim on/off, loudnorm vs peak modes, over-length rejection.
- Manual QA checklist: import onto OP-Z via disk mode, verify pack loads and no files end up in `rejected/`.

---

## Synth Sample clipper (next)
Goal: convert a single audio source to an OP-Z synth sample slot (likely 6s limit—needs confirmation).
- Inputs: single file (wav/aiff/mp3/m4a/flac).
- Processing: mono 44.1 kHz 16-bit AIFF, optional loudnorm/peak normalization, trim/loop to device max length.
- Output: one synth-format .aif placed in chosen track/slot; prevent multiple files per slot.
- Open questions: confirm exact synth sample duration cap; confirm loop behavior and envelope defaults.

---

Repo: git@github.com:m0nkmaster/op-done.git
