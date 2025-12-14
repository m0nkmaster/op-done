# synth engine reference

Layered Web Audio synthesizer used by AI Sound Creation and the Synth Test harness.

## signal flow
```
per-layer source (osc/noise/fm/karplus) → layer filter (optional) → saturation (optional) → layer envelope/gain
→ mixer → global filter (optional, with envelope) → master envelope/gain → LFO (pitch/filter/amp/pan)
→ effects (reverb/delay/distortion/compressor/gate) → output
```

## layer types
- **oscillator:** waveforms `sine | square | sawtooth | triangle`, `frequency`, `detune`. Optional **unison** (`voices` 1–8, `detune` cents, `spread` 0–1) and **sub** (`level` 0–1, `octave` -1/-2, waveform optional).
- **noise:** `white | pink | brown`.
- **fm:** `carrier`, `modulator`, `modulationIndex`.
- **karplus-strong:** `frequency`, `damping` (0–1), `pluckLocation` (0–1) for comb coloration.

## envelopes
- **Per-layer envelope:** `attack`, `decay`, `sustain`, `release`, optional `attackCurve | releaseCurve` (`linear | exponential`). Applied to the layer gain.
- **Global envelope:** Same fields plus `attackCurve | releaseCurve` (`linear | exponential | logarithmic`). Always applied to master gain.
- **Filter envelopes:** On both layer filter and global filter: `amount` (±Hz), `attack`, `decay`, `sustain`, `release`.

## filters
- **Layer filter:** `type` (`lowpass | highpass | bandpass | notch`), `frequency`, `q`, optional envelope.
- **Global filter:** `type` (`lowpass | highpass | bandpass | notch | allpass | peaking`), `frequency`, `q`, optional `gain` (for peaking), optional envelope.

## lfo
- `waveform: sine | square | sawtooth | triangle | random`
- `frequency` (Hz), `depth` (0–1), `target` (`pitch | filter | amplitude | pan`), `phase` (0–1), optional `delay`/`fade` (seconds).

## saturation
- Per-layer saturation: `type` (`soft | hard | tube | tape`), `drive` (0–10), `mix` (0–1).

## effects
- **reverb:** `type` (`room | hall | plate | spring | convolution`), `size` 0–1, `decay` seconds, `damping` 0–1, `mix` 0–1, `predelay` ms.
- **delay:** `time` seconds, `feedback` 0–1, `mix` 0–1, `sync` boolean, `pingPong` boolean, optional `filterFreq` Hz.
- **distortion:** `type` (`soft | hard | fuzz | bitcrush | waveshaper`), `amount` 0–1, `mix` 0–1.
- **compressor:** `threshold` dB, `ratio` 1–20, `attack` s, `release` s, `knee` dB.
- **gate:** `threshold` dB, `attack` s, `hold` s, `release` s.
- **chorus/phaser:** Types exist in config for future use; not fully implemented in the current engine.

## spatial
- `pan` -1..1, `width` 0–1 (used for unison spread and stereo processing).

## timing & dynamics
- `duration` seconds (render length), optional `fadeIn`/`fadeOut` seconds, optional `tempo` BPM for future sync.
- `velocity` 0–1, `gain` dB offset, `normalize` boolean (post-render normalization).

## defaults (practical)
- Envelope attack/decay/release clamp to milliseconds minimum to avoid clicks.
- Unison gain auto-compensates to prevent clipping when stacking voices.
- Total render duration = `timing.duration` + estimated tail for delay/reverb so tails are not cut off.

## recommended ranges
- Envelope times: 0.001–10s (typical drums 1–200ms, pads 0.5–3s).
- Unison detune: 10–50 cents for width; spread 0.3–1.0 for stereo.
- Filter freq: 20–20000 Hz; Q: 0.0001–20 for most musical cases.
- LFO: 0.01–20 Hz; depth 0–1; use delay/fade for musical ramps.
- Saturation drive: 0–6 musical, 6–10 heavy; mix 0.1–0.7 typical.
- Reverb: size 0.2–0.8, decay 0.3–3s, mix 0.05–0.35 for drums, higher for pads.
- Delay: time 0.08–0.15s slap, 0.3–0.6s groove, 1–2s huge; feedback 0.2–0.8, mix 0.2–0.6.

## mapping to files
- Implementation: `src/audio/synthesizer.ts`
- Types: `src/types/soundConfig.ts`
- Tests: `src/audio/synthesizer.test.ts`
- Quick patterns: see `wip-docs/SYNTH_QUICK_REFERENCE.md` for ready-made patches and ranges.
