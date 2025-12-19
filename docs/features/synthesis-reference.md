# Synthesis Reference for AI Generation

## Overview

This guide provides deep technical knowledge for generating realistic synthesized sounds. Use this to understand parameter interactions, perceptual effects, and practical ranges.

## Core Concepts

### Layer Architecture

**Multiple layers = additive synthesis**
- Each layer is independent until the mixer
- Layers sum together (watch for clipping - keep total gain ~1.0)
- Typical patterns:
  - 2-layer: Body + transient (e.g., bass fundamental + click)
  - 3-layer: Low + mid + high (e.g., sub bass + body + brightness)
  - 4-8 layers: Complex timbres (e.g., orchestral, pad stacks)

**Gain balancing:**
- Primary tone: 0.5-0.8
- Supporting layers: 0.2-0.4
- Transients/noise: 0.05-0.15
- Total across all layers: aim for 0.8-1.2 (normalize handles peaks)

### Envelope Behavior

**ADSR stages:**
- Attack: 0 → peak (linear volume increase)
- Decay: peak → sustain level (natural falloff)
- Sustain: hold at level until release
- Release: sustain → silence (note off or end)

**Perceptual timing:**
- **Instant** (<0.002s): Percussive, plucked, electronic
- **Fast** (0.002-0.01s): Piano hammer, mallet, pick attack
- **Medium** (0.01-0.05s): Soft mallets, blown instruments onset
- **Slow** (0.05-0.2s): Bowed strings, soft pads, breath attack
- **Very slow** (0.2-1s+): String sections, organ swells, ambient

**Sustain behavior:**
- 0 = one-shot (percussion, piano, plucks)
- 0.1-0.3 = gentle fade (some keyboards, guitars)
- 0.5-1.0 = held notes (organs, synths, sustained sounds)

**Decay vs Release:**
- Decay: how long to fall from peak to sustain
- Release: how long to fade after note off
- For one-shot sounds (sustain=0): decay is the main "body" time

### Filter Behavior

**Filter types:**
- **lowpass**: Most common. Cuts highs, keeps lows. Dark, warm, muffled.
  - Frequency = where cutting starts (~-3dB point)
  - Q = slope steepness. 0.7 = gentle, 2-5 = resonant peak, 10+ = self-oscillation
- **highpass**: Cuts lows, keeps highs. Thin, bright, tinny.
- **bandpass**: Keeps middle, cuts both ends. Nasal, telephone-like, focused.
- **notch**: Cuts middle, keeps ends. Hollow, phaser-like.

**Practical frequency ranges:**
- Sub bass: 20-80Hz
- Bass: 80-250Hz
- Low mids: 250-500Hz
- Mids: 500-2000Hz
- Upper mids: 2000-6000Hz
- Presence: 6000-12000Hz
- Air: 12000-20000Hz

**Filter Q (resonance):**
- **0.1-0.7**: Gentle slope, natural rolloff (most acoustic sounds)
- **0.7-1.5**: Standard filter, slight peak (classic synth)
- **2-5**: Resonant peak, emphasized frequency (acid bass, vowel sounds)
- **5-10**: Strong resonance, starting to ring (sci-fi, special FX)
- **10-100**: Self-oscillation, becomes a tone generator (extreme FX)

**Filter envelopes:**
- Typical sweep: Start below target, sweep up during attack/decay, settle at target
- Amount in Hz: how much to sweep
  - Subtle: 500-1500Hz (gentle tonal shift)
  - Moderate: 2000-4000Hz (classic synth sweep)
  - Dramatic: 5000-10000Hz (acid bass, aggressive)
- Negative amount: sweep down (start bright, fade dark)

## Layer Types In Depth

### Oscillator

**Best for:** Synth sounds, basses, leads, pads, sustained tones

**Waveform characteristics:**
- **sine**: Pure fundamental, no harmonics. Soft, round, sub bass.
- **triangle**: Soft odd harmonics. Warm, flute-like, mellow.
- **sawtooth**: All harmonics. Bright, rich, classic synth. Most versatile.
- **square**: Odd harmonics only. Hollow, clarinet-like, video game sounds.

**Unison:**
- Creates thickness by stacking detuned copies
- Voices: 1 = mono, 2-3 = subtle width, 4-8 = thick supersaw
- Detune: 5-15 cents = subtle, 20-50 cents = obvious, 50+ = extreme
- Spread: stereo width, 0 = centered, 1 = wide

**Sub oscillator:**
- Adds octave below for weight
- Level 0.3-0.6 typical for bass sounds
- Use sine for clean sub, square for more harmonics

**Typical oscillator configs:**
- Bass: sawtooth/square, sub level 0.4-0.6, lowpass 200-800Hz
- Lead: sawtooth, unison 2-4 voices, detune 10-20, filter sweep
- Pad: sawtooth/triangle, unison 3-5 voices, slow attack, chorus

### Noise

**Best for:** Transients, breath, texture, hi-hats, cymbals

**Types:**
- **white**: All frequencies equal. Hiss, air, cymbals.
- **pink**: More bass than white. Surf, wind, natural room tone.
- **brown**: Even more bass. Thunder, rumble, very dark.

**Always filter noise** - raw noise is harsh:
- Bandpass: isolate specific frequency range (hi-hat: 6000-12000Hz)
- Lowpass: darker texture (kick thump: 80-150Hz)
- Highpass: remove mud (snare sizzle: >4000Hz)

**Typical uses:**
- Kick thump: brown/pink, bandpass 80-150Hz, fast decay
- Snare body: white, bandpass 200-400Hz, medium decay
- Hi-hat: white, highpass 6000Hz+, very fast decay
- Breath: pink, lowpass 2000-4000Hz, slow attack

### FM (Frequency Modulation)

**Best for:** Electric pianos, bells, metallic tones, complex timbres

**Critical understanding:**
- FM creates sidebands (new frequencies) around the carrier
- modulationIndex controls how many sidebands (0 = none, higher = richer)
- Higher index = more harmonics = brighter, harsher

**Ratio meanings:**
- 1:1 = harmonic (musically consonant)
- 2:1, 3:1, 4:1 = harmonic overtones
- Non-integer = inharmonic (bells, metallic, clangy)
- <1 = sub-harmonic (produces lows below fundamental)

**ModulationIndex practical values:**
- **0.01-0.05**: Subtle harmonic coloration (Rhodes EP, warm FM)
- **0.1-0.3**: Moderate FM character (DX7 EP, bells)
- **0.4-0.7**: Strong FM (brass, aggressive leads)
- **0.8-1.0**: Extreme FM (noise, clangorous)

**Feedback:**
- Creates self-modulation (operator modulates itself)
- 0 = clean
- 0.1-0.3 = subtle edge, harmonics
- 0.3-0.5 = metallic, brass-like
- 0.6-0.9 = harsh, distorted, aggressive
- 0.9+ = noisy, chaotic

**FM operator envelope:**
- Modulates the FM depth over time
- Fast decay = "struck" FM character (piano hammer hitting strings)
- Sustained = steady FM timbre

**modulatesLayer routing:**
- Connect one FM layer's output to another's frequency input
- Stacked FM = richer, more complex timbres
- The modulator layer should have gain: 0 (not heard directly)

### Karplus-Strong

**Best for:** Plucked strings (guitar, harp, pizzicato), struck bars

**WARNING:** Creates instant pluck transient at t=0
- Layer envelope fades in amplitude but can't soften the initial transient
- Results in harp/mandolin/harpsichord character even with slow attack
- **Not ideal for piano** (piano has soft hammer compression)

**Damping perceptual guide:**
- **0-0.1**: Infinite ring, bell-like sustain (bells, singing bowls)
- **0.1-0.3**: Long decay (piano, bass guitar, open strings)
- **0.3-0.5**: Medium decay (acoustic guitar, balalaika)
- **0.5-0.7**: Short decay (muted guitar, dampened strings)
- **0.7-0.9**: Fast pluck (pizzicato, muted pick)
- **0.9-1.0**: Immediate decay (very tight pluck, wood block)

**Inharmonicity perceptual guide:**
- **0**: Pure harmonics, synthetic (computer pluck, idealized string)
- **0.1-0.2**: Subtle stretch (guitar, bass, low piano notes)
- **0.3-0.5**: Piano-like stretch (acoustic piano middle register)
- **0.5-0.7**: Strong stretch (high piano notes, vibraphone)
- **0.7-0.9**: Very inharmonic (glockenspiel, celeste)
- **0.9-1.0**: Bell-like, clangy (tubular bells, chimes)

**Frequency considerations:**
- Lower frequencies need lower damping (longer natural sustain)
- Higher frequencies can use higher damping (brighter, shorter)

## Per-Layer Processing

### Layer Envelopes

**When to use:**
- Different layers need different timing (e.g., fast noise burst + slow oscillator body)
- Spectral evolution (high frequencies decay faster than lows)

**When to skip:**
- Simple sounds with uniform decay
- Rely on master envelope instead

**Typical patterns:**
- Noise layer: Very fast (attack: 0.001, decay: 0.02-0.1)
- Body layer: Moderate (attack: 0.005-0.02, decay: 1-3)
- Sub layer: Slow (attack: 0.01-0.03, decay: 2-4)

### Layer Filters

**Purpose:** Shape individual layers before mixing

**Common uses:**
- Isolate noise to specific band (hi-hat uses only 6000-12000Hz)
- Darken supporting layers (triangle osc at 400Hz for bass body)
- Remove conflicts (cut sub layer above 200Hz)

**With envelope:**
- Creates "formant" movement (vowel sounds, talking synths)
- Brightens during attack, darkens during decay (natural behavior)

### Saturation

**Per-layer waveshaping for harmonic richness**

**Types:**
- **soft**: Gentle compression, tape-like warmth (subtle overdrive)
- **hard**: Clipping distortion, aggressive edge (rock bass, leads)
- **tube**: Warm, asymmetric (vintage amp character)
- **tape**: Smooth saturation (analog tape warmth)

**Drive practical values:**
- **0-0.1**: Subtle warmth, barely audible
- **0.1-0.3**: Gentle coloration (analog modeling)
- **0.3-0.5**: Obvious saturation (driven amp)
- **0.5-0.8**: Heavy distortion (fuzz, overdrive)
- **0.8-1.0**: Extreme clipping (industrial, harsh)

**Mix:**
- 0 = bypass (clean)
- 0.1-0.3 = parallel saturation (keeps dynamics)
- 0.5-0.7 = balanced blend
- 0.8-1.0 = full saturation

## Global Processing

### Master Envelope

**Always applied** - controls overall amplitude

For one-shot sounds (percussion, piano, plucks):
- sustain: 0
- decay: determines body length
- release: tail fadeout (usually short, 0.1-0.6s)

For held notes (organs, synths, pads):
- sustain: 0.5-1.0
- decay: initial falloff (0.1-0.5s typically)
- release: fadeout after key up (0.2-1s)

### Global Filter

**Applied after layer mixing** - overall tone shaping

**When to use:**
- Final tone shaping for all layers together
- Prevent harsh highs
- Remove low mud

**With envelope:**
- Adds movement to entire sound
- Wah-wah effects
- Classic subtractive synth sweep

### LFO (Low Frequency Oscillator)

**Creates periodic modulation**

**Waveform characteristics:**
- sine: Smooth, natural vibrato/tremolo
- triangle: Linear sweep, less smooth
- square: Hard switching, gated effects
- sawtooth: Ramp up/down, sequencer-like
- random: Stepped random values, glitchy

**Targets:**
- **pitch**: Vibrato. Depth 0.02-0.05 = subtle, 0.1+ = obvious
- **filter**: Wah-wah, cycling brightness. Depth 0.3-0.7 typical
- **amplitude**: Tremolo. Depth 0.3-0.6 typical
- **pan**: Auto-pan, stereo movement. Depth 0.5-1.0

**Frequency practical values:**
- **0.1-0.5 Hz**: Very slow sweep (ambient, evolving pads)
- **0.5-2 Hz**: Slow modulation (strings vibrato, slow tremolo)
- **2-6 Hz**: Musical vibrato (brass, vocals, expressive)
- **6-12 Hz**: Fast tremolo, wah effects
- **12-20 Hz**: Extreme, ringy, special FX

## Effects Chain

### Order Matters: EQ → Distortion → Compressor → Chorus → Delay → Reverb → Gate

### EQ (3-band)

**Low band (20-2000Hz):**
- Boost (+3 to +6dB): Add weight, warmth, power
- Cut (-3 to -6dB): Remove mud, tighten low end
- Typical: 80-200Hz for bass control

**Mid band (100-10000Hz):**
- Most important for clarity and presence
- Boost: +2 to +4dB at 1000-3000Hz for presence
- Cut: -3 to -6dB at 300-500Hz to remove boxiness
- Q controls width of boost/cut

**High band (1000-20000Hz):**
- Boost (+2 to +6dB): Add air, brightness, clarity
- Cut (-2 to -4dB): Reduce harshness, tame sibilance
- Typical: 6000-12000Hz for "air"

### Distortion (Global Effect)

**Types:**
- **soft**: Gentle tape/tube saturation
- **hard**: Clipping, aggressive
- **fuzz**: Asymmetric, octave-up harmonics (guitar pedal)
- **bitcrush**: Digital aliasing, lo-fi, retro game
- **waveshaper**: Chebyshev polynomials, rich harmonics

**Different from saturation:**
- Distortion is stronger, more obvious
- Applied to entire mix (vs per-layer saturation)
- Use for intentional grit/edge

### Compressor

**Controls dynamics** - makes loud quieter, quiet louder

**Threshold:** When compression starts
- -60dB = always compressing (everything)
- -30dB = moderate (catches peaks)
- -12 to -18dB = typical (gentle control)
- -6dB = only peaks (subtle)

**Ratio:** How much to compress
- 1:1 = no compression
- 2:1 = gentle (2dB in becomes 1dB out)
- 3-4:1 = moderate (standard music)
- 6-10:1 = heavy compression
- 20:1 = limiting (brick wall)

**Attack/Release:**
- Fast attack (<0.01s): Catches transients, can dull them
- Slow attack (0.02-0.05s): Preserves punch, compresses sustain
- Fast release (<0.1s): Pumping, breathing effect
- Slow release (0.2-0.5s): Smooth, musical

**Knee:**
- 0dB = hard knee (abrupt compression onset)
- 10-20dB = moderate (typical)
- 30-40dB = soft knee (gradual, transparent)

### Chorus

**Creates stereo width and movement via modulated delay**

**Delay time determines character:**
- **1-5ms**: Flanger (metallic sweep, jet plane)
- **10-20ms**: Subtle chorus (slight doubling)
- **20-35ms**: Classic chorus (strings, pads)
- **35-50ms**: Wide chorus (obvious doubling)

**Depth:**
- 0.1-0.3 = subtle shimmer
- 0.4-0.6 = obvious modulation
- 0.7-1.0 = extreme warble

**Rate:**
- 0.1-0.5Hz = slow sweep
- 0.5-2Hz = musical chorus
- 2-5Hz = fast, vibrato-like
- 5-10Hz = extreme, unnatural

### Reverb

**Simulates room/space acoustics**

**Decay = room size:**
- 0.1-0.5s = small room, tight space
- 0.5-1.5s = medium room, studio
- 1.5-3s = large hall, church
- 3-5s = cathedral, canyon

**Damping = surface absorption:**
- 0-0.3 = hard surfaces (tile, concrete) - bright, reflective
- 0.3-0.6 = mixed surfaces (wood, carpet) - natural
- 0.6-0.9 = soft surfaces (curtains, padding) - dark, muted

**Mix:**
- 0.05-0.15 = subtle ambience
- 0.15-0.3 = present room sound
- 0.3-0.5 = obvious reverb
- 0.5+ = washy, distant

### Delay

**Echo effect with feedback**

**Time = echo spacing:**
- 0.01-0.05s = slapback (vintage rockabilly)
- 0.1-0.3s = short echo (vocal double)
- 0.3-0.8s = rhythmic delay (eighth notes ~120 BPM)
- 0.8-2s = long echo (dub, ambient)

**Feedback = number of repeats:**
- 0-0.2 = single echo
- 0.2-0.4 = 2-3 repeats
- 0.4-0.6 = several repeats
- 0.6-0.8 = many repeats
- 0.8-0.9 = near-infinite (dub delay)

## Common Synthesis Patterns

### Acoustic Piano (Without Karplus-Strong)

**Issue:** KS creates instant pluck - sounds like harp/harpsichord

**Solution:** Layered oscillators with filter sweeps
```
Layer 1: Sawtooth (brightness)
- gain: 0.4-0.5
- unison: 2 voices, detune: 10-15 cents
- filter: lowpass 600-800Hz, Q: 0.8-1.2
- filter envelope: amount 3000-4500Hz, attack: 0.015s, decay: 1-1.5s, sustain: 0.1-0.2
- envelope: attack: 0.012-0.018s, decay: 2.5-4s, sustain: 0, release: 0.5-0.8s

Layer 2: Triangle (body)
- gain: 0.4-0.5
- filter: lowpass 400-600Hz, Q: 0.5-0.8
- envelope: attack: 0.01-0.015s, decay: 3-4.5s, sustain: 0, release: 0.6-0.9s

Layer 3: Noise (hammer)
- gain: 0.08-0.12
- type: white or pink
- filter: bandpass 2000-3500Hz, Q: 1.5-2.5
- envelope: attack: 0.001s, decay: 0.04-0.06s, sustain: 0, release: 0.01s

Global:
- envelope: attack: 0.01-0.018s, decay: 2.5-4s, sustain: 0, release: 0.5-0.8s
- reverb: decay: 1.5-2.5s, damping: 0.35-0.5, mix: 0.2-0.35
- compressor: threshold: -18 to -20dB, ratio: 2.5-3.5, attack: 0.005-0.01s
```

### Electric Piano (Rhodes/Wurlitzer)

**Use FM synthesis:**
```
Layer 1: FM operator (tine)
- ratio: 1 (fundamental)
- modulationIndex: 0.012-0.025
- feedback: 0.05-0.12
- envelope: attack: 0.002-0.005s, decay: 1.5-3s, sustain: 0, release: 0.5-1s

Layer 2: FM operator (bell overtone)
- ratio: 2 or 3
- modulationIndex: 0.008-0.015
- feedback: 0
- envelope: faster decay (0.8-1.5s)

Optional Layer 3: Sine or noise (body/click)

Effects: Subtle chorus (depth: 0.1-0.2, mix: 0.1-0.15)
```

### Bass Synth

**Filtered oscillators with slow attack:**
```
Layer 1: Sawtooth or square
- gain: 0.6-0.8
- filter: lowpass 150-300Hz, Q: 1-3
- filter envelope: amount: 1500-3000Hz, attack: 0.02-0.05s, decay: 0.3-0.8s, sustain: 0-0.2
- envelope: attack: 0.02-0.05s (critical for warmth vs pluck)

Layer 2: Sub oscillator feature OR separate sine layer
- gain: 0.4-0.6
- frequency: -1 octave
- filter: lowpass 100Hz (remove harmonics)

No high-frequency content, avoid reverb
```

## Parameter Interactions

### Layer Gain + Master Velocity + Normalize

- Layer gain: relative levels between layers
- Master velocity: overall loudness (0.7-0.9 typical)
- Normalize: scales final output to prevent clipping
- Total layer gains should sum to ~0.8-1.5 range

### Multiple Envelopes

**Hierarchy:**
1. Layer envelope (if present): controls layer amplitude
2. Master envelope (always): controls overall amplitude
3. Both multiply together

**For spectral evolution:**
- High-freq layer: fast decay
- Mid-freq layer: medium decay
- Low-freq layer: slow decay
= Natural sound decay pattern

### Filter Frequency + Q + Envelope

- Base frequency: starting point
- Q: controls resonance/peak
- Envelope amount: adds to frequency over time
- High Q + envelope = dramatic wah/sweep effect

## Known Limitations

1. **Karplus-Strong creates instant transients** - sounds plucked even with slow envelopes
2. **No velocity sensitivity per-layer** - all layers use same velocity
3. **Filters are simple biquads** - no multi-pole or analog modeling
4. **No per-note parameter variation** - all notes use same config
5. **Reverb is algorithmic** - not convolution, may sound artificial
6. **No stereo imaging control** - except unison spread and chorus

## Debugging Tips

**Sound too bright/harsh:**
- Lower filter cutoff frequencies
- Reduce filter Q values
- Cut high EQ band
- Reduce oscillator gain, increase filtered layers

**Sound too dark/muffled:**
- Raise filter frequencies
- Add noise layer for transients
- Boost high EQ band
- Use sawtooth instead of triangle

**Sound too thin:**
- Add sub oscillator or low layer
- Use unison voices (2-4)
- Boost low EQ band
- Check layer gains aren't too low

**Sound too plucky/harpy:**
- Increase attack times (0.01s+)
- Use filter envelopes with moderate amount
- Avoid Karplus-Strong for struck instruments
- Add slow-attack body layers

**Sound too synthetic:**
- Reduce effects (especially chorus, distortion)
- Use subtle saturation instead of distortion
- Lower filter Q values (0.5-1.5)
- Shorter reverb decays (0.8-1.5s)
- Add slight unison detuning (8-15 cents)



