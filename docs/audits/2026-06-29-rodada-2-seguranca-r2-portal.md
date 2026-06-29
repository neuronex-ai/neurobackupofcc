# Rodada 2 - seguranca, R2 e portal paciente

Data: 2026-06-29

## Objetivo

Esta rodada saiu da limpeza de componentes orfaos e atacou os riscos mais urgentes:

- impedir que conta de paciente gere trial, perfil profissional ou acesso financeiro;
- tirar o fluxo principal de documentos do prontuario do bucket publico `files_psico`;
- colocar documentos novos no desenho R2 privado + metadados Supabase + URLs assinadas;
- reduzir permissao publica em funcoes/tabelas ligadas a documentos.

## Implementado

### Portal paciente e separacao de contas

- Conta teste paciente validada:
  - e-mail: `paciente.portal.teste@neuronex.dev`
  - status no portal: `active`
  - `account_role`: `patient`
  - `allowed_app`: `patient_portal`
  - `professional_access`: `false`
- Chamada `patient-portal-current` retorna contexto ativo.
- Chamada `get-current-entitlement` retorna `status = patient_portal` e `accessState = patient_portal`.
- Chamada financeira com token do paciente retorna bloqueio e nao cria assinatura.
- Banco confirmou:
  - `profiles` para esse usuario: `0`
  - `user_subscriptions` para esse usuario: `0`
  - `patient_portal_links.status`: `active`

### Documentos privados em R2

- `src/components/patients/PatientDocumentsTab.tsx` deixou de usar `files_psico`.
- A aba principal de documentos do prontuario agora usa `DocumentUploadPanel` com `category = patient_attachment`.
- `src/hooks/use-r2-documents-v2.ts` passou a usar o ciclo:
  - assinar upload via Edge Function;
  - registrar metadado em `document_files`;
  - enviar bytes para R2 com URL curta;
  - confirmar upload via Edge Function com `HeadObject`;
  - gerar download via URL assinada curta;
  - excluir via Edge Function.
- `src/lib/r2-upload-signing.ts` deixou de chamar `/api/r2-sign` e passou a chamar Supabase Edge Function.

### Edge Function R2

O projeto Supabase Cloud esta no limite de Edge Functions. Por isso, em vez de criar quatro funcoes novas, o fluxo foi consolidado em uma funcao:

- `r2-create-upload-url`

Ela agora aceita `action` no body:

- `create-upload-url`
- `confirm-upload`
- `create-download-url`
- `delete-document`

Regras implementadas:

- `verify_jwt = true`;
- R2 secrets permanecem server-side;
- tamanho maximo: 20 MB;
- tipos aceitos: PDF, imagens web comuns, Word, RTF, TXT e CSV;
- object key sempre no prefixo `documents/{user_id}/...`;
- download expira em 300 segundos;
- upload expira em 900 segundos;
- paciente portal e contas sem NeuroDrive sao bloqueados para upload/delete profissional.

### Hardening Supabase aplicado

No Cloud e em migration local:

- `prepare_document_upload` deixou de ser executavel por `anon`/`PUBLIC`;
- `prepare_document_upload` agora valida MIME, tamanho, bucket e prefixo `documents/{auth.uid()}/`;
- `document_files` perdeu grants amplos de `anon`;
- `document_files` ficou com `SELECT` para `authenticated` e update limitado a colunas de ciclo de vida;
- `get_document_storage_usage` deixou de ser executavel por `anon`/`PUBLIC`;
- `handle_new_user` deixou de ser executavel por `anon`/`authenticated`.

Migration criada:

- `supabase/migrations/20260629005048_harden_r2_document_functions.sql`

## Testes executados

- Login da conta paciente teste: passou.
- `patient-portal-current` com token paciente: passou, status ativo.
- `get-current-entitlement` com token paciente: passou, sem trial.
- `asaas-payment-link` com token paciente: bloqueado, sem criar `user_subscriptions`.
- `r2-create-upload-url` com token paciente: bloqueado.
- Verificacao SQL: paciente continua sem `profiles` e sem `user_subscriptions`.
- `npx tsc -p tsconfig.app.json --noEmit`: passou.
- `npm run build`: passou.

### Typecheck limpo

Tambem foram corrigidos os tres erros antigos que bloqueavam o `tsc`:

- `CalendarView.tsx`: conversao explicita de `UniqueIdentifier` para string no drag-over.
- `dashboard-command-center-model.test.ts`: status de fixture atualizado de `scheduled` para `unscored`.
- `DesktopDashboardCommandCenter.tsx`: easing do Framer Motion tipada como tuple.

## Nao concluido nesta rodada

- Teste real de upload/download R2 com conta profissional ativa. Falta uma credencial profissional de QA com NeuroDrive liberado ou um fluxo dedicado para fixture de profissional.
- Teste de expiracao de URL assinada R2. Depende do upload/download real acima.
- Backfill dos objetos antigos de `files_psico` para R2.
- Tornar `files_psico` privado. Ainda nao deve ser feito porque notas, AI chat, portal legado e hooks antigos continuam referenciando esse bucket.

## Riscos remanescentes

### Storage publico

`files_psico` ainda aparece em:

- `DesktopAIChat.tsx`;
- `MobileAIChat.tsx`;
- hooks legados de documentos;
- componentes de notas;
- painel legado do portal paciente;
- timeline/preview antigos.

O fluxo principal de documentos do prontuario saiu desse bucket, mas o risco de privacidade so fecha de verdade quando esses outros fluxos forem migrados ou removidos.

### Edge Functions publicas

O projeto tem 100 Edge Functions ativas no Cloud:

- 20 com `verify_jwt = true`;
- 80 com `verify_jwt = false`.

Isso ja atingiu o limite do projeto e impediu a criacao de endpoints R2 separados. Algumas funcoes parecem publicas legitimas, como webhooks/callbacks/convites, mas varias ainda precisam de classificacao por corpo, segredo e rate-limit.

Grupos que exigem revisao prioritaria:

- financeiros com `verify_jwt = false`: `asaas-*`, `financial-pin`, `verify-financial-pin`, `check-invoice-status`, `neurofinance-post-onboarding`;
- IA/automacao com `verify_jwt = false`: `gemini-text-chat`, `gemini-sdr-chat`, `n8n-agent-gateway`, `synapse-*`;
- documentos/email com `verify_jwt = false`: `send-document-email`, `send-document-email-safe`, `send-reminder-email`, `send-monthly-report`;
- duplicatas provaveis: `jitsi-token`/`generate-jitsi-token`, `jitsi-webhook`/`jitsi-webhook-handler`, `issue-focus-nfe`/`issue-invoice-focusnfe`.

### Advisors Supabase

O advisor de seguranca ainda aponta:

- tabelas com RLS ativo sem policy;
- varias funcoes com `search_path` mutavel;
- extensao `vector` no schema `public`;
- policies permissivas demais;
- muitas funcoes `SECURITY DEFINER` executaveis por `authenticated`;
- protecao contra senhas vazadas desativada.

O advisor de performance ainda aponta:

- FKs sem indice;
- policies permissivas duplicadas;
- indices duplicados, incluindo em `patients` e `user_notion_tokens`.

## Proxima rodada recomendada

1. Criar ou identificar uma conta profissional QA com entitlement NeuroDrive para testar upload/download R2 real.
2. Migrar AI chat e notas para R2 ou isolar claramente o que ainda pode usar Storage publico.
3. Backfill dos 21 objetos de `files_psico` para R2.
4. So depois, tornar `files_psico` privado ou bloquear novos uploads.
5. Classificar `verify_jwt=false` por categoria: webhook, OAuth callback, endpoint publico legitimo, erro.
6. Corrigir primeiro `SECURITY DEFINER` sensiveis que aparecem no advisor e sao executaveis por `authenticated`.
