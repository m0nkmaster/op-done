# OP Done - A utility app for Teenage Engineering OP devices

This is a tool to help with creating sample packs, synth settings and other tbc useful things with Teenage Engineering devices. Currently only tested for the OP-Z.

Useful docs for the OP-Z are in the [Guides folder](./../../docs/guides).

## Features

### Drum sample packs

Single 12 second loops with up to 24 single samples. Each sample is normanalized, and all settings defined. See an existing app which already does this in [OP-1 Drum Utility](./../../legacy-scripts/OP-1 Drum Utility.app). 

Basic MVP. Accepts files and then combines them into a single file combined. Limits to 12 seconds saves in correct format based on the [Legacy Script](./../../legacy-scripts/to-opz.sh).

### Synth Samples

Take an existing sample (wav, mp3...) and converts to a clip with the required length (tbc I think 6 seconds).

---

All samples need to be in the correct AIF format. 

---

Repo:
git@github.com:m0nkmaster/op-done.git