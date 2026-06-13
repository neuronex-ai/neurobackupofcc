# Step 3 — Shared session transcription engine

Status: infrastructure complete; mobile and desktop workspace adoption follows in Steps 4 and 5.

## Delivered

- Persistent transcript sessions for online and in-person care.
- Ordered, idempotent transcript segments.
- Explicit consent states and consent method.
- Recording, pause, reconnect, finalization, review, error, and abandonment states.
- IndexedDB recovery with localStorage fallback.
- Offline queue and incremental synchronization.
- Supabase RLS scoped to the authenticated professional.
- Realtime publication for transcript sessions and segments.
- Jitsi and browser-speech source adapters.
- Shared capture adapter for online and in-person sessions.
- Shared clinical consent component.
- Browser speech-recognition adapter with controlled restart and recoverable errors.

## Database

- `public.session_transcripts`
- `public.session_transcript_segments`

The database migration is additive and tracked in:

- `supabase/migrations/20260613045900_prepare_shared_session_transcription_engine.sql`
- `supabase/migrations/20260613050000_create_shared_session_transcription_engine.sql`

## Frontend foundation

- `src/hooks/use-session-transcript-engine.ts`
- `src/hooks/use-session-capture.ts`
- `src/hooks/use-speech-recognition.ts`
- `src/hooks/use-jitsi-token.ts`
- `src/components/teleconsulta/TranscriptionConsentPanel.tsx`

## Product rules

1. No audio capture before explicit consent is recorded.
2. A declined consent never blocks the clinical session; it only disables transcription.
3. Revoking consent pauses capture immediately.
4. Temporary local recovery is not treated as a clinical record.
5. A finalized transcript must be reviewed before generating the clinical draft.
6. Raw transcript retention is controlled separately from the generated clinical note.
7. Online and in-person sessions use the same persistence model.

## Handoff to Step 4

The mobile session workspace will consume the shared engine and add:

- consent gate;
- session, transcript, and notes views;
- pause and resume controls;
- offline and synchronization feedback;
- review before clinical draft generation;
- keyboard and safe-area behavior;
- explicit completion and recovery states.
