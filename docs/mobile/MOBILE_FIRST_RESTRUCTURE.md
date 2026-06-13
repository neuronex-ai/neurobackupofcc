# NeuroNex Mobile-First Restructure

Status: active

This document is the execution contract for the protected mobile application. The goal is to bring the mobile experience to the same product quality as the desktop experience without destabilizing validated business flows, especially NeuroFinance, appointment scheduling, payments, PIN validation, transfers, billing, and account onboarding.

## Non-negotiable constraints

- Preserve validated NeuroFinance service hooks and banking operations.
- Keep Gestão Financeira available independently of NeuroFinance onboarding.
- Apply plan locks to exclusive capabilities, not to the entire Financeiro entry point.
- Implement light and dark themes together.
- Do not present simulated actions as successfully completed.
- Keep clinical and financial data behind authenticated routes and RLS.
- Use additive database migrations before removing legacy structures.
- Introduce risky session and notification changes behind recoverable flows.

## Current audit

### Shared mobile shell

Status: partially mobile-first.

Findings:

- `MobileLayout` centralizes the top bar, notification sheet, and bottom navigation.
- Several pages still recreate their own top bars, spacing, search interactions, and navigation behavior.
- The `showNav` prop existed in the interface but was ignored by `MobileLayout`, so consumers such as the mobile notes editor could not reliably hide the global navigation.
- The notification sheet used a permanently dark background even when the app was in light mode.
- Different pages use different top offsets and bottom paddings, creating keyboard, safe-area, and double-scroll risks.

### Dashboard

Status: redesigned and considered the visual reference for the new mobile system.

Action:

- Preserve the current command-center structure.
- Migrate only shared shell, notifications, and primitives when required.

### Agenda

Status: functional, but internally custom.

Strengths:

- Week and month views.
- Date-specific loading.
- Search and month bottom sheet.
- Direct routing to teleconsulta and patient details.

Risks:

- Custom draggable sheet has its own snap logic and must be tested against safe areas and browser viewport resizing.
- `NewAppointmentModal` is shared with desktop and must be audited for keyboard and narrow-width behavior.
- Header and search interaction are page-specific rather than shared.

### Patients and patient detail

Status: mixed desktop/mobile architecture.

Findings:

- The patients list still contains its own mobile top bar, side menu, notification sheet, and navigation state instead of using the shared mobile shell.
- This duplicates notifications and navigation logic.
- Patient detail has a dedicated mobile implementation but must be checked for large forms, tabs, keyboard behavior, and clinical-data density.

### Notes

Status: mostly mobile-oriented.

Findings:

- Dedicated list and editor components already exist.
- Search and create controls are mobile-sized.
- The editor requests navigation hiding through `showNav`, but the shared layout previously ignored that prop.
- Autosave, offline recovery, and explicit save state remain to be validated.

### Teleconsulta and pre-join

Status: real device readiness implemented; shared transcription still pending.

Findings:

- Desktop and mobile maintain separate transcript, notes, and session state.
- Online transcription can receive Jitsi transcription events.
- Desktop additionally uses browser speech recognition for local speech.
- Session notes and transcript backups rely on `localStorage`.
- In-person sessions do not yet have a persistent shared capture/transcription flow.
- Mobile and desktop now use one media-readiness engine for permissions, preview, device selection, microphone level, network classification, and recoverable errors.
- Selected camera, microphone, output device, and initial mute state are forwarded to the embedded Jitsi meeting.
- Current session finalization can generate a clinical draft immediately from notes and transcript. The new flow must require review before the final clinical record is confirmed.

Risk: critical until steps 3–5 are complete.

### Synapse

Status: desktop-first shell, partial mobile availability.

Findings:

- The global Synapse shell is explicitly hidden on mobile.
- Daily intelligence currently includes hard-coded simulated suggestions and artificial scan delays.
- Voice integration exists through Gemini Live, but the mobile interaction model is not a dedicated mobile-first experience.
- The mobile version must never report simulated scans or actions as real operations.

Risk: high.

### Gestão Financeira and NeuroFinance

Status: mixed concepts on mobile.

Findings:

- The current mobile entry can present NeuroFinance onboarding before exposing management.
- The page header combines “NeuroFinance” with “Gestão de Caixa”.
- Manual management metrics and real banking account information appear in the same screen.
- Validated banking hooks must remain unchanged while navigation and presentation are separated.

Risk: high because banking flows are already validated.

### Ajustes

Status: partially real, partially simulated, and partially desktop-adapted.

Real or connected areas include profile, Google integration, communication templates, fiscal settings, organizations, notification preferences, and security components.

Known gaps:

- Some SMS child preferences only exist in local component state.
- Integration suggestions are stored in `localStorage` while the interface reports them as registered.
- Several wide desktop panels are rendered inside narrow mobile pages.
- There is no consistent status language for connected, unavailable, locked, pending, or coming-soon capabilities.

Risk: high because settings communicate product truth.

### Notifications

Status: derived alert panel, not a persistent notification center.

Findings:

- Alerts are recalculated from current agenda, patient, and financial data.
- Desktop “viewed” state is local to the navbar component.
- Dismissals are stored in `sessionStorage`.
- Read and dismissed state do not synchronize between mobile and desktop.
- Preferences are persisted, but not every visible option maps to an implemented delivery channel.
- The mobile sheet and desktop popover consume the same alert component, which is a useful migration point.

Risk: critical.

## Reusable mobile foundation

The following primitives are introduced before page-by-page refactors:

- `MobilePageScaffold`
- `MobilePageHeader`
- `MobileSectionHeader`
- `MobileSegmentedControl`
- `MobileStatusBanner`
- `MobileEmptyState`
- `MobileErrorState`
- `MobileSkeletonCard`
- `MobileStickyActions`
- `MobileActionListItem`

Rules:

- One vertical scroll owner per screen.
- No action dependent on hover.
- Primary actions remain reachable above the keyboard and safe area.
- Immersive screens may hide the global top and bottom navigation without entering onboarding mode.
- All primitives support light and dark mode.
- Every data screen must define loading, empty, error, offline, and retry behavior.

## Step 2 implementation

Implemented shared files:

- `src/hooks/use-media-readiness.ts`
- `src/components/teleconsulta/MediaReadinessPanel.tsx`
- `src/components/teleconsulta/DesktopTeleconsultationLobby.tsx`
- `src/mobile/components/MobileTeleconsultationLobby.tsx`

Capabilities delivered:

- Camera preview.
- Camera and microphone permission handling.
- Camera, microphone, and audio-output selection where supported.
- Live microphone input meter.
- Audio-only fallback.
- Network state classification using available browser information.
- Error states for blocked permission, missing device, busy device, unsupported browser, and insecure context.
- Mobile safe-area and keyboard-safe layout.
- Device handoff and initial mute state to Jitsi.
- Audio-only pre-join for in-person sessions, ready for the shared transcription engine.

## 12-step execution pipeline

1. **Mobile audit and shared foundation**
   - Audit current protected mobile screens.
   - Fix shared shell contract.
   - Add reusable primitives.
   - Do not change business logic.

2. **Real pre-join**
   - Camera and microphone permissions.
   - Device preview and selection.
   - Input level and connection readiness.
   - Browser-specific recovery instructions.

3. **Shared transcription engine**
   - One state machine for online and in-person sessions.
   - Local recovery plus Supabase persistence.
   - Segment model, consent, pause, resume, finalization.

4. **Mobile online and in-person session workspace**
   - Session, transcript, and notes views.
   - Keyboard-safe controls.
   - Review before generating the clinical draft.

5. **Desktop online and in-person session workspace**
   - Reuse the shared engine.
   - Preserve Jitsi integration and existing controls.

6. **Persistent notifications**
   - Database-backed read and dismissed state.
   - Shared desktop/mobile hooks.
   - Realtime synchronization and deep links.

7. **Real settings and preferences**
   - Remove simulated success states.
   - Persist each exposed option or mark it unavailable.
   - Mobile detail pages with sticky save actions.

8. **Gestão Financeira mobile**
   - Dedicated management navigation and views.
   - Available without banking onboarding.

9. **NeuroFinance mobile**
   - Dedicated banking navigation.
   - Preserve validated service flows.
   - Move onboarding and locks inside banking-only routes.

10. **Synapse mobile**
    - Dedicated chat and voice experience.
    - Remove simulated intelligence and artificial scans.
    - Clear execution, confirmation, and error states.

11. **Remaining mobile screens**
    - Agenda, patients, patient detail, notes, fiscal, and all shared modals.

12. **Quality and rollout**
    - Device matrix, plan matrix, permission failures, network failures, recovery, RLS, and feature flags.

## Validation gates

Each step is validated before the next one begins.

Minimum validation for every mobile page:

- 360 px, 390 px, 412 px, and 430 px widths.
- Light and dark themes.
- Android Chrome and iPhone Safari behavior.
- Keyboard open and closed.
- Safe-area top and bottom.
- Loading, empty, error, and retry states.
- Back navigation and deep-link behavior.
- No regression to protected desktop routes.

## Step status

- [x] Step 1 — audit document and shared primitives created.
- [x] Step 2 — real pre-join implemented on mobile and desktop.
- [ ] Step 3 — shared transcription engine.
- [ ] Step 4 — mobile session workspace.
- [ ] Step 5 — desktop session workspace.
- [ ] Step 6 — persistent notifications.
- [ ] Step 7 — real settings.
- [ ] Step 8 — Gestão Financeira mobile.
- [ ] Step 9 — NeuroFinance mobile.
- [ ] Step 10 — Synapse mobile.
- [ ] Step 11 — remaining screens and modals.
- [ ] Step 12 — quality and rollout.
