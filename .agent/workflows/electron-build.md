---
description: how to build the NeuroNex Desktop Electron installer for Windows
---

# Build NeuroNex Desktop Installer

## Prerequisites
- Node.js v22+
- npm installed
- All dependencies installed (`npm install --legacy-peer-deps`)

## Development Mode
// turbo
1. Run `npm run electron:dev` — this starts Vite dev server on port 8080 and launches Electron pointing to it.

## Build the Installer

// turbo
2. Compile the Electron main process TypeScript:
```
npx tsc -p tsconfig.electron.json
```

// turbo
3. Rename compiled JS to CJS (Fixes ES Module error):
```
node scripts/rename-cjs.cjs
```

// turbo
4. Build the Vite frontend:
```
npx vite build
```

4. Build the NSIS installer:
```
npx electron-builder --win --config electron-builder.json5
```

## Or Build Everything at Once

5. Run the full build pipeline:
```
npm run electron:build
```

## Output
- Installer: `release/NeuroNex-Desktop-Setup-{version}.exe`
- Unpacked app: `release/win-unpacked/`

## Regenerate Icon
If you need to regenerate the icon from a new PNG source:
// turbo
6. Place a 256x256+ PNG at `build/icon_256.png`
// turbo
7. Run `node scripts/create-ico.cjs`

## Notes
- The `base` in `vite.config.ts` is set to `"./"` for Electron file:// protocol compatibility.
- The app uses `HashRouter` in Electron mode (vs `BrowserRouter` for web).
- Landing pages, blog, careers, and other public pages are excluded from the Electron build.
- The Help page is replaced with a desktop-adapted version inside the app Layout.
- `npmRebuild` is set to `false` in `electron-builder.json5` because we don't ship native modules.
