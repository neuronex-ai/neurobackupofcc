# NeuroNex Desktop — Electron Setup Guide

## Architecture Overview

```
neuronex-v1/
├── electron/
│   ├── main.ts              # Electron main process
│   └── preload.ts           # Context bridge (preload script)
├── dist-electron/           # Compiled main process (auto-generated)
│   ├── main.js
│   └── preload.js
├── build/
│   ├── icon.ico             # Windows app icon (multi-size)
│   ├── icon.png             # Source icon (512x512)
│   └── icon_256.png         # Resized source for ICO generation
├── release/                 # Build output (auto-generated)
│   ├── NeuroNex-Desktop-Setup-1.0.0.exe
│   └── win-unpacked/        # Unpacked app directory
├── electron-builder.json5   # electron-builder configuration
├── tsconfig.electron.json   # TypeScript config for Electron
└── src/
    ├── lib/electron.ts      # Electron detection utility
    ├── components/electron/
    │   └── ElectronTitleBar.tsx  # Custom window title bar
    └── pages/desktop/
        └── DesktopHelpCenter.tsx # Desktop-adapted help page
```

## How It Works

### Main Process (`electron/main.ts`)
- Creates a **frameless** `BrowserWindow` (1366×900, min 1024×700)
- Background color `#0A0A0B` (dark theme)
- In **dev**: loads `http://localhost:8080` (Vite dev server)
- In **prod**: loads `dist/index.html` (bundled Vite build)
- **Single instance lock** — prevents multiple windows
- **Custom menu** in Portuguese (Editar, Visualizar, Ajuda)
- IPC handlers for window controls (minimize, maximize, close)

### Preload Script (`electron/preload.ts`)
Safely exposes via `contextBridge`:
- `window.electronAPI.isElectron` — detection flag
- `window.electronAPI.platform` — OS identifier
- `window.electronAPI.appVersion` — app version
- `window.electronAPI.windowControls` — minimize/maximize/close
- `window.electronAPI.onMaximizeChange` — listener for window state
- `window.electronAPI.onNavigate` — menu navigation events

### Electron Detection (`src/lib/electron.ts`)
```ts
import { isElectron } from '@/lib/electron';

if (isElectron()) {
  // Running inside Electron
}
```

### Routing (`src/App.tsx`)
- **Electron**: Uses `HashRouter` (required for `file://` protocol)
- **Web**: Uses `BrowserRouter`
- **Root route `/`**: In Electron → redirects to `/auth`; In web → shows landing page
- **Excluded in Electron**: Landing, About, Blog, Careers, Contact, Newsletter, Legal pages, CookieConsent
- **Electron-only**: Desktop HelpCenter (wrapped in `ProtectedRoute` + `Layout`)

### Custom Title Bar (`ElectronTitleBar.tsx`)
- Frameless window with custom draggable title bar (32px height)
- NeuroNex branding on the left
- Windows-style controls on the right (minimize, maximize/restore, close)
- Close button turns red on hover (Windows convention)
- Body gets `padding-top: 32px` to offset content

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Start Vite + Electron in development |
| `npm run electron:preview` | Build Vite, compile TS, launch Electron |
| `npm run electron:build` | Full production build + NSIS installer |

## NSIS Installer Configuration

- **Language**: Portuguese (Brazil) — `pt_BR` / code `1046`
- **Mode**: Not one-click (shows install wizard)
- **Installation**: Per-user (no admin required), changeable directory
- **Shortcuts**: Desktop + Start Menu
- **Run after finish**: Yes
- **Installer name**: `NeuroNex-Desktop-Setup-{version}.exe`

## Pages Included in Desktop Build

### Authentication
- `/auth` — Login/Register
- `/create-account` — Account creation
- `/account-created` — Success page
- `/email-confirmed` — Email confirmation
- `/reset-password` — Password reset
- `/google-connection-success` — Google OAuth callback

### Professional (ProtectedRoute)
- `/dashboard` — Main dashboard
- `/agenda` — Scheduling calendar
- `/pacientes` — Patient list
- `/pacientes/:id` — Patient detail
- `/notas` — Clinical notes
- `/financeiro` — Financial management
- `/ajustes` — Settings
- `/teleconsulta` — Video consultation
- `/synapse-ai` — AI Chat assistant
- `/neurozap` — WhatsApp integration
- `/clinic-dashboard` — Clinic overview
- `/relatorios` — Performance reports
- `/help` — Desktop Help Center (adapted)

### Patient
- `/portal` — Patient portal

### Utility
- `/confirmar-agendamento/:token` — Appointment confirmation
- `/join/:appointmentId` — Join session
- `/payment/callback` — Payment callback

## Excluded from Desktop Build
- `/` (Landing page / Index)
- `/about`, `/blog`, `/careers`, `/contact`
- `/newsletter`, `/neurobank`
- `/legal`, `/politica-de-privacidade`, `/termos-de-uso`
- `/configuracoes-de-cookies`
- CookieConsent component