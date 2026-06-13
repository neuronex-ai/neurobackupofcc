# Step 6 - Persistent notifications center

Status: persistent storage and shared client engine implemented.

## Delivered

- `notifications` is now the in-app source of truth.
- Persistent read, read-all, dismiss, and restore operations.
- Shared `useNotifications()` and `useUnreadNotificationCount()` hooks.
- Supabase Realtime updates lists and counters across devices.
- Categories for agenda, finance, patients, clinic, security, and system.
- Severity, contextual action, metadata, organization reference, and updated timestamp.
- Desktop/mobile notification panel with filters and grouping by date.
- Mobile swipe right to mark read and swipe left to dismiss.
- Undo action restores a dismissed notification.
- Existing calculated dashboard alerts are mirrored into persistent notification rows with stable event identifiers.
- Mobile topbar now shows the real persistent unread count.

## Compatibility

The legacy dashboard alert calculation remains available as an event source during migration. It no longer needs to own read or dismiss state. New product events can insert directly into `notifications` and immediately appear through Realtime.

## Database changes

- Added `category`, `severity`, `dismissed_at`, `organization_id`, and `updated_at`.
- Relaxed obsolete required provider columns for generic in-app events.
- Added indexes for active, categorized, unread, and deduplicated event queries.
- Added trigger-backed read timestamps.
- Added RPCs for mark-all-read and restore.
- Added `notifications` to the Supabase Realtime publication.

## Remaining hardening

Public unauthenticated flows still insert notification records through an existing broad anonymous insert policy. Those sources should be moved behind authenticated Edge Functions before that policy is removed.
