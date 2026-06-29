# Security posture for an open repository

Last updated: 2026-06-29

The project must remain secure even if the source code is visible.

## Non-negotiables

- Never trust frontend route guards, hidden buttons, browser storage, or client-side role checks.
- Keep `service_role`, provider API keys, R2 credentials, webhook secrets, OAuth client secrets, and signing keys only in server-side secret stores.
- Keep R2 as the private object store for patient/professional documents. Supabase stores relational metadata and authorization state.
- Default Supabase Edge Functions to `verify_jwt = true`. Public exceptions must be intentional: webhook, OAuth callback, public invite/token flow, availability lookup, or maintenance endpoint protected by its own secret.
- Never expose provider-native finance language in product UI unless legally required. Use NeuroFinance/NeuroNex user-facing language.
- Patient and professional accounts must remain separate. Backend authorization must enforce the separation even if a user manually calls APIs.
- `SECURITY DEFINER` functions must have fixed `search_path`, explicit owner checks or token checks, and restricted `EXECUTE` grants.
- Public buckets must not allow broad object listing. Private patient documents must not use public Supabase Storage URLs.

## Current source of truth

- Frontend: `src`
- Supabase functions: `supabase/functions`
- Supabase schema changes: `supabase/migrations`
- R2 document flow: `r2-create-upload-url` Edge Function plus `document_files` metadata
- Financial provider: Asaas BaaS v3 through NeuroFinance

## Legacy providers that must not return

Stripe, C6, Focus NFe, Twilio, ElevenLabs, MoltBook, Synapse Heartbeat, and Google Sheets are legacy. Do not add code, tables, functions, docs, or UI for them.

## Before merging security-sensitive work

Run:

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

For Supabase changes, also verify the relevant Cloud state directly with `npx supabase db query --linked` or the Supabase dashboard.
