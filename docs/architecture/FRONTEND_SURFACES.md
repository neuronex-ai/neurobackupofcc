# Frontend surface boundaries

## Product surfaces

1. **Public adaptive web**
   - landing, legal, contact, authentication and public callbacks;
   - keeps current device-adaptive behavior.

2. **Professional mobile**
   - source: `src/apps/professional-mobile`;
   - owns mobile pages, navigation, sheets and forms;
   - mobile components are never imported by desktop.

3. **Professional desktop/tablet**
   - current desktop files remain the source of truth;
   - desktop components are never imported by mobile.

## Finance domains

### Gestão Financeira

Administrative view of the clinic:

- revenues;
- expenses;
- pending receivables;
- projections;
- managerial entries;
- reports and Synapse analysis.

It does not move real account balances.

### NeuroFinance

Real financial account operations:

- available and pending balance;
- charges;
- bill payments;
- Pix copy-and-paste payments;
- Pix transfers;
- payout to the registered bank account;
- statement and receipts;
- financial PIN confirmation.

No user-facing mobile string may use “NeuroBank” or “NeuroBanking”.

## Import rules

Forbidden from `src/apps/professional-mobile`:

- `@/pages/desktop`;
- `@/components/desktop`;
- desktop finance forms, dashboards or operational modals.

Allowed:

- `@/hooks`;
- `@/integrations`;
- `@/context`;
- `@/components/auth`;
- `@/components/ui`;
- `@/lib`;
- `@/types`.

## Backend rule

Mobile and desktop use the same backend contracts. Mobile does not duplicate validation logic for money movement. The backend remains responsible for:

- provider validation;
- live balance validation;
- idempotency;
- PIN verification;
- authorization expiry;
- pay-now versus scheduling eligibility;
- receipt and final operation status.

## Routes

- `/financeiro`: Gestão Financeira; existing device selector loads the mobile management page only on phones.
- `/neurofinance`: mobile NeuroFinance; desktop redirects to the existing desktop finance surface.
- public routes remain unchanged.
