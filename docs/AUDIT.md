# OP Done Codebase Audit

**Date:** 2025-01-13  
**Status:** Pre-cleanup

## Executive Summary

This audit identifies unused code, legacy patterns, missing tests, and documentation gaps across the OP Done codebase. The app has evolved through multiple implementation approaches, leaving vestigial code and inconsistencies.

---

## Critical Issues

### 1. **ESLint Configuration Broken**
- **Location:** `eslint.config.js`
- **Issue:** ESLint fails with "pLimit is not a function" error
- **Impact:** Cannot run linter, code quality checks disabled
- **Action:** Fix or replace ESLint config

### 2. **Sound Creation Feature Incomplete**
- **Location:** `src/pages/SoundCreation.tsx`, `src/audio/synthesizer.ts`, `src/services/openai.ts`
- **Issue:** 
  - OpenAI integration uses non-existent model `gpt-5.1`
  - Complex synthesizer with unused LFO logic
  - No tests for synthesis engine
  - Feature not documented in README
- **Impact:** Feature is non-functional, adds ~500 lines of dead code
- **Action:** Remove or complete feature

### 3. **Duplicate Utility Functions**
- **Location:** `src/audio/pitch.ts` vs `src/utils/audio.ts`
- **Issue:** `frequencyToNote` and `semitonesToPitchParam` re-exported from utils
- **Impact:** Confusing import paths, maintenance burden
- **Action:** Consolidate to single location

---

## Code Quality Issues

### 4. **Missing Tests**
**Files without tests:**
- `src/audio/classify.ts` - Complex classification logic
- `src/audio/convert.ts` - Audio conversion
- `src/audio/ffmpeg.ts` - FFmpeg wrapper
- `src/audio/pack.ts` - Pack building
- `src/audio/pitch.ts` - Pitch detection
- `src/audio/synthesizer.ts` - Synthesis engine
- `src/hooks/useSlices.ts` - Core state management
- `src/services/openai.ts` - API integration
- `src/components/*` - All React components

**Existing tests:**
- `src/audio/aiff.test.ts` ✓
- `src/utils/array.test.ts` ✓
- `src/utils/audio.test.ts` ✓
- `src/utils/dsp.test.ts` ✓
- `src/utils/metadata.test.ts` ✓
- `src/utils/naming.test.ts` ✓
- `src/utils/opz.test.ts` ✓

**Action:** Add tests for core audio modules

### 5. **Unused/Legacy Code**

#### `src/audio/classify.ts`
- **Issue:** Full audio classification system (drum vs melodic)
- **Usage:** Called in `useSlices.addFiles()` but results barely used
- **Impact:** Adds complexity, slows file import
- **Action:** Simplify or remove if not needed for UI

#### `src/pages/DrumPackPage.tsx`
- **Issue:** File exists but not referenced in routing
- **Location:** Check `src/main.tsx` routes
- **Action:** Remove if unused, or add to navigation

#### `legacy-scripts/` directory
- **Issue:** Contains old OP-1 Drum Utility app and teoperator Go code
- **Impact:** 50+ MB of unused binaries and source
- **Action:** Move to separate archive repo or delete

#### `docs/features/` - Outdated specs
- `audio-classification.md` - Implemented but not documented in README
- `llm-sound-creation.md` - Incomplete feature
- `navigation-and-analyzer.md` - Partially implemented
- `pitch-detection-control.md` - Implemented
- `sound-creation.md` - Incomplete
- `wishlist.md` - Unorganized ideas
- **Action:** Consolidate into single feature doc, archive wishlist

### 6. **Inconsistent Naming**
- `src/pages/DrumCreator.tsx` vs `src/pages/SampleAnalyzer.tsx` vs `src/pages/SoundCreation.tsx`
- Inconsistent: `DrumCreator` (noun) vs `SoundCreation` (noun) vs `SampleAnalyzer` (noun)
- **Action:** Standardize to `*Page` suffix or remove suffix entirely

### 7. **Magic Numbers**
- **Location:** Throughout codebase
- **Examples:**
  - `src/audio/classify.ts`: `0.5`, `0.35`, `3`, `0.45`, `300`, `4000`, etc.
  - `src/audio/synthesizer.ts`: `0.5`, `0.7`, `2`, etc.
- **Action:** Extract to named constants with comments

---

## Documentation Issues

### 8. **Missing User Documentation**
**Needed:**
- How to use Drum Creator (step-by-step)
- How to use Sample Analyzer (what it shows)
- Sound Creation feature guide (if keeping)
- Troubleshooting guide (common errors)
- FAQ (file formats, duration limits, etc.)

**Action:** Create `docs/USER_GUIDE.md`

### 9. **Missing Developer Documentation**
**Needed:**
- How audio classification works
- How pitch detection works
- How OP-Z metadata format works (exists but incomplete)
- How to add new features
- How to run tests

**Action:** Expand `docs/ARCHITECTURE.md`, create `docs/DEVELOPMENT.md`

### 10. **Outdated README**
- **Issue:** README mentions "Synth sample clipper (6s limit) is next on roadmap" but Sound Creation exists
- **Issue:** No mention of Sample Analyzer or Sound Creation features
- **Action:** Update README with current features

---

## Architecture Issues

### 11. **Inconsistent Error Handling**
- Some functions return `null` on error
- Some throw exceptions
- Some log to console and continue
- **Examples:**
  - `src/audio/metadata.ts`: Returns 0 on error
  - `src/audio/classify.ts`: Returns `{ type: 'unknown', confidence: 0 }`
  - `src/audio/pitch.ts`: Returns `{ note: null, frequency: null }`
- **Action:** Standardize error handling pattern

### 12. **Mixed Async Patterns**
- Some functions use `async/await`
- Some use `.then()` chains
- Some mix both
- **Example:** `src/pages/DrumCreator.tsx` `handlePlay()` mixes patterns
- **Action:** Standardize to `async/await`

### 13. **Large Component Files**
- `src/pages/DrumCreator.tsx`: 400+ lines
- Contains multiple sub-components (`WaveformPreview`, `SliceList`)
- **Action:** Extract to separate component files

---

## Performance Issues

### 14. **Inefficient Waveform Rendering**
- **Location:** `src/pages/DrumCreator.tsx` `WaveformPreview`
- **Issue:** Decodes entire audio file for tiny 48x32 canvas
- **Impact:** Slow on large files, memory intensive
- **Action:** Use downsampled data or cache decoded buffers

### 15. **No Memoization in Classification**
- **Location:** `src/audio/classify.ts`
- **Issue:** Re-classifies same file if re-added
- **Action:** Cache results by file hash or name

---

## Security/Safety Issues

### 16. **No Input Validation**
- **Location:** File upload handlers
- **Issue:** No file size limits, no MIME type validation
- **Impact:** Could crash browser with huge files
- **Action:** Add max file size check (e.g., 50 MB)

### 17. **Unhandled Promise Rejections**
- **Location:** Multiple async functions
- **Issue:** Some promises not caught
- **Action:** Add `.catch()` or `try/catch` everywhere

---

## Dependency Issues

### 18. **Unused Dependencies**
- Check if all `package.json` deps are actually imported
- **Action:** Run `npx depcheck` and remove unused

### 19. **Missing Type Definitions**
- Some `any` types in codebase
- **Examples:** `src/pages/DrumCreator.tsx`: `audioRef.current = { pause: () => source.stop(), currentTime: 0 } as any`
- **Action:** Add proper types

---

## File Organization Issues

### 20. **Flat `src/audio/` Directory**
- All audio modules in one folder
- **Suggestion:** Group by domain:
  - `src/audio/analysis/` - classify, pitch
  - `src/audio/processing/` - convert, ffmpeg
  - `src/audio/format/` - aiff, metadata, pack
  - `src/audio/synthesis/` - synthesizer

### 21. **Mixed Concerns in `src/utils/`**
- Contains both pure functions and tests
- **Action:** Keep utils pure, tests in `__tests__/` subdirs

---

## Testing Issues

### 22. **No Integration Tests**
- Only unit tests for utils
- No tests for full export flow
- **Action:** Add integration test: files → AIFF → verify metadata

### 23. **No E2E Tests**
- No browser automation tests
- **Action:** Consider Playwright for critical flows

---

## Build Issues

### 24. **No Type Checking in CI**
- `package.json` has `typecheck` script but not in workflow
- **Action:** Add to pre-commit or CI

### 25. **No Bundle Size Monitoring**
- Could grow unbounded
- **Action:** Add bundle size check to CI

---

## Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Fix ESLint config | Low | High |
| P0 | Remove/fix Sound Creation | Medium | High |
| P1 | Add missing tests | High | High |
| P1 | Update README | Low | Medium |
| P1 | Remove legacy-scripts | Low | Low |
| P2 | Consolidate docs | Medium | Medium |
| P2 | Extract magic numbers | Medium | Low |
| P2 | Standardize error handling | Medium | Medium |
| P3 | Refactor large components | High | Low |
| P3 | Optimize waveform rendering | Medium | Low |

---

## Recommended Actions

### Phase 1: Critical Cleanup (1-2 hours)
1. Fix ESLint configuration
2. Remove or stub out Sound Creation feature
3. Delete `legacy-scripts/` directory
4. Update README with current features
5. Remove unused feature docs

### Phase 2: Code Quality (2-3 hours)
6. Add tests for core audio modules
7. Consolidate duplicate utilities
8. Extract magic numbers to constants
9. Standardize error handling
10. Add input validation

### Phase 3: Documentation (1-2 hours)
11. Create comprehensive user guide
12. Expand developer documentation
13. Document audio classification
14. Document pitch detection

### Phase 4: Refactoring (3-4 hours)
15. Extract sub-components from DrumCreator
16. Reorganize `src/audio/` by domain
17. Optimize waveform rendering
18. Add bundle size monitoring

---

## Success Metrics

- [ ] `bun run lint` passes with 0 errors
- [ ] `bun test` passes with >80% coverage on core modules
- [ ] README accurately describes all features
- [ ] No unused files in `src/`
- [ ] All magic numbers extracted to constants
- [ ] User guide covers all three tools
- [ ] Developer guide explains architecture

---

## Notes

- Codebase shows signs of rapid iteration (good!)
- Core drum pack functionality is solid
- Main issue is accumulated experimental features
- Focus on consolidation over new features
