# usb browser (beta)

Manage OP-Z packs directly from the browser using the File System Access API.

## requirements
- Chromium-based browser with `showDirectoryPicker` and `showOpenFilePicker` support.
- OP-Z mounted in content mode. You’ll be prompted to select the device root.

## what it scans
- `sample packs/` → tracks `1-kick`, `2-snare`, `3-perc`, `4-sample`
- Slots `01`–`10` under each track. A file beginning with `~` is marked as duplicate.

## actions
- **Upload**: Pick an `.aif/.aiff` and write it into the chosen slot (one file per slot).  
- **Delete**: Remove the current file from the slot.  
- **Refresh**: Re-scan after changes or reconnection.

## caveats
- Safari/Firefox lack the required FS API; use Chrome or Edge.  
- If the OP-Z is not mounted, connection shows “Disconnected”; mount and refresh.  
- Writing very large files can fail silently—keep packs within OP-Z limits (~11.8s total, mono/16-bit/44.1k).
