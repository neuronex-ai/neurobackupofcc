# NeuroFinance (Asaas BaaS v3) — Mapa do Sistema

Este documento é a fonte de verdade do **módulo financeiro** do NeuroNex/NeuroFinance com **Asaas como único provedor**.

## Visão geral (alto nível)

```mermaid
flowchart TD
  userApp[Frontend (React/Electron/Mobile)] -->|JWT (Supabase Auth)| edge[Supabase Edge Functions]
  edge -->|Service Role| db[(Supabase Postgres)]
  edge -->|REST v3| asaas[Asaas BaaS API v3]
  asaas -->|Webhooks| webhook[asaas-webhook]
  webhook --> db
```

## Frontend (contratos e “fonte da verdade”)

### Hook principal
- **Hook**: `src/hooks/use-financial-account.ts`
  - **Fonte da verdade de status**: `asaas-account-sync` (sempre)
  - **Campos esperados**:
    - `status` / `ui_status` (string)
    - `asaas_account_id`
    - `requirements`
    - `balances` (plural): `{ available, pending, currency }`

### Onboarding UI
- **Wizard**: `src/components/financeiro/CustomOnboardingFlow.tsx`
  - Cria subconta via `asaas-connect-onboarding`
  - Faz polling via `asaas-account-sync`
  - Fecha onboarding e leva ao dashboard

### Cobranças / Invoices
- **Lista**: `src/components/financeiro/InvoicesListPanel.tsx`
  - “Sync” chama `check-invoice-status` (consulta Asaas e atualiza DB local)

## Edge Functions (Asaas)

### Onboarding / Conta
- `supabase/functions/asaas-connect-onboarding/index.ts`
  - Cria subconta Asaas (`/accounts`)
  - Grava/atualiza `financial_accounts`
  - Cria registro em `financial_onboarding_sessions` com `provider_account_id`
  - Garante `ledger_accounts` base (`ensureLedgerAccounts`)

- `supabase/functions/asaas-account-sync/index.ts`
  - Busca status da subconta (`/myAccount/status`)
  - Atualiza `financial_accounts.status` e `financial_accounts.requirements`
  - Retorna `balances` (plural) + `requirements` normalizado

- `supabase/functions/asaas-account-update/index.ts`
  - Atualiza info comercial (`/myAccount/commercialInfo`)
  - Atualiza dados bancários (`/bankAccountInfo`)

- `supabase/functions/asaas-upload-file/index.ts`
  - Upload de documento KYC (Asaas)

### Pagamentos / Payouts
- `supabase/functions/asaas-create-payment/index.ts`
  - Cria cobrança em Asaas (`/payments`)
  - Grava em `nb_payments.provider_payment_id`
  - Cria `ledger_entries` pendentes

- `supabase/functions/asaas-webhook/index.ts`
  - Recebe webhooks Asaas
  - Dedup em `asaas_webhook_events`
  - Atualiza `nb_payments` / `nb_payouts`
  - Cria `ledger_entries` (posted) conforme eventos

- `supabase/functions/asaas-payout/index.ts`
  - Solicita transferência em Asaas (`/transfers`)
  - Grava em `nb_payouts.provider_payout_id`
  - Cria `ledger_entries` (payout)

- `supabase/functions/asaas-refund/index.ts`
  - Estorna pagamento em Asaas (`/payments/{id}/refund`)

### Auxiliar (Invoices)
- `supabase/functions/check-invoice-status/index.ts`
  - Consulta `/payments/{provider_payment_id}` na Asaas
  - Atualiza `nb_payments.status` e `invoices.status` localmente

## Banco de dados (tabelas “financeiro”)

### Core
- `public.financial_accounts`
  - Chaves: `user_id` (unique)
  - Asaas: `asaas_account_id`, `asaas_wallet_id`
  - Status: `status`, `charges_enabled`, `payouts_enabled`, `details_submitted`
  - KYC: `requirements` (JSONB)
  - Segredos: **API key da subconta fica em** `metadata.asaas_api_key`

- `public.financial_onboarding_sessions`
  - `provider_account_id` (ID externo do provedor — Asaas)
  - `provider` = `asaas`

- `public.nb_payments`
  - `provider_payment_id` (ID Asaas)
  - Status local e links (Pix/checkout)

- `public.nb_payouts`
  - `provider_payout_id` (ID Asaas transfer)

### Ledger interno (contábil)
- `public.ledger_accounts`
- `public.ledger_entries`
  - `provider_object_id` para correlacionar com objetos Asaas
- `public.ledger_balances`

### Webhooks (idempotência)
- `public.asaas_webhook_events`
  - Dedup por `event_id` (composto por event + paymentId/transferId)

## Migrations relevantes

- Base ledger + financeiro: `supabase/migrations/20260313000000_neurobank_v2_stripe_ledger.sql`
  - (histórico) cria as tabelas; o legado stripe_* é limpo depois

- Limpeza Asaas-only + provider-neutral: `supabase/migrations/20260423000000_neurobank_asaas_only_cleanup.sql`
  - Remove Stripe-only (`financial_requirement_snapshots`, `financial_events`)
  - Substitui `stripe_*` por `provider_*`

## Checklist operacional (Supabase Cloud)

- Secrets necessários (Edge Functions):
  - `ASAAS_API_KEY`
  - `ASAAS_WEBHOOK_TOKEN`
  - `ASAAS_ENVIRONMENT` (`sandbox`/`production`)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- Secrets que **não devem existir**:
  - Qualquer `STRIPE_*`
  - Qualquer `C6_*`

