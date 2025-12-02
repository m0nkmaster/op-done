# OP Done

Web UI (Vite + React + TypeScript + MUI) skeleton for building Teenage Engineering OP-Z drum sample packs.  

## OP-Z drum format (what we generate)
- File: AIFF, mono, 16-bit, 44.1 kHz, < 12s total.
- Slices: 24 slots (OP-Z uses 24 keys on drum tracks). We lay slices in order and inject explicit slice metadata so the device does not re-split evenly.
- Metadata: an `APPL` chunk with OP-1/OP-Z drum JSON (`drum_version` 2) is inserted before `SSND`. Key fields:
  - `start`/`end`: 24-element arrays of slice boundaries, scaled frames = `frame_index * 4096`, clamped to `0x7ffffffe`.
  - `playmode`, `reverse`, `volume`: default `8192` for each slot (matches stock packs/teoperator).
  - `pitch` all zero, `dyna_env`, `fx_active`/`fx_params`, `lfo_active`/`lfo_params` set to safe defaults.
- MARK/INST chunks are not required; stock OP-Z packs rely on the `APPL` drum JSON.
- If a slice is shorter than its allotted duration, remaining frames are silent; unused slots are padded with zero-length markers.

## Getting started
Using Bun (preferred):
1. Install dependencies (Node 18+ recommended): `bun install`
2. Run the dev server: `bun dev` (opens on http://localhost:5173)
3. Build for production: `bun run build`
4. Preview the production build: `bun run preview`

Using npm (fallback):
1. `npm install`
2. `npm run dev`
3. `npm run build`
4. `npm run preview`

## Notes
- Processing is intended to run locally in the browser (ffmpeg.wasm). Electron packaging can reuse the same UI.
- See `docs/features/op-done.md` for the feature requirements and roadmap.
- Format reference: `docs/guides/opz-drum-format.md` and sample AIFFs in `docs/sample-files/`. Our metadata encoding matches the legacy `teoperator` tool and stock OP-Z packs.
