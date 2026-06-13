# Step 5 - Desktop online and in-person session workspace

Status: implemented on top of the shared persistent capture engine.

## Delivered

- Desktop sessions now use `useSessionCapture` and the same Supabase transcript records used by mobile.
- Online and in-person appointments can enter the desktop clinical workspace.
- Four functional areas remain available during the session: session/video, transcript, notes, and patient context.
- Jitsi remains mounted while the professional works in transcript and notes.
- Explicit consent is required before capture starts.
- In-person capture uses browser speech recognition when available.
- Transcript segments and notes have local recovery and persistent synchronization.
- Capture can be paused, resumed, and retried after connection failures.
- Ending a session opens a mandatory review instead of immediately generating a record.
- Transcript and notes can be corrected in the review screen before AI generation.
- The professional can complete without AI and preserve the draft for later.
- Appointment metadata keeps transcript, summary, pending draft, and completion references without removing existing metadata.

## Safety behavior

1. Joining never starts capture before consent.
2. Declining consent never blocks the session.
3. The recording indicator reflects the shared capture state, not local UI state.
4. Completion waits for transcript synchronization.
5. The appointment is marked attended only after the professional confirms the final action.
6. AI output remains a draft and is never written without professional review.
7. Offline content is preserved, but final completion requires connectivity.

## Main files

- `src/components/teleconsulta/ActiveSessionPanel.tsx`
- `src/components/teleconsulta/DesktopClinicalSession.tsx`
- `src/components/teleconsulta/DesktopSessionStage.tsx`
- `src/components/teleconsulta/DesktopSessionWorkspace.tsx`
- `src/components/teleconsulta/DesktopSessionReviewDialog.tsx`
- `src/components/teleconsulta/SessionControls.tsx`
- `src/hooks/use-desktop-clinical-session.ts`
- `src/pages/Teleconsulta.tsx`
