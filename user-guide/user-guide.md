# OP Done User Guide

Practical guide for building, inspecting, and testing OP-Z drum packs and AI-generated sounds in the browser.

## Start Here
- **Drum Kit Creator:** Convert up to 24 slices into an OP-Z AIFF pack. See `drum-creator.md`.
- **Sample Analyzer:** Inspect existing packs, slice markers, and metadata. See `sample-analyzer.md`.
- **AI Sound Creation:** Generate synth patches from text prompts. See `sound-creation.md`.
- **USB Browser (beta):** Manage packs on a mounted OP-Z via the File System Access API. See `usb-browser.md`.
- **Synth Engine Reference:** Full parameter map for the Web Audio synthesizer. See `synth-engine.md`.

## Processing Model
- Runs client-side: decode audio, downmix to mono, 16-bit, 44.1k, then export AIFF with OP-Z `APPL` metadata.
- Pads a 0.1s gap after each slice and clamps total audio to ~11.8s (OP-Z limit).
- Positions are written as scaled frame indices before the `SSND` chunk.
- Network is only used when you opt into AI sound creation (OpenAI or Gemini keys required).

## Quick OP-Z Flow
1) Go to **Drum Kit Creator**, drag in your slices (stay at 24 even though 25 slots are shown).  
2) Adjust per-slice volume/pitch and pack metadata.  
3) Export `opz-drum-pack.aif`.  
4) Copy to `sample packs/<track>/<slot>/` on the OP-Z and reboot.  
5) If it doesn’t load, open `import.log` on the device and check slice lengths and total duration.

## Troubleshooting (fast answers)
- **Export disabled:** A slice is errored/processing or total duration exceeds the cap. Trim or remove slices.
- **Silent preview:** Click the page to unlock audio; check system output; try another browser.
- **Slices ignored on OP-Z:** Keep per-slice < ~4s and total < ~11.8s; re-export and reinstall.
- **USB Browser fails:** Use a Chromium browser that supports `showDirectoryPicker` and ensure the OP-Z is mounted.
- **AI generation fails:** Verify the correct API key for the selected provider and that network calls aren’t blocked.

## Data & Privacy
- Drum pack creation and analysis stay local to the browser.
- AI sound creation sends your prompt (and optional prior config) to the chosen provider; audio rendering and WAV export remain local.
