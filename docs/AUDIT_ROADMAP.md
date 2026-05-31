# 🧠 NeuroNex — Auditoria Completa & Roadmap Estrutural

> **Data da auditoria:** 15 de Março de 2026  
> **Escopo:** Projeto completo (frontend, mobile, edge functions, banco de dados)  
> **Objetivo:** Limpar, mapear e documentar a arquitetura do sistema  
> **Revisão v2:** Contagens recalculadas e classificações verificadas por grep/import-scan  

---

## A. RESUMO EXECUTIVO

### O que foi encontrado
- **41 arquivos de lixo** na raiz do projeto (logs, dumps de erro, scripts de debug)
- **12 hooks mortos** (sem nenhum import no projeto)
- **2 componentes completamente órfãos** (`FinancialSummary`, `ReportCard`)
- **2 páginas públicas abandonadas** (`About.tsx`, `Careers.tsx` — rotas comentadas)
- **3 stubs vazios** de layout (`Header.tsx`, `Sidebar.tsx`, `ScrollToTop` duplicado em `/utils`)
- **1 diretório vazio** (`empty_dir/`)
- **1 pasta inteira de documentação legada C6** (`@docs/c6/`)
- **1 arquivo de teste avulso** (`supabase/functions/test_stripe.ts`)
- **24 componentes mortos confirmados** — verificação por import-scan confirmou que nenhum é importado por outro arquivo (ver Seção D)
- **5 páginas mobile órfãs** — `MobileAuth`, `MobileIntegrations`, `MobilePacientes`, `MobilePatientPortal` e `MobileTeleconsultation` (duplicata de `MobileTeleconsulta`)

### O que estava bagunçado
- Raiz do projeto cheia de arquivos temporários, logs e scripts de debug
- Hooks acumulados sem uso real
- Resquícios da integração C6 Bank espalhados (docs, nomes de variáveis em hooks)
- Documentação legada do C6 mantida junto com documentação ativa
- Duas versões do componente `ScrollToTop` em locais diferentes
- Stubs artificiais de `Header` e `Sidebar` sem propósito real
- Páginas mobile criadas mas nunca conectadas ao roteamento

### O que foi reorganizado/removido
- ✅ 41 arquivos de lixo removidos da raiz
- ✅ 12 hooks mortos removidos
- ✅ 2 componentes órfãos removidos
- ✅ 2 páginas públicas abandonadas removidas
- ✅ 3 stubs de layout removidos
- ✅ Diretório vazio removido
- ✅ Documentação legada C6 removida (`@docs/c6/`)
- ✅ Arquivo de teste avulso removido
- ✅ Rotas comentadas limpas do `App.tsx`
- ✅ Pasta `reports/` vazia removida
- ✅ Pasta `utils/` (componente duplicado) removida
- ✅ Build verificado e passando após todas as mudanças

---

## B. ESTRUTURA FINAL DO PROJETO

### Mapa de Pastas Principal

```
neuronex-v1/
├── .agent/                        # Configurações de agentes AI
├── .github/                       # CI/CD, workflows
├── @docs/                         # Documentação técnica de referência
│   ├── Stripe/                    # Docs da integração Stripe
│   ├── eleven/                    # Docs Eleven Labs (voz)
│   └── logos/                     # Assets de marca
├── docs/                          # Documentação do projeto
│   ├── ARCHITECTURE.md            # Arquitetura geral
│   ├── (removido)                # Histórico migração C6→Stripe (legado removido)
│   ├── ROADMAP.md                 # Roadmap produto
│   ├── AUDIT_ROADMAP.md           # ★ ESTE DOCUMENTO
│   ├── architecture/              # Diagramas de arquitetura
│   ├── clinical-templates/        # Templates clínicos
│   ├── design-guidelines/         # Guia de design
│   ├── funcionalidades/           # Specs de funcionalidades
│   ├── integrations/              # Specs de integrações
│   ├── product/                   # Docs de produto
│   └── setup/                     # Guias de setup
├── electron/                      # Código Electron (app desktop)
├── marketing-video/               # Projeto de vídeo para marketing
├── public/                        # Assets estáticos
├── scripts/                       # Scripts utilitários (seed, checks)
├── src/                           # ★ CÓDIGO-FONTE PRINCIPAL
│   ├── components/                # Componentes React (320 .tsx)
│   ├── context/                   # React Context providers
│   ├── data/                      # Dados estáticos (templates clínicos)
│   ├── hooks/                     # Custom hooks (99 arquivos)
│   ├── integrations/              # Cliente Supabase
│   ├── lib/                       # Utilitários puros
│   ├── mobile/                    # Experiência mobile completa
│   ├── pages/                     # Páginas roteadas
│   ├── styles/                    # Design tokens & CSS especial
│   ├── test/                      # Setup de testes
│   └── types/                     # TypeScript types
├── supabase/                      # Backend Supabase
│   ├── functions/                 # Edge Functions (63 funções + _shared/)
│   └── migrations/                # Migrations SQL (10 arquivos)
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

### Mapa de Módulos do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEURONEX — MÓDULOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏠 DASHBOARD          📅 AGENDA            👥 PACIENTES        │
│  ├─ MorningBriefing    ├─ CalendarView      ├─ PatientDetail   │
│  ├─ AlertsPanel        ├─ DayColumn         ├─ NewPatientForm  │
│  ├─ NextAppointment    ├─ AppointmentModal  ├─ EditPatient     │
│  ├─ MiniDailyAgenda    ├─ NewAppointment    ├─ PatientTabs:    │
│  ├─ QuickActions       ├─ RecurringAppt     │  ├─ Finance      │
│  ├─ InviteAction       └─ DragDrop          │  ├─ Mood         │
│  └─ ExpandClinic                            │  ├─ Goals        │
│                                              │  ├─ Documents    │
│  💰 FINANCEIRO          📝 NOTAS             │  ├─ Packages    │
│  ├─ NeuroNexBank       ├─ NoteEditor        │  ├─ History      │
│  ├─ TransactionView    ├─ RichTextEditor    │  ├─ Timeline     │
│  ├─ Invoices           ├─ NeuroFlow         │  └─ Anamnesis    │
│  ├─ PIX (7 sub)        ├─ NeuroView                            │
│  ├─ Pagamentos (3 sub) ├─ TaskBoard         🎥 TELECONSULTA    │
│  ├─ Statement          ├─ SegundoCerebro    ├─ ActiveSession   │
│  ├─ SmartSplit         ├─ FilesManager      ├─ JitsiMeet      │
│  ├─ CashFlowScenarios  ├─ NotionPages       ├─ SessionChat     │
│  ├─ RecurringExpenses  └─ Graph (7 files)   ├─ SessionControls│
│  ├─ Onboarding                              ├─ PatientRecap   │
│  └─ KYC/Requirements                       └─ WorkspaceTabs  │
│                                                                 │
│  🤖 SYNAPSE (IA)        ⚙️ CONFIGURAÇÕES     🔐 AUTH           │
│  ├─ CompactPanel       ├─ Professional      ├─ AuthPage       │
│  ├─ Pill               ├─ Communication     ├─ CreateAccount  │
│  ├─ GlobalShell        ├─ Security          ├─ ResetPassword  │
│  └─ WidgetRenderer     ├─ Notifications     ├─ EmailConfirmed │
│                        ├─ FiscalConfig      ├─ ProtectedRoute │
│  🏢 CLÍNICA            ├─ NeuroBank Setup   └─ 2FA Modal      │
│  ├─ TeamOverview       ├─ MonthlyReport                        │
│  ├─ InviteMember       └─ NeuroNex ID Card  📱 PATIENT PORTAL  │
│  ├─ OrgSettings                             ├─ MoodTracker    │
│  └─ ClinicMetrics      🌐 LANDING PAGE      ├─ Appointments   │
│                        ├─ Hero/HeroVisual   ├─ Documents      │
│  🎓 ONBOARDING         ├─ Funcionalidades   ├─ Billing        │
│  ├─ WelcomeOnboarding  ├─ CookieConsent     ├─ Finance        │
│  ├─ AppTour            ├─ Footer            ├─ Goals          │
│  └─ Tour Steps         ├─ WaitlistModal     └─ JoinSession    │
│                        └─ DesktopAppCTA                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### Mapa Mobile

```
src/mobile/
├── components/                    # Componentes exclusivos mobile
│   ├── MobileActiveSession.tsx    # Sessão teleconsulta mobile
│   ├── MobileBottomNav.tsx        # Navegação inferior ativo
│   ├── MobileLayout.tsx           # Layout wrapper mobile ativo
│   ├── MobileTeleconsultationActive.tsx
│   ├── MobileTeleconsultationLobby.tsx
│   ├── SessionReminderDrawer.tsx
│   └── notes/                     # Sub-módulo notas mobile
│       ├── MobileFoldersView.tsx
│       ├── MobileNeuroView.tsx
│       ├── MobileNoteEditor.tsx
│       ├── MobileNoteEditorView.tsx
│       ├── MobileNotesListView.tsx
│       └── MobileTasksView.tsx
│
└── pages/                         # Páginas mobile (14 arquivos .tsx)
    ├── MobileAIChat.tsx           ✅ Roteado via pages/AIChat.tsx
    ├── MobileAgenda.tsx           ✅ Roteado via pages/Agenda.tsx (lazy)
    ├── MobileDashboard.tsx        ✅ Roteado via pages/Dashboard.tsx
    ├── MobileFinanceiro.tsx       ✅ Roteado via pages/Financeiro.tsx
    ├── MobileIndex.tsx            ✅ Roteado via pages/Index.tsx
    ├── MobileNotes.tsx            ✅ Roteado via pages/Notes.tsx
    ├── MobilePatientDetail.tsx    ✅ Roteado via pages/patients-view/PatientDetail.tsx
    ├── MobileSettings.tsx         ✅ Roteado via pages/Ajustes.tsx
    ├── MobileTeleconsulta.tsx     ✅ Roteado via pages/Teleconsulta.tsx
    │                              ─── 9 ativas / 5 órfãs ───
    ├── MobileAuth.tsx             ⚠️ ÓRFÃ — sem rota, sem import externo
    ├── MobileIntegrations.tsx     ⚠️ ÓRFÃ — sem rota, sem import externo
    ├── MobilePacientes.tsx        ⚠️ ÓRFÃ — sem rota, sem import externo
    ├── MobilePatientPortal.tsx    ⚠️ ÓRFÃ — sem rota, sem import externo
    └── MobileTeleconsultation.tsx ⚠️ ÓRFÃ — duplicata de MobileTeleconsulta.tsx

Lógica de Detecção: src/hooks/use-mobile.tsx
├── useIsMobile()     → boolean (breakpoint 768px)
├── useDeviceType()   → 'mobile' | 'tablet' | 'desktop'
├── getIsMobileSync() → boolean (sync, SSR-safe)
└── getDeviceType()   → string  (UA + viewport)

Padrão de Switching: Cada página em src/pages/ usa:
  const isMobile = useIsMobile();
  return isMobile ? <MobileVersion /> : <DesktopVersion />;
```

---

### Mapa de Integrações (Edge Functions)

```
┌──────────────────────────────────────────────────────────────┐
│              INTEGRAÇÕES EXTERNAS (63 funções)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🏦 ASAAS BaaS v3 (edge functions) # Financeiro / NeuroFinance│
│  ├─ asaas-connect-onboarding      → Cria subconta + linka user│
│  ├─ asaas-account-sync            → Sync status/KYC/saldo     │
│  ├─ asaas-account-update          → Atualiza dados/comercial  │
│  ├─ asaas-upload-file             → Upload documentos KYC     │
│  ├─ asaas-submit-kyc              → Submete KYC (quando usado)│
│  ├─ asaas-create-payment          → Cria cobrança (Pix/Boleto)│
│  ├─ asaas-payment-link            → Link de pagamento         │
│  ├─ asaas-refund                  → Estorno                   │
│  ├─ asaas-payout                  → Saque/transferência       │
│  ├─ asaas-pix-out                 → Pix out (quando usado)    │
│  ├─ asaas-balance-details         → Saldo detalhado           │
│  └─ asaas-webhook                 → Webhook handler + dedup   │
│                                                              │
│  📹 JITSI (6 funções)                                       │
│  ├─ generate-jitsi-token        → Token JWT pro             │
│  ├─ jitsi-guest-token           → Token visitante           │
│  ├─ jitsi-token                 → Token genérico            │
│  ├─ jitsi-branding              → Customização visual       │
│  ├─ jitsi-webhook               → Webhook simples (legado)  │
│  └─ jitsi-webhook-handler       → Webhook com auth + switch │
│      ⚠️ jitsi-webhook e jitsi-webhook-handler fazem         │
│         coisas similares; provável duplicata funcional       │
│                                                              │
│  📧 GOOGLE SUITE (9 funções)                                │
│  ├─ google-auth-init            → Inicia OAuth              │
│  ├─ google-auth-callback        → Callback OAuth            │
│  ├─ google-auth-status          → Status conexão            │
│  ├─ google-calendar-sync        → Sincroniza calendário     │
│  ├─ google-calendar-poll        → Polling calendário        │
│  ├─ google-calendar-manage      → Gerencia calendário       │
│  ├─ google-drive-files          → Acesso Drive              │
│  ├─ google-suite-action         → Ações gerais Suite        │
│  └─ send-google-invite          → Convite via Google        │
│                                                              │
│  📱 TWILIO (1 função)                                       │
│  └─ twilio-sms                  → Envio de SMS              │
│                                                              │
│  🔗 NOTION (4 funções)                                      │
│  ├─ notion-auth-init            → OAuth Notion              │
│  ├─ notion-auth-callback        → Callback OAuth            │
│  ├─ notion-pages                → Acesso páginas            │
│  └─ notion-webhook              → Webhook Notion            │
│                                                              │
│  📋 TODOIST (3 funções)                                     │
│  ├─ todoist-auth-init           → OAuth Todoist             │
│  ├─ todoist-auth-callback       → Callback OAuth            │
│  └─ todoist-webhook             → Webhook Todoist           │
│                                                              │
│  🔵 MICROSOFT (2 funções)                                   │
│  ├─ microsoft-auth-init         → OAuth Microsoft           │
│  └─ microsoft-auth-callback     → Callback OAuth            │
│                                                              │
│  🧠 GEMINI / IA (4 funções)                                 │
│  ├─ gemini-text-chat            → Chat IA (multi-arquivo)   │
│  ├─ generate-session-prontuario → Prontuário IA             │
│  ├─ generate-summary            → Resumo IA                 │
│  └─ neuroscan-extract           → OCR/Extração docs         │
│                                                              │
│  📑 FISCAL (2 funções)                                      │
│  ├─ issue-focus-nfe             → Emissão NFSe via Focus    │
│  │   (usa auth do usuário logado, envia prestador+tomador)  │
│  └─ issue-invoice-focusnfe      → Emissão NFSe via Focus    │
│      (usa service role, busca fatura do banco)              │
│      ⚠️ Ambas emitem NFSe na Focus NFe por caminhos        │
│         ligeiramente diferentes — provável duplicata        │
│                                                              │
│  📬 EMAIL / CONVITES (7 funções)                            │
│  ├─ send-appointment-reminder   → Lembrete consulta         │
│  ├─ send-document-email         → Envia documentos          │
│  ├─ send-monthly-report         → Relatório mensal          │
│  ├─ send-patient-invite         → Convite paciente (Resend) │
│  ├─ send-session-invite         → Convite sessão            │
│  ├─ invite-patient              → Cria appointment + email  │
│  │   (cria agendamento pendente e envia email via Resend)   │
│  └─ invite-patient-user         → Cria Auth user p/ portal  │
│      (cria ou convida user no Supabase Auth)                │
│                                                              │
│  📩 LEMBRETES (2 funções)                                   │
│  ├─ send-reminder               → Dispara via webhook/rpc   │
│  └─ send-reminder-email         → Envia via Gmail API       │
│      (funções com escopo distinto: send-reminder é          │
│       genérico e usa RPC; send-reminder-email é Gmail)      │
│                                                              │
│  🔧 UTILITÁRIOS BACKEND (11 funções)                        │
│  ├─ validate-crp                → Validação CRP             │
│  ├─ verify-financial-pin        → Verifica PIN financeiro   │
│  ├─ confirm-appointment         → Confirma agendamento      │
│  ├─ delete-user-account         → Exclusão de conta         │
│  ├─ get-appointment-by-token    → Busca por token           │
│  ├─ get-public-appointment-details → ⚠️ DIRETÓRIO VAZIO    │
│  ├─ get-public-availability     → Disponibilidade pública   │
│  ├─ get-therapist-availability  → ⚠️ DIRETÓRIO VAZIO       │
│  ├─ get-voice-config            → Config de voz             │
│  └─ process-public-appointment  → Processa agendamento      │
│                                                              │
│  🗄️ SHARED (não é função, é biblioteca)                     │
│  ├─ _shared/cors.ts             → CORS headers              │
│  └─ _shared/asaas-client.ts     → Cliente Asaas + helpers   │
│                                                              │
│  ⚠️ NOTAS SOBRE CONTAGEM:                                   │
│  - 64 diretórios no total em supabase/functions/             │
│  - 1 é _shared/ (biblioteca, não é edge function)            │
│  - 2 são diretórios vazios (sem index.ts)                    │
│  - 61 edge functions com código real                         │
│  - Contagem de grupo: 13+6+9+1+4+3+2+4+2+7+2+11 = 64       │
│    (inclui _shared e 2 vazias na conta de 11 utilitários)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## C. LISTA DE LIMPEZA

### Hooks Removidos (12)
| Hook | Motivo |
|------|--------|
| `use-add-session-note.ts` | Sem imports no projeto |
| `use-appointment-volume.ts` | Sem imports no projeto |
| `use-bank-accounts.ts` | Legado C6, sem uso |
| `use-emit-nfse.ts` | Sem imports no projeto |
| `use-fiscal-stats.ts` | Sem imports no projeto |
| `use-monthly-financials.ts` | Sem imports no projeto |
| `use-onboarding.ts` | Sem imports no projeto |
| `use-pending-invoices-total.ts` | Sem imports no projeto |
| `use-realtime-presence.ts` | Sem imports no projeto |
| `use-transaction-templates.ts` | Sem imports no projeto |
| `use-update-reminder.ts` | Sem imports no projeto |
| `useSoundFeedback.ts` | Sem imports no projeto |

### Componentes Removidos (2)
| Componente | Motivo |
|------------|--------|
| `FinancialSummary.tsx` | Não importado por nenhum outro componente |
| `ReportCard.tsx` | Não importado, pasta `reports/` ficou vazia |

### Páginas Removidas (2)
| Página | Motivo |
|--------|--------|
| `About.tsx` | Rota comentada no App.tsx, sem uso |
| `Careers.tsx` | Rota comentada no App.tsx, sem uso |

### Arquivos de Lixo Removidos da Raiz (41)
| Tipo | Arquivos |
|------|----------|
| Scripts de debug | `analyze-hex.ps1`, `fix-encoding.ps1`, `check-stripe.mjs`, `check-stripe.ts`, `force-approve.js`, `get-user.js`, `set-c6-secrets.mjs` |
| Logs/dumps de erro | `errors.txt`, `errors2.txt`, `errors2_utf8.txt`, `errors_utf8.txt`, `ts_errors.log`, `ts_errors.txt`, `ts_errors_2.txt`, `lint_output.txt`, `lint_output_utf8.txt`, `pnpm_error.log` |
| Saídas TSC | `tsc-output.txt` (x4), `tsc_all.txt`, `tsc_errors.txt`, `tsc_errors_utf8.txt`, `tsc_out.txt`, `tsc_output.txt`, `tsc-c6.txt`, `tsc-c6-utf8.txt`, `tsc-c6-2-utf8.txt`, `tsc-c6-3-utf8.txt`, `tsc_c6_errors.txt` |
| C6 legado | `c6-conformidade-result.json`, `c6-test-result.json` |
| Outros | `dummy.png`, `git_history.txt`, `previous_changes.diff`, `remaining_ts6133.txt`, `pnpm-lock.yaml`, `dead_components.txt`, `ELEVENLABS_TOOLS.md`, `ELEVENLABS_TUTORIAL.md` |

### Stubs/Duplicados Removidos (3)
| Arquivo | Motivo |
|---------|--------|
| `layout/Header.tsx` | Re-export vazio de Navbar, sem imports |
| `layout/Sidebar.tsx` | Componente que retorna null, sem imports |
| `utils/ScrollToTop.tsx` | Duplicata simplificada do `layout/ScrollToTop.tsx` |

### Diretórios Removidos (3)
| Diretório | Motivo |
|-----------|--------|
| `empty_dir/` | Completamente vazio |
| `components/reports/` | Ficou vazia após remoção de `ReportCard.tsx` |
| `components/utils/` | Ficou vazia após remoção de `ScrollToTop.tsx` |

### Documentação Legada Removida
| Diretório | Motivo |
|-----------|--------|
| `@docs/c6/` | 22+ arquivos de documentação do C6 Bank, integração substituída por Stripe |

### Backend
| Arquivo | Motivo |
|---------|--------|
| `supabase/functions/test_stripe.ts` | Script de teste avulso fora da estrutura de funções |

---

## D. LISTA DE ATENÇÃO

### ⚠️ Componentes Mortos Confirmados (24 — mantidos por cautela)

Verificação por import-scan mostrou que **nenhum** destes 24 componentes é importado por qualquer outro arquivo no projeto. A única referência de cada um é o próprio arquivo (auto-referência). Foram mantidos porque a remoção massiva sem teste de regressão seria arriscada — podem ter sido planejados para uso futuro.

| # | Componente | Localização | Observação |
|---|------------|-------------|-----------|
| 1 | `AgendaView.tsx` | components/agenda | 0 imports externos |
| 2 | `EditAppointmentForm.tsx` | components/agenda | 0 imports externos |
| 3 | `MassRescheduleModal.tsx` | components/agenda | 0 imports externos |
| 4 | `NewRecurringAppointmentModal.tsx` | components/agenda | 0 imports externos |
| 5 | `CommunicationActionModal.tsx` | components/dashboard | 0 imports externos |
| 6 | `FinancialWidgets.tsx` | components/dashboard | 0 imports externos |
| 7 | `BankAccountsManager.tsx` | components/financeiro | 0 imports externos |
| 8 | `CreatePaymentLinkModal.tsx` | components/financeiro | 0 imports externos |
| 9 | `GlobalReceiptModal.tsx` | components/financeiro | 0 imports externos |
| 10 | `PayoutsHistoryWidget.tsx` | components/financeiro | 0 imports externos |
| 11 | `RecurringManager.tsx` | components/financeiro | 0 imports externos |
| 12 | `RevenueLeakageWidget.tsx` | components/financeiro | 0 imports externos |
| 13 | `StatementPrintModal.tsx` | financeiro/statement | 0 imports externos |
| 14 | `SubscriptionModal.tsx` | components/landing | 0 imports externos |
| 15 | `AIMagicMenu.tsx` | components/notes | 0 imports externos |
| 16 | `TemplateLibraryModal.tsx` | components/notes | 0 imports externos |
| 17 | `SessionNoteCard.tsx` | components/patients | 0 imports externos |
| 18 | `NeuroBankOnboardingSteps.tsx` | components/settings | 0 imports externos |
| 19 | `SynapseActionTimeline.tsx` | components/synapse | 0 imports externos |
| 20 | `SynapseCommandCenter.tsx` | components/synapse | 0 imports externos |
| 21 | `ContextPills.tsx` | components/teleconsulta | 0 imports externos |
| 22 | `graph-renderer.ts` | notes/graph | 0 imports externos |
| 23 | `graph-simulation.ts` | notes/graph | 0 imports externos |
| 24 | `use-graph-interactions.ts` | notes/graph | 0 imports externos |

### ⚠️ Páginas Mobile Órfãs (5 — não conectadas a rotas)

| # | Página | Status | Recomendação |
|---|--------|--------|-------------|
| 1 | `MobileAuth.tsx` | Sem rota, sem import | Conectar ao `AuthPage.tsx` ou remover |
| 2 | `MobileIntegrations.tsx` | Sem rota, sem import | Conectar ao `Ajustes.tsx` ou remover |
| 3 | `MobilePacientes.tsx` | Sem rota, sem import | Desktop usa `useIsMobile` inline em `patients-view/index.tsx` |
| 4 | `MobilePatientPortal.tsx` | Sem rota, sem import | `PatientPortal.tsx` não delega ao mobile |
| 5 | `MobileTeleconsultation.tsx` | Duplicata | Nome diferente de `MobileTeleconsulta.tsx` que É usada |

### ⚠️ Edge Functions com Problemas

| Problema | Funções | Detalhe |
|----------|---------|---------|
| **Diretório vazio** | `get-public-appointment-details`, `get-therapist-availability` | Pasta existe mas sem `index.ts` — nunca foram implementadas |
| **Duplicata funcional** | `jitsi-webhook` vs `jitsi-webhook-handler` | Ambas recebem webhooks do Jitsi; `jitsi-webhook-handler` tem auth e switch/case mais robusto |
| **Duplicata funcional** | `issue-focus-nfe` vs `issue-invoice-focusnfe` | Ambas emitem NFSe via Focus NFe; diferem na autenticação (usuario vs service role) e na busca de dados |
| **Simulação rotulada** | `stripe-pix-out` | O nome sugere transferência Pix via Stripe, mas o código apenas debita o ledger interno — não há chamada à API Stripe. Funciona como placeholder para futuro BaaS |

### ⚠️ Pontos Frágeis Identificados

1. **Hooks com referências C6 residuais**: `use-neurobank-balance.ts`, `use-neurobank-pix.ts`, `use-neurobank-payments.ts`, `use-neurobank-scheduled-payments.ts`, `use-neurobank-statement.ts` contêm comentários ou variáveis referenciando C6. Funcionam, mas merecem limpeza interna de nomenclatura.

2. **Dois `MobileBottomNav` diferentes**: Um em `components/landing/MobileBottomNav.tsx` (landing page pública) e outro em `mobile/components/MobileBottomNav.tsx` (app logado). Escopos distintos, mas o nome idêntico causa confusão.

3. **Componentes gigantes** — alto risco de manutenção:
   - `FilesManager.tsx` — **69 KB**
   - `SynapseCompactPanel.tsx` — **55 KB**
   - `Ajustes.tsx` — **47 KB**
   - `DesktopFinanceiro.tsx` — **45 KB**

4. **`SecuritySettings.tsx` vs `SecuritySettingsPanel.tsx`**: Dois componentes de segurança em settings com sobreposição de responsabilidade não clara.

5. **`BrandInvoiceTemplate.tsx` duplicado**: Existe em `components/financeiro/` e em `components/financeiro/invoice/`. Versões diferentes do mesmo conceito.

---

## E. ROADMAP VISUAL DO PROJETO

### Arquitetura do Sistema — Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONT-END                             │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐               │
│  │ Landing │  │   Auth   │  │  App (logado) │               │
│  │  Page   │  │  Pages   │  │              │               │
│  │ (público│  │          │  │  ┌─────────┐ │               │
│  │   web)  │  │ Login    │  │  │ Desktop │ │               │
│  │         │  │ Register │  │  │  View   │ │               │
│  │ Hero    │  │ Reset    │  │  ├─────────┤ │  ┌──────────┐ │
│  │ Funcs   │  │ 2FA      │  │  │ Mobile  │ │  │ Electron │ │
│  │ Footer  │  │          │  │  │  View   │ │  │ (Desktop)│ │
│  └─────────┘  └──────────┘  │  └─────────┘ │  │  App     │ │
│                              └──────────────┘  └──────────┘ │
├──── Padrão de Roteamento ───────────────────────────────────┤
│                                                              │
│  App.tsx → SharedRoutes → Page.tsx → useIsMobile()          │
│                              ↓              ↓                │
│                     DesktopVersion    MobileVersion           │
│                                                              │
├──── Providers (contexto global) ────────────────────────────┤
│  QueryClient → ThemeProvider → SessionContext → AIProvider  │
│  → SynapseProvider → SubscriptionProvider → TourProvider    │
├──── Estado & Dados ──────────────────────────────────────────┤
│  TanStack Query (react-query) + Supabase Realtime           │
│  99 custom hooks para operações de domínio                  │
├──── Backend ─────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Storage + Realtime)          │
│  63 Edge Functions (Deno) + _shared/                         │
│  Stripe Connect (financeiro)                                 │
│  Jitsi (teleconsulta)                                        │
│  Google Suite (calendário/drive/email)                       │
│  Twilio (SMS)                                                │
│  Gemini (IA)                                                 │
│  ElevenLabs (voz/TTS)                                        │
│  Focus NFe (fiscal)                                          │
└──────────────────────────────────────────────────────────────┘
```

### Fluxo de Navegação — Mapa de Rotas

```
/                        → Index (landing ou redirect)
├── /auth                → AuthPage (login)
├── /create-account      → CreateAccount
├── /email-confirmed     → EmailConfirmedPage
├── /reset-password      → ResetPasswordPage
├── /account-created     → AccountCreated
├── /google-connection-success → GoogleConnectionSuccess
│
├── /confirmar-agendamento/:token → ConfirmAppointment (semi-público)
├── /join/:appointmentId → JoinSession (semi-público)
├── /payment/callback    → PaymentCallback (semi-público)
├── /anamnese-externa/:id → AnamnesisPublic (semi-público)
│
├── [WEB ONLY - Público]
│   ├── /contact         → Contact
│   ├── /help            → HelpCenter
│   ├── /legal           → Legal
│   ├── /politica-de-privacidade → PoliticaDePrivacidade
│   ├── /termos-de-uso   → TermosDeUso
│   ├── /configuracoes-de-cookies → ConfiguracoesDeCookies
│   ├── /newsletter      → Newsletter
│   ├── /neurobank       → FinanceLanding
│   └── /funcionalidades → Funcionalidades
│
├── [PROTEGIDAS]
│   ├── /dashboard       → Dashboard (Desktop/Mobile)
│   ├── /agenda          → Agenda (Desktop/Mobile)
│   ├── /pacientes       → Pacientes (responsive)
│   ├── /pacientes/:id   → PatientDetail (Desktop/Mobile)
│   ├── /notas           → Notes (Desktop/Mobile)
│   ├── /financeiro      → Financeiro (Desktop/Mobile)
│   ├── /ajustes         → Ajustes (Desktop/Mobile)
│   ├── /teleconsulta    → Teleconsulta (Desktop/Mobile)
│   └── /synapse-ai      → AIChat (Desktop/Mobile)
│
├── [ELECTRON ONLY]
│   └── /help            → DesktopHelpCenter
│
├── [PATIENT PORTAL - WEB ONLY]
│   └── /portal          → PatientPortal
│
├── /404                 → NotFound
└── *                    → Redirect (/ ou /auth)
```

### Hooks — Organização por Domínio (99 hooks)

Lista completa dos 99 hooks recontados e verificados contra o diretório real:

```
hooks/ (99 hooks = 18 + 8 + 19 + 5 + 4 + 7 + 6 + 12 + 5 + 5 + 2 + 2 + 3 + 3)

├── 🏥 Pacientes (18)
│   use-patients, use-patients-list, use-patient-by-id,
│   use-patient-data, use-add-patient, use-update-patient,
│   use-delete-patient, use-patient-appointments,
│   use-patient-attachments, use-patient-documents,
│   use-patient-goals, use-patient-mood-logs,
│   use-patient-packages, use-patient-session-summary,
│   use-patient-shared-documents, use-patient-timeline,
│   use-patient-transactions, use-patient-context-summary
│
├── 📅 Agenda (8)
│   use-appointments, use-appointments-by-date-range,
│   use-appointments-by-range, use-add-appointment,
│   use-update-appointment, use-add-recurring-appointment,
│   use-day-operations, use-agenda-realtime
│
├── 💰 Financeiro (19)
│   use-financial-account, use-financial-metrics,
│   use-financial-settings, use-generate-invoice,
│   use-invoices, use-transactions, use-add-transaction,
│   use-update-transaction, use-projected-cash-flow,
│   use-recurring-expenses, use-recurring-invoices,
│   use-revenue-leakage, use-neurobank-balance,
│   use-neurobank-payments, use-neurobank-payouts,
│   use-neurobank-pix, use-neurobank-scheduled-payments,
│   use-neurobank-statement, use-stripe-balance-details
│
├── 🤖 IA / Synapse (5)
│   use-ai-chat, use-synapse-chat, use-gemini-voice,
│   use-speech-recognition, use-text-to-speech
│
├── 📝 Notas (4)
│   use-session-notes, use-note-modules,
│   use-personal-notes, use-create-personal-note
│
├── 🔗 Integrações (7)
│   use-google-auth, use-google-calendar-sync,
│   use-microsoft-auth, use-notion-auth, use-notion-pages,
│   use-todoist-auth, use-twilio-sms
│
├── 📦 Pacotes / Assinaturas (6)
│   use-active-patient-packages, use-add-patient-package,
│   use-delete-patient-package, use-update-patient-package,
│   use-use-package-session, use-subscription-plan
│
├── ⚙️ Config / Sistema (12)
│   use-mobile, use-theme, useThemeTransition, use-profile,
│   use-organization, use-notification-settings,
│   use-fiscal-settings, use-welcome-onboarding,
│   use-voice-config, use-app-update,
│   use-validate-crp, use-smart-availability
│
├── 📬 Comunicação (5)
│   use-send-email, use-send-reminder, use-invite-patient,
│   use-reminders, use-create-reminder
│
├── 📄 Documentos / Uploads (5)
│   use-upload-attachment, use-upload-avatar,
│   use-upload-document, use-upload-invoice,
│   use-generate-session-prontuario
│
├── 🎯 Dashboard (2)
│   use-dashboard-alerts, use-last-session-summary
│
├── 🎥 Teleconsulta (2)
│   use-jitsi-token, use-biofeedback
│
├── 📑 Fiscal (1)
│   use-focus-nfe
│
├── 💳 Transações / Portal (3)
│   use-add-appointment-transaction,
│   use-patient-portal-invoices,
│   use-patient-portal-transactions
│
└── 🔧 Utilidades (2)
    use-smooth-scroll, use-pending-patients-count

SOMA: 18+8+19+5+4+7+6+12+5+5+2+2+1+3+2 = 99 ✅
```

### Banco de Dados — Migrations

```
supabase/migrations/ (10 migrations)
├── 20240130 — Tabelas AI Chat
├── 20240131 — Embeddings Chat
├── 20240131 — Fix Patients RLS
├── 20240201 — Organizações
├── 20240214 — Tabelas Neuro
├── 20240225 — Anamneses Delete Policy
├── 20260313 — NeuroBank v2 Stripe Ledger     ← Core financeiro
├── 20260313 — Cleanup C6 Legacy Tables       ← Limpeza C6
├── 20260313 — Strengthen Stripe Ledger       ← Reforço schema
└── 20260313 — Stripe Embedded Onboarding     ← Onboarding KYC
```

---

## F. AUDITORIA DE BANCO DE DADOS (SUPABASE CLOUD)

### 📊 Visão Geral do Schema e Lógica Interna
O banco de dados do NeuroNex atua como um "Smart DB", com regras de negócio críticas centralizadas diretamente no PostgreSQL, usando exaustivamente extensões, funções RPC, Triggers e Row Level Security (RLS). A análise revelou uma arquitetura robusta, mas com pontos clássicos de debito técnico em controle de acesso.

### ⚡ Funções RPC (Stored Procedures) Principais
- **Gestão Contábil**: `recalculate_ledger_balance` e `prevent_ledger_mutation` formam o coração do NeuroBank.
- **Integração IA (pgvector)**: Utilização ativa da extensão `vector` com `match_documents`, `match_messages_gemini` e `match_normative_documents`.
- **Painéis de Resumo**: `get_financial_metrics` e `get_monthly_report_data` agregam dados massivos diretamente no banco.
- **Gestão de Utilitários**: `verify_financial_pin` criptografa PIN com bcrypt nativo do pgcrypto; `export_user_data` compila os dados do usuário para conformidade de dados (LGPD).
- **Core de Usuários**: `handle_new_user` intercepta o fluxo do Supabase Auth para criar na tabela public.profiles.

### 🔄 Automações e Triggers no DB
- **Imutabilidade Financeira**: O Ledger é bloqueado por design (Triggers: `prevent_ledger_update`, `prevent_ledger_delete`). Atualizações em saldos dependem puramente de `INSERT` através de cálculos em triggers (`auto_recalculate_on_ledger_*`).
- **Log de Auditoria**: `audit_patients_changes` e `audit_session_notes_changes` invocam um trigger agnóstico (`audit_trigger`) que cria snapshots imutáveis em `audit_logs` salvando JSONs estruturados (`old_data`, `new_data`).
- **Automação de Agenda**: O trigger `tr_sync_package_sessions` decrementa os pacotes automaticamente quando uma sessão é marcada como concluída ou reestabelece caso cancelada.

### 🛡️ Políticas RLS (Row Level Security) e Controle de Acesso
- **Multitenancy**: Todas as tabelas principais operam sob as regras de `auth.uid() = user_id` e/ou validação via token anônimo.
- **Acesso Gradular a Terceiros**: Tabela `patient_anamneses` aceita `INSERT` de authenticated mas depende checagem cruzada com email do `patients` ou `token_expires_at` para links web do Portal do Paciente. 
- **⚠️ Hardcoded Admins (Atenção)**: A policy "Admins can view webhook logs" restringe por e-mail fixo: `((auth.jwt() ->> 'email'::text) = 'admin@neuronex.com'::text)`. É altamente recomendável migrar isso para custom auth claims usando auth.jwt() -> 'app_metadata' -> 'role' ou via uma tabela `admin_roles`.

### 🧹 Oportunidades de Limpeza e Refatoração
1. Mover as funções de lixo rotineiras (ex: `cleanup_old_notifications`) para cron jobs com a extensão `pg_cron`.
2. Remover hardcoded admins (`admin@neuronex.com`) e padronizar papéis (RBAC - Role Based Access Control).
3. Analisar desempenho de `match_documents` e `match_messages_gemini` conforme volume sobe. Garantir criação de índices HNSW / IVFFlat nessas tabelas usando pgvector.
4. Identificar tabelas financeiras adjacentes sem os triggers `prevent_ledger_delete` (como precaução).

---

## G. SUGESTÕES FUTURAS

### Prioridade Alta (próxima sessão)
1. **Decidir sobre as 5 páginas mobile órfãs** — conectar às rotas ou remover
2. **Decidir sobre os 24 componentes mortos** — remover com teste de build ou manter com `// TODO`
3. **Remover 2 diretórios vazios de edge functions** — `get-public-appointment-details`, `get-therapist-availability`
4. **Quebrar componentes gigantes** — `FilesManager.tsx` (69KB), `SynapseCompactPanel.tsx` (55KB), `Ajustes.tsx` (47KB), `DesktopFinanceiro.tsx` (45KB)
5. **Resolver duplicatas de edge functions** — `jitsi-webhook` vs `jitsi-webhook-handler`, `issue-focus-nfe` vs `issue-invoice-focusnfe`
6. **Renomear ou documentar `stripe-pix-out`** — o nome sugere capacidade que não existe; marcar como simulação

### Prioridade Média
7. **Resolver duplicata `BrandInvoiceTemplate`** — duas versões em locais diferentes
8. **Limpar referências C6 residuais** nos hooks do NeuroBank
9. **Unificar ou renomear os dois `MobileBottomNav`** para evitar confusão
10. **Clarificar `SecuritySettings` vs `SecuritySettingsPanel`** — possível fusão
11. **Adicionar barrel exports (index.ts)** em pastas de componentes que não têm

### Prioridade Baixa (melhoria contínua)
12. **Mover hooks por domínio em sub-pastas** — hoje 99 hooks soltos em uma pasta
13. **Criar testes para componentes críticos** — atualmente apenas 1 arquivo de test setup
14. **Consolidar documentação** — `docs/` e `@docs/` são dois locais diferentes
15. **Remover `marketing-video/`** se não estiver em uso ativo (tem node_modules próprio)

### O que NÃO foi mexido (decisão consciente)
- **Nenhuma regra de negócio alterada**
- **Nenhuma UI modificada**
- **24 componentes mortos mantidos** — confirmados como sem import, mas remoção em massa é arriscada sem testes
- **5 páginas mobile órfãs mantidas** — podem representar trabalho futuro planejado
- **Edge functions mantidas intactas** — mesmo as duplicatas, pois podem estar em deploy ativo
- **Configurações (tailwind, vite, tsconfig) não modificadas**
- **`marketing-video/` mantida** — projeto separado com seu próprio package.json

---

> **Status final:** Build ✅ passando | 60+ arquivos removidos | 0 regressões | Projeto auditado e documentado  
> **Revisão v2:** Contagens recalculadas, classificações corrigidas, edge functions auditadas por conteúdo
