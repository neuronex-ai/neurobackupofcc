# Step 4 — Mobile session workspace

Status: implemented in the mobile clinical flow.

## Delivered

- One workspace for online and in-person sessions.
- Explicit consent gate before any transcription begins.
- Session, transcript, notes, and review views.
- Jitsi remains mounted while the professional changes workspace views.
- In-person speech recognition uses the shared transcript engine.
- Pause, resume, recovery, offline, pending-sync, and error states.
- IndexedDB-backed notes draft with localStorage fallback.
- Safe-area aware footer and keyboard-aware notes editing.
- Mandatory professional review before AI generation.
- Explicit option to complete without AI while preserving the draft for later processing.
- Appointment metadata now stores transcript, summary, draft, and completion references.

## Clinical safeguards

1. Joining the session does not start transcription automatically.
2. Declining consent never blocks the session.
3. Revoking or pausing capture stops local speech recognition immediately.
4. A restored recording requires an explicit resume action.
5. Completing a session requires connectivity so the final state is not lost.
6. AI generation stays disabled until the professional confirms review.
7. Completing without AI stores the pending draft in appointment metadata.

## Main files

- `src/mobile/components/MobileActiveSession.tsx`
- `src/components/teleconsulta/TranscriptionConsentPanel.tsx`
- `src/hooks/use-session-capture.ts`
- `src/hooks/use-resilient-session-notes.ts`
- `src/components/teleconsulta/JitsiMeet.tsx`
- `src/lib/appointment-metadata.ts`

## Validation checklist

- Online session with consent granted.
- Online session with consent declined.
- In-person session on a supported browser.
- In-person session on an unsupported browser.
- Pause and resume transcription.
- Close and reopen after local recovery.
- Lose and restore connectivity with pending segments.
- Edit notes while the mobile keyboard is open.
- Review and generate a clinical draft.
- Complete without AI and verify the pending draft metadata.
