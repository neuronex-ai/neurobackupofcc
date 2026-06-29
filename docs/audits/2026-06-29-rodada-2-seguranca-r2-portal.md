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

## Atualizacao da continuacao

### AI chat, notas e portal paciente

- `DesktopAIChat.tsx` e `MobileAIChat.tsx` deixaram de enviar anexos para `files_psico`; anexos novos agora usam R2 com metadados em `document_files`.
- `FilesManager.tsx` e `SegundoCerebro.tsx` passaram a listar/uploadar/baixar documentos via R2.
- `PatientDocumentsPanel`, `DocumentPreviewModal`, `PatientUnifiedTimeline`, `use-patient-documents`, `use-patient-shared-documents`, `use-patient-timeline`, `use-upload-document` e `use-upload-invoice` foram migrados para metadados R2 ou referencia R2.
- O scan atual de codigo ativo nao encontrou mais uso de `files_psico` no `src`; restam apenas referencias no backfill da Edge Function e em docs de auditoria.

### `files_psico`

- Bucket `files_psico` no Cloud esta privado (`public = false`).
- Policies antigas de leitura/upload/update/delete para usuarios autenticados foram removidas.
- Restou apenas policy de `service_role` para gerenciar o bucket legado durante migracao.
- O bucket ainda contem 23 objetos antigos, cerca de 5.6 MB.
- `document_files` tem 0 objetos marcados como `files_psico_backfill`; o backfill global ainda nao foi executado porque nao ha `SUPABASE_SERVICE_ROLE_KEY` ou JWT profissional local carregado para chamar a acao de backfill.

### Edge Functions e `verify_jwt`

- Corrigida divergencia entre `supabase/config.toml` e Cloud: 21 functions sensiveis que estavam `verify_jwt=false` no Cloud foram redeployadas com `verify_jwt=true`.
- Adicionadas e redeployadas mais 14 functions autenticadas com `verify_jwt=true`: documentos/email, Google Drive/Suite, Jitsi profissional, resumo IA, OCR/anamnese, invoice status, CRP, SMS e exclusao de conta.
- Functions legadas apagadas no Cloud e localmente: `asaas-proxy`, `gemini-sdr-chat`, `issue-invoice-focusnfe`, `jitsi-branding`, `jitsi-guest-token`.
- Functions legadas ja apagadas na etapa anterior: `jitsi-token`, `jitsi-webhook`, `issue-focus-nfe`, `verify-financial-pin`.
- Lista publica remanescente ficou concentrada em publicos reais ou pendentes de revisao: signup, portal paciente por token, OAuth callbacks/status, webhooks, agendamento publico, `gemini-text-chat`, `n8n-agent-gateway`, `synapse-whatsapp-in`, `subscription-maintenance`, `asaas-financial-sync`, `asaas-webhook`, `dispatch-*`, `sync-system-email-templates` e validadores publicos de endereco.

### Legados confirmados pelo produto

Em 2026-06-29, foram classificados como legado definitivo e fora do roadmap: Stripe, C6, ElevenLabs, Synapse Heartbeat/Moltbook, Twilio e Google Sheets.

Limpeza executada:

- Cloud: `twilio-sms` removida.
- Local: `supabase/functions/twilio-sms/index.ts` removida.
- Local: hook orfao `src/hooks/use-twilio-sms.ts` removido.
- Local/Cloud: `google-suite-action` manteve Google Docs, mas perdeu a acao `create_sheet` e chamadas para `sheets.googleapis.com`.
- Banco: coluna `public.synapse_activations.moltbook_post_id` removida via migration `20260629041324_drop_moltbook_legacy_column.sql`.
- Docs: pasta `docs/eleven/` removida.
- Scan Cloud: nao ha Edge Functions remotas com nomes Stripe, C6, ElevenLabs, Moltbook, Heartbeat, Twilio ou Sheets.
- Scan DB: nao ha tabelas ou colunas em `public`/`app_core` com nomes Stripe, C6, Twilio, ElevenLabs, Moltbook ou Sheets, exceto migrations historicas ja aplicadas.

### SECURITY DEFINER

- Helpers internos `SECURITY DEFINER` perderam `EXECUTE` de `anon`/`authenticated` e ficaram limitados a `service_role`.
- `check_appointment_overlap` e `get_financial_metrics` continuam callable por `authenticated`, mas agora validam `auth.uid() = p_user_id` ou chamada `service_role`.
- `check_appointment_overlap` e `get_financial_metrics` tambem perderam `EXECUTE` de `anon`.
- Funcoes internas e publicas por token receberam `search_path` fixo.
- Excecoes mantidas por desenho: `get_public_anamnesis`, `update_public_anamnesis`, `emit_public_*_notification`, `prepare_document_upload`, `check_appointment_overlap` e `get_financial_metrics`. As publicas por token validam token antes de retornar/alterar dados.

### Typecheck limpo

Tambem foram corrigidos os tres erros antigos que bloqueavam o `tsc`:

- `CalendarView.tsx`: conversao explicita de `UniqueIdentifier` para string no drag-over.
- `dashboard-command-center-model.test.ts`: status de fixture atualizado de `scheduled` para `unscored`.
- `DesktopDashboardCommandCenter.tsx`: easing do Framer Motion tipada como tuple.

## Nao concluido nesta rodada

- Backfill dos 23 objetos antigos de `files_psico` para R2. A Edge Function ja tem acao `backfill-files-psico`, mas a execucao global exige chamada com `SUPABASE_SERVICE_ROLE_KEY` ou sessao profissional dona dos objetos.
- Resolver referencias documentais antigas em `docs/ARCHITECTURE.md`, `docs/AUDIT_ROADMAP.md` e `docs/setup/edge-functions-jwt-audit.md` que ainda listam functions removidas.
- Classificar em mais detalhe endpoints publicos que ficam expostos por design proprio: `gemini-text-chat`, `n8n-agent-gateway`, `synapse-whatsapp-in`, `asaas-financial-sync`, `subscription-maintenance`, `dispatch-*`, `sync-system-email-templates`.

## Riscos remanescentes

### Storage publico

`files_psico` nao aparece mais no frontend ativo (`src`). O bucket esta privado e bloqueado para novos uploads por usuario autenticado. O risco remanescente e operacional: os 23 objetos antigos continuam em Supabase Storage ate o backfill para R2 ser executado.

Outros usos de Supabase Storage ainda existem e foram isolados para revisao separada:

- `avatars`: bucket publico de avatar.
- `patient-attachments`: hook legado `use-upload-attachment`.
- anexos de teleconsulta em `AttachmentsPanel`.

### Edge Functions publicas

Depois das exclusoes e redeploys, o projeto saiu do limite de 100 Edge Functions. A divergencia `config.toml` vs Cloud para functions configuradas foi zerada.

Grupos publicos remanescentes:

- Publicos legitimos por fluxo: signup, portal paciente auth/preview, checkout verify, agendamento publico, address lookup.
- OAuth/callback/status: Google, Microsoft, Notion, Todoist.
- Webhooks/jobs: `asaas-webhook`, `jitsi-webhook-handler`, `notion-webhook`, `todoist-webhook`, `synapse-whatsapp-in`, `subscription-maintenance`, `dispatch-*`, `sync-system-email-templates`.
- Exigem revisao de segredo/rate-limit antes de declarar seguros: `gemini-text-chat`, `n8n-agent-gateway`, `synapse-whatsapp-in`, `asaas-financial-sync`, `subscription-maintenance`.

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

1. Executar backfill dos 23 objetos `files_psico` com `SUPABASE_SERVICE_ROLE_KEY` ou JWT profissional dono dos objetos.
2. Classificar os endpoints publicos remanescentes por segredo/rate-limit e mover para `verify_jwt=true` quando nao forem realmente publicos.
3. Corrigir advisors restantes: RLS sem policy, policies permissivas, `search_path` mutavel em funcoes nao tratadas e buckets publicos com listagem.
4. Iniciar a reintegracao visual/funcional do portal paciente desktop sobre o shell atual, usando R2 como fonte de documentos.

## Atualizacao da continuacao - limpeza Plano Clinica e SECURITY DEFINER

### Plano Clinica / split legado

- Removida a opcao ativa `clinic_admin` do cadastro profissional desktop.
- `signup-start` foi atualizado e redeployado no Supabase Cloud para aceitar apenas:
  - `individual_professional`;
  - `psychology_student`.
- Migration aplicada no Cloud:
  - `supabase/migrations/20260629062247_remove_clinic_admin_signup_context.sql`.
- O unico perfil remoto com `professional_context = clinic_admin` foi normalizado para `individual_professional`.
- O check constraint remoto `profiles_professional_context_check` agora rejeita `clinic_admin`.
- Confirmado no Cloud:
  - `profiles_clinic_admin = 0`;
  - tabelas `organizations`, `organization_members`, `organization_invitations` nao existem no banco remoto atual.

### NeuroFinance split/repasses

- Removido o componente legado `SmartSplit`.
- Removida a chamada ativa para a tabela inexistente `payment_split_configs`.
- Confirmado no Cloud que `payment_split_configs` nao existe.
- A rota interna `repasses-profissional` deixou de exibir regras manuais de split e passou a mostrar apenas conta bancaria/destino de repasse.
- Removidas do tipo de rota financeiro as entradas sem implementacao ativa:
  - `repasses-convenio`;
  - `repasses-salas`.

### SECURITY DEFINER

- Migration aplicada no Cloud:
  - `supabase/migrations/20260629062925_harden_remaining_security_definer_execute.sql`.
- `app_core.emit_event(text, jsonb)` deixou de ser executavel por `public`, `anon` e `authenticated`; ficou limitado a `service_role`.
- `app_core.emit_event` recebeu `search_path = app_core, pg_temp`.
- Funcoes publicas por token perderam o grant generico `PUBLIC`, mas mantiveram `anon/authenticated` explicitamente porque sao usadas por links publicos:
  - `get_public_anamnesis`;
  - `update_public_anamnesis`;
  - `emit_public_anamnesis_notification`;
  - `emit_public_appointment_notification`.
- Confirmado no Cloud que nenhuma funcao `SECURITY DEFINER` restante nessa lista tem `public_execute = true`.

### Verificacoes

- `npx tsc -p tsconfig.app.json --noEmit`: passou.
- `npm run build`: passou.
- Busca ativa em `src`, `supabase/functions` e `docs/ARCHITECTURE.md` nao encontrou mais:
  - `SmartSplit`;
  - `payment_split_configs`;
  - `clinic_admin`;
  - `repasses-convenio`;
  - `repasses-salas`.

### Observacao de worktree

Durante esta continuacao havia alteracoes paralelas em NeuroView/NeuroFlow e migrations de NeuroFlow. Elas nao foram alteradas nesta limpeza e devem ser tratadas como outra trilha de trabalho.

### Storage publico

- Migration aplicada no Cloud:
  - `supabase/migrations/20260629063226_harden_public_storage_bucket_listing.sql`.
- Removidas policies amplas de `SELECT` que permitiam listagem publica dos buckets:
  - `avatars`;
  - `chat_attachments`;
  - `downloads`.
- `chat_attachments` foi marcado como privado (`public = false`) e ficou sem policies de acesso para novos uploads/listagens.
- `avatars` continua publico para URLs de avatar, mas sem policy ampla de listagem.
- `downloads` continua publico para arquivos publicos do app, mas o upload agora usa policy explicita `to authenticated`, sem `auth.role()`.
- Busca ativa nao encontrou uso de `chat_attachments` no frontend/functions; anexos novos seguem o caminho R2.
