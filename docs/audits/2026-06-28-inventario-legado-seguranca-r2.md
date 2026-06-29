# Inventario de legado, codigo morto e riscos de seguranca

Data: 2026-06-28  
Projeto Supabase auditado: `NeuroNex` / `krewdaklcyzqfxkkgvqr`

Este documento classifica achados. Ele nao apaga nada automaticamente. A regra aqui deve ser: primeiro confirmar uso real, depois migrar/substituir, depois remover.

## Resumo executivo

O projeto compila, mas tem sinais fortes de acumulacao historica:

- Frontend: 749 arquivos em `src`; 540 aparecem alcancaveis a partir de `src/main.tsx`; 189 arquivos nao aparecem no grafo estatico de imports e devem ser revisados como candidatos a orfaos.
- Supabase local: 112 Edge Functions locais, 52 declaradas em `supabase/config.toml`, 53 nomes de funcoes chamados pelo frontend/servidores.
- Supabase Cloud: o projeto correto esta conectado e tem muitas Edge Functions ativas, incluindo varias com `verify_jwt=false`.
- Banco: todas as tabelas publicas retornadas na consulta estao com RLS ligado, mas ha grants muito amplos para `anon` e `authenticated`.
- Storage: ha buckets Supabase publicos com objetos reais. `files_psico` tem 21 objetos e esta publico. Isso e o maior risco de privacidade encontrado.
- R2: existe uma fundacao de R2, mas ela esta parcialmente conectada. A aba principal de documentos ainda usa Supabase Storage.
- Testes: `npm run build` passa; `npm run test` falha em 1 teste de boleto.

## Critico ou alto risco

### 1. Supabase Storage publico com documentos

Buckets encontrados:

- `avatars`: publico, 6 objetos.
- `chat_attachments`: publico, 0 objetos no momento da consulta, sem limite de tamanho/mime.
- `downloads`: publico, limite 500 MB, MIME executavel/instalador.
- `files_psico`: publico, 21 objetos, cerca de 5.3 MB.

Classificacao:

- `files_psico`: alto risco se contiver documentos de pacientes, anexos clinicos, notas, PDFs ou comprovantes. Bucket publico permite acesso por URL publica, independentemente de a aplicacao esconder os links.
- `chat_attachments`: risco futuro. Publico e sem restricao de MIME/tamanho.
- `downloads`: aceitavel se for somente distribuicao publica do app, mas precisa isolamento claro.

Uso legado no codigo:

- `src/components/patients/PatientDocumentsTab.tsx` usa `files_psico`.
- `src/hooks/use-upload-document.ts` usa `files_psico`.
- `src/hooks/use-patient-documents.ts` usa `files_psico`.
- `src/components/patient-portal/PatientDocumentsPanel.tsx` usa `files_psico`.
- `src/hooks/use-patient-shared-documents.ts` usa `files_psico`.
- `src/pages/desktop/DesktopAIChat.tsx` e `src/mobile/pages/MobileAIChat.tsx` fazem upload para `files_psico`.
- `src/components/notes/FilesManager.tsx` e `src/components/notes/SegundoCerebro.tsx` usam `files_psico`.

Decisao recomendada:

Migrar documentos clinicos e anexos privados para R2 privado com URL assinada. Deixar Supabase Storage apenas para avatar publico e, talvez, downloads publicos do app.

### 2. Grants amplos no schema publico

Resumo dos grants:

- `anon` tem `DELETE`, `INSERT`, `REFERENCES`, `TRIGGER`, `TRUNCATE`, `UPDATE` em cerca de 100 objetos e `SELECT` em 101.
- `authenticated` tem grants semelhantes em mais de 95 objetos.

Observacao importante: RLS esta ligado nas tabelas publicas consultadas, entao esses grants nao significam vazamento automatico. Mas eles aumentam o estrago possivel quando alguma policy, view, RPC ou funcao `SECURITY DEFINER` erra.

Decisao recomendada:

Fazer uma migration de hardening que revogue grants amplos de `anon` e conceda apenas o necessario. Para `authenticated`, preferir grants por tabela e operacao real.

### 3. Funcoes SQL `SECURITY DEFINER` em `public`

Consulta encontrou:

- 180 funcoes no schema `public`.
- 24 funcoes `SECURITY DEFINER`.
- As 24 aparecem executaveis por roles cliente/publicas ou ACL padrao ampla.

Exemplos que merecem auditoria manual:

- `get_financial_metrics`
- `prepare_document_upload`
- `trigger_webhook`
- `verify_financial_pin`
- `get_public_anamnesis`
- `update_public_anamnesis`
- `emit_user_notification`
- `is_admin`

Decisao recomendada:

Manter `SECURITY DEFINER` somente onde for indispensavel, mover funcoes privilegiadas para schema privado quando possivel, revogar `EXECUTE` de `PUBLIC`, e liberar explicitamente apenas as RPCs que o frontend precisa.

### 4. Edge Functions publicas demais

No `supabase/config.toml`, funcoes com `verify_jwt=false`:

- `asaas-webhook`
- `asaas-financial-sync`
- `gemini-text-chat`
- `synapse-whatsapp-in`
- `n8n-agent-gateway`
- `signup-email-status`
- `signup-start`
- `signup-verify`
- `signup-complete`
- `patient-portal-invite-preview`
- `patient-portal-auth`
- `verify-checkout-session`
- `subscription-maintenance`
- `address-autocomplete`
- `address-validate`

Classificacao:

- Provavelmente legitimas como publicas: webhooks, signup, checkout verify, patient portal auth, address lookup.
- Exigem revisao de corpo/segredo/rate-limit: `gemini-text-chat`, `synapse-whatsapp-in`, `n8n-agent-gateway`, `asaas-financial-sync`, `subscription-maintenance`.
- Sem sinal obvio de autenticacao no scan local: `signup-email-status`, `address-autocomplete`, `address-validate`.

Decisao recomendada:

Para cada funcao `verify_jwt=false`, registrar o motivo: webhook assinado, token publico de uso unico, endpoint realmente publico, ou job cron com segredo. Se nao houver motivo, mudar para `verify_jwt=true`.

## R2 e documentos

R2 deve ser tratado como object storage, nao como banco de dados. O banco continua sendo o Supabase/Postgres, guardando metadados, dono, paciente, categoria, status e permissoes.

Existe fundacao R2:

- `api/r2-sign.js`: API Vercel que assina upload R2.
- `src/lib/r2-upload-signing.ts`: cliente que chama `/api/r2-sign`.
- `src/hooks/use-r2-documents-v2.ts`: registra metadados em `document_files`, envia arquivo via URL assinada e marca `ready`.
- `src/components/documents/DocumentUploadPanel.tsx`: painel R2.
- `supabase/functions/r2-create-upload-url`, `r2-confirm-upload`, `r2-create-download-url`, `r2-delete-document`: Edge Functions alternativas para R2.
- `public.document_files`: tabela de metadados R2.

Problemas encontrados:

- `DocumentUploadPanel` so aparece em `src/components/patients/anamnesis/AnamnesisTab.tsx`.
- A aba principal de documentos do paciente ainda usa Supabase Storage (`files_psico`), nao R2.
- O portal do paciente ainda baixa arquivos pelo Supabase Storage.
- Existem dois desenhos concorrentes para assinar upload: Vercel API `/api/r2-sign` e Edge Function `r2-create-upload-url`.
- `document_files` esta vazia no Cloud, enquanto `files_psico` tem objetos. Isso sugere que R2 ainda nao e o fluxo principal.
- `patient-portal-current` ainda tenta gerar signed URL via `supabaseAdmin.storage.from(doc.bucket)`, o que nao serve para R2 se `bucket` for Cloudflare.

Decisao recomendada:

Escolher uma arquitetura unica:

1. Preferencia: Edge Functions Supabase para assinar R2, confirmar upload, baixar e deletar, porque ficam perto da auth e do metadata.
2. Alternativa: Vercel API `/api/r2-sign`, mas entao remover/ignorar as Edge Functions R2 duplicadas.

Depois migrar:

- Patient documents tab para `DocumentUploadPanel`/R2.
- Portal do paciente para download via `r2-create-download-url`.
- Anexos de teleconsulta e AI chat para R2, se forem privados.
- Backfill dos 21 objetos de `files_psico` para R2.
- Tornar `files_psico` privado ou descontinuar.

Atualizacao 2026-06-29:

- A aba principal `PatientDocumentsTab` foi migrada para `DocumentUploadPanel`/R2.
- `src/lib/r2-upload-signing.ts` deixou de chamar `/api/r2-sign` e passou a chamar Supabase Edge Function.
- Por limite de Edge Functions no projeto Cloud, o ciclo R2 foi consolidado em `r2-create-upload-url` com `action` no body.
- `patient-portal-current` ja assina downloads R2 server-side para documentos compartilhados com o paciente.
- Ainda continuam pendentes AI chat, notas, hooks legados, timeline/preview antigos, backfill e privacidade final do bucket `files_psico`.
- Detalhes da rodada: `docs/audits/2026-06-29-rodada-2-seguranca-r2-portal.md`.

## Frontend: candidatos a orfaos

Metodo: grafo estatico de imports a partir de `src/main.tsx`. Limites: pode haver falso positivo se um arquivo for importado por string dinamica ou usado fora do bundle principal.

Contagem:

- 749 arquivos analisados em `src`.
- 540 alcancaveis pela entrada principal.
- 189 nao alcancaveis, excluindo testes.

Pastas com mais candidatos:

- `src/hooks`: 32
- `src/components/financeiro`: 24
- `src/components/ui`: 23
- `src/components/dashboard`: 19
- `src/components/agenda`: 11
- `src/components/notes`: 9
- `src/components/patient-portal`: 9

Exemplos representativos:

- Agenda antiga: `src/components/agenda/AgendaView.tsx`, `AgendaGridHeader.tsx`, `DayColumn.tsx`, `DraggableAppointmentItem.tsx`, `MassRescheduleModal.tsx`.
- Dashboard antigo: `DashboardHeaderWidget.tsx`, `DashboardKpiCards.tsx`, `FinancialWidgets.tsx`, `MiniDailyAgenda.tsx`, `MorningBriefing.tsx`, `SmartInsightsWidget.tsx`.
- Financeiro antigo: `BankAccountsManager.tsx`, `CreateBillingModal.tsx`, `CreatePaymentLinkModal.tsx`, `NeuroFinancePostOnboardingWizard.tsx`, `RecurringManager.tsx`, `RevenueLeakageWidget.tsx`.
- Patient portal antigo: `JoinSessionModal.tsx`, `MoodTracker.tsx`, `PatientBillingPanel.tsx`, `PatientDocumentsPanel.tsx`, `PatientFinancePanel.tsx`.
- UI decorativa possivelmente abandonada: `FloatingParticlesBackground.tsx`, `NeuralBackground.tsx`, `TiltCard.tsx`, `spotlight-card.tsx`, `gravity-grid.tsx`, `dot-grid-background.tsx`.
- Rotas/paginas possivelmente antigas: `src/pages/desktop/NeuroZap.tsx`, `src/pages/public/Blog.tsx`, `src/pages/public/Newsletter.tsx`.

Decisao recomendada:

Nao deletar em massa. Criar uma PR de limpeza por dominio:

1. Agenda/dashboard.
2. Documentos/R2.
3. Financeiro.
4. Patient portal.
5. UI decorativa/shadcn nao usada.

## Dependencias candidatas a remover

Heuristica: pacote em `package.json` sem import estatico encontrado em `src`, `api`, `server`, `electron` ou `supabase`. Algumas devDependencies sao usadas por scripts e nao entram nessa lista como lixo automatico.

Candidatas fortes:

- `@babylonjs/core`, `@babylonjs/loaders`: nao ha uso local encontrado.
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `three`, `postprocessing`: nao ha uso local encontrado.
- `@fullcalendar/*`: nao ha uso local encontrado.
- `mapbox-gl`, `react-map-gl`: nao ha uso local encontrado.
- `@supabase/auth-helpers-nextjs`, `@supabase/auth-helpers-react`, `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`: nao ha uso local encontrado.
- `axios`, `request`: nao ha uso local encontrado. `request` e dependencia historica/deprecada.
- `react-webcam`: nao ha uso local encontrado.
- `socket.io-client`, `ws`: nao ha uso local encontrado no app.

Usadas ou provavelmente justificadas:

- `firebase`: usado em push notifications.
- `@zxing/browser`, `@zxing/library`: usado para scanner de boleto/codigo.
- `mermaid`: usado no editor/notas.
- `react-force-graph-2d`: usado em visualizacao de notas.
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`: usado por R2.

## Supabase: tabelas vazias ou suspeitas

Tabelas publicas com 0 linhas no Cloud na consulta:

- `[MENSAGENS GEMINI TEMPLATE]`
- `admin_roles`
- `appointment_exceptions`
- `backups`
- `base_asaas_events`
- `document_files`
- `documents`
- `flow_edges`
- `generated_reports`
- `integration_suggestions`
- `invoice_automation`
- `invoices`
- `neurofinance_anticipations`
- `normative_documents`
- `notion_imports`
- `patient_attachments`
- `patient_financial_settings`
- `patient_lookup_options`
- `patient_responsibles`
- `psychologist_patient_preferences`
- `recurring_appointments`
- `recurring_financial_entries`
- `recurring_invoices`
- `subscription_usage_counters`
- `support_requests`
- `synapse_activations`
- `synapse_logs`
- `teleconsultation_sessions`
- `transaction_templates`
- `user_microsoft_tokens`
- `user_todoist_tokens`
- `webhook_logs`

Classificacao:

- Possivel legado/experimento: `[MENSAGENS GEMINI TEMPLATE]`, `backups`, `documents`, `flow_edges`, `generated_reports`, `notion_imports`, `synapse_activations`, `synapse_logs`.
- Feature futura ou parcialmente implementada: `document_files`, `patient_attachments`, `patient_lookup_options`, `patient_responsibles`, `support_requests`.
- Integracao instalada mas sem uso atual: `user_microsoft_tokens`, `user_todoist_tokens`, `notion_imports`.
- Financeiro/recorrencia sem dados ainda: `invoice_automation`, `invoices`, `recurring_*`, `neurofinance_anticipations`.

Decisao recomendada:

Marcar cada tabela como `manter`, `migrar`, `arquivar` ou `remover`. Antes de remover, buscar referencias em migrations, Edge Functions e frontend.

## Edge Functions locais vs config

Localmente existem 112 pastas de functions. O `config.toml` declara 52. Ha uma divergencia grande.

No config, aparecem funcoes que nao existem localmente:

- `scientific-updater`
- `ingest-normative`
- `sync-cfp-norms`

Localmente existem muitas funcoes sem entrada no config, incluindo:

- Google/Notion/Todoist/Microsoft callbacks.
- Jitsi antigas.
- R2 auxiliares.
- `send-document-email-safe` e `send-patient-invite-safe`.
- `synapse-text-fallback` e `synapse-text-gateway`.
- Funcoes legadas de Asaas e webhooks.

Chamadas no frontend para funcoes sem pasta local encontrada:

- `whatsapp-agent`
- `whatsapp-configure-webhook`
- `whatsapp-connect`
- `whatsapp-send`
- `whatsapp-sync`
- `whatsapp-sync-messages`

Decisao recomendada:

Criar uma matriz unica: `function`, `publicada no cloud`, `existe local`, `declarada config`, `chamada pelo app`, `motivo de public=true/false`, `dono funcional`. Sem isso, novas IAs vao continuar duplicando funcoes.

## Build, testes e qualidade automatica

Build:

- `npm run build` passou.
- Avisos: chunks grandes, classes Tailwind ambiguas, `/noise.png` nao resolvido, warning de CSS minificado.

Testes:

- `npm run test`: 117 passaram, 1 falhou.
- Falha: `src/lib/__tests__/boleto.test.ts`, parser de boleto captura `2026` antes da linha digitavel.

Lint:

- `eslint` nao rodou por `EPERM` lendo dependencia dentro de `node_modules`.
- O projeto tambem desativa `noUnusedLocals`, `noUnusedParameters`, `strict` e `@typescript-eslint/no-unused-vars`, entao hoje o tooling nao detecta lixo automaticamente.

## Segredos e exposicao no frontend

Nao encontrei `service_role` hardcoded no frontend.

Foi encontrado fallback hardcoded em `src/integrations/supabase/client.ts`:

- URL do projeto Supabase.
- Anon key do projeto.

Isso nao e o mesmo que vazar `service_role`, mas e ruim porque se `.env` faltar o app conversa com producao por padrao. Recomendacao: remover fallback de producao e falhar explicitamente quando `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` nao existirem.

## Prioridade de saneamento

1. Privacidade de documentos: migrar `files_psico` para R2 privado, configurar CORS correto e assinar download.
2. Hardening Supabase: revogar grants amplos, revisar `SECURITY DEFINER`, revisar policies `true`.
3. Edge Functions: matriz de inventario e `verify_jwt=false` justificado uma a uma.
4. Corrigir bug de boleto.
5. Remover fallback hardcoded do Supabase client.
6. Limpar dependencias 3D/Babylon/FullCalendar/Mapbox/auth helpers se confirmado sem uso.
7. Limpar componentes orfaos por dominio, sem delecao em massa.

## Proxima sequencia recomendada

Primeira PR de correcao real:

- Corrigir o bug de boleto.
- Remover fallback hardcoded de Supabase no frontend.
- Trocar documentos do paciente para R2 em uma unica area pequena, sem mexer em todos os uploads ainda.

Segunda PR:

- Migrar portal do paciente para download assinado R2.
- Backfill de `files_psico` para R2.
- Tornar `files_psico` privado ou bloquear novos uploads.

Terceira PR:

- Hardening SQL: grants, RPCs e `SECURITY DEFINER`.

Quarta PR:

- Remocao de dependencias e componentes comprovadamente orfaos.
