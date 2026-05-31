# Edge Functions — JWT Verification Status

## ⚠️ Functions that MUST keep `verify_jwt: false` (webhooks/public access)
These receive external HTTP calls from third-party services or public users:

- `stripe-webhook` — Stripe webhook events
- `stripe-webhook-handler` — Stripe webhook processing
- `jitsi-webhook` — Jitsi webhook events
- `jitsi-webhook-handler` — Jitsi webhook processing
- `jitsi-guest-token` — Guest token for video calls
- `confirm-appointment` — Public appointment confirmation
- `get-appointment-by-token` — Token-based appointment access
- `get-public-appointment-details` — Public booking page
- `get-public-availability` — Public availability check
- `process-public-appointment` — Public appointment creation
- `google-auth-callback` — Google OAuth callback
- `google-auth-init` — Google OAuth initiation
- `microsoft-auth-callback` — Microsoft OAuth callback
- `microsoft-auth-init` — Microsoft OAuth initiation
- `notion-auth-callback` — Notion OAuth callback
- `todoist-auth-callback` — Todoist OAuth callback
- `notion-webhook` — Notion webhook events
- `todoist-webhook` — Todoist webhook events

## 🔒 Functions that SHOULD have `verify_jwt: true` (user-facing actions)
These perform privileged operations and must verify the user's identity:

### CRITICAL (data mutation / sensitive)
- `delete-user-account` — Deletes a user account
- `whatsapp-send` — Sends WhatsApp messages
- `whatsapp-agent` — WhatsApp AI agent
- `whatsapp-sync` — Syncs WhatsApp data
- `send-reminder-email` — Sends emails
- `send-monthly-report` — Sends financial reports
- `send-document-email` — Sends document emails
- `send-gmail` — Sends emails via Gmail
- `send-google-invite` — Creates Google Calendar invite
- `send-patient-invite` — Sends patient portal invite
- `send-session-invite` — Sends session link
- `send-reminder` — Sends appointment reminder
- `send-appointment-reminder` — Sends appointment reminder
- `twilio-sms` — Sends SMS messages

### HIGH (financial operations)
- `stripe-connect-init` — Initiates Stripe onboarding
- `stripe-create-payout` — Creates a payout
- `stripe-invoice-generate` — Generates invoices
- `stripe-manage-external-accounts` — Manages bank accounts
- `stripe-process-split` — Processes payment splits
- `stripe-dashboard-link` — Gets Stripe dashboard link
- `create-checkout-session` — Creates payment session
- `create-payment-session` — Creates payment flow
- `create-appointment-payment-intent` — Creates payment intent
- `verify-checkout-session` — Verifies payment
- `check-invoice-status` — Checks invoice
- `issue-focus-nfe` — Issues NFS-e
- `issue-invoice-focusnfe` — Issues invoice via Focus NFe
- `verify-financial-pin` — Verifies financial PIN

### MEDIUM (AI & data processing)
- `gemini-text-chat` — AI chat
- `gemini-text-transform` — AI text processing
- `generate-clinical-diagram` — Generates diagrams
- `generate-session-prontuario` — Generates session notes
- `generate-summary` — Generates summaries
- `get-voice-config` — Voice AI config
- `moltbook-agent` — Newsletter agent

### LOW (integration management)
- `google-calendar-sync` — Syncs calendar
- `google-calendar-manage` — Manages calendar
- `google-calendar-poll` — Polls calendar
- `google-drive-files` — Lists Drive files
- `google-sheets-init` — Inits Sheets
- `google-sheets-sync` — Syncs Sheets
- `google-suite-action` — Google Suite actions
- `google-auth-status` — Checks auth status
- `notion-auth-init` — Notion auth
- `notion-pages` — Notion pages
- `todoist-auth-init` — Todoist auth
- `evolution-manager` — Evolution API
- `synapse-heartbeat` — AI heartbeat
- `validate-crp` — CRP validation
- `invite-patient` — Patient invitation
- `invite-patient-user` — Patient user invitation

## How to update
For each function in the 🔒 list, re-deploy with `verify_jwt: true`:
```bash
supabase functions deploy <function-name> --verify-jwt
```
Or update via the Supabase Dashboard → Edge Functions → Settings.
