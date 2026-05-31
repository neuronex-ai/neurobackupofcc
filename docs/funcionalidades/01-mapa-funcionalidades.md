# NeuroNex — Mapa Completo de Funcionalidades por Aba

> Levantamento exaustivo de cada funcionalidade real do painel do psicólogo, mapeada diretamente do código-fonte.
> Última atualização: 24/02/2026

---

## 1. Dashboard (Visão Geral)

**Rota:** `/dashboard`
**Componente:** `DesktopDashboard.tsx`
**Propósito:** Centro de comando do dia — tudo que o psicólogo precisa saber ao abrir o sistema.

### Funcionalidades:

| # | Funcionalidade | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 1.1 | Briefing Matinal | `MorningBriefing` | Resumo inteligente do dia: quantos pacientes, pendências, alertas. Como um assistente pessoal que te conta o que importa antes de começar. |
| 1.2 | Próximo Atendimento | `NextAppointmentCard` | Card destacado com o próximo paciente, horário, tipo (presencial/online) e acesso direto à sessão. |
| 1.3 | Mini Agenda Diária | `MiniDailyAgenda` | Visão compacta de todos os compromissos do dia, com status e horários. |
| 1.4 | Linha do Tempo Semanal | `PremiumTimelineItem` | Timeline premium dos próximos 7 dias de atendimentos, expandível, com status (confirmado/aguardando/concluído). |
| 1.5 | Ações Rápidas | `QuickActions` | Botões de atalho: novo agendamento, novo paciente, abrir notas, etc. |
| 1.6 | Sincronização Google Calendar | `useGoogleCalendarSync` | Sincronização automática em tempo real com o Google Calendar. |
| 1.7 | Contagem de Pendentes | `usePendingPatientsCount` | Alerta de pacientes aguardando confirmação ou ação. |

---

## 2. Agenda Clínica

**Rota:** `/agenda`
**Componente:** `DesktopAgenda.tsx`
**Propósito:** Organizar a vida do psicólogo — agendar, reagendar, visualizar e gerenciar todos os atendimentos.

### Funcionalidades:

| # | Funcionalidade | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 2.1 | Calendário Multi-Visão | `CalendarView` | Visualização em 3 modos: dia, semana e mês. Transições fluidas entre cada visão. |
| 2.2 | Novo Agendamento | `NewAppointmentModal` | Modal completo para criar agendamento: paciente, data/hora, tipo (presencial/online), local, observações. |
| 2.3 | Agendamento Recorrente | `NewRecurringAppointmentModal` | Criar série de sessões recorrentes (semanal, quinzenal, mensal) de uma só vez. |
| 2.4 | Edição de Agendamentos | `EditAppointmentModal` | Editar detalhes de um agendamento existente. |
| 2.5 | Detalhes do Agendamento | `AppointmentDetailModal` | Visualização completa de um agendamento com todas as informações do paciente e da sessão. |
| 2.6 | Reagendamento em Massa | `MassRescheduleModal` | Reagendar múltiplos agendamentos de uma vez (férias, feriados, etc). |
| 2.7 | Transação Vinculada ao Agendamento | `NewAppointmentTransactionModal` | Registrar pagamento/cobrança diretamente vinculado a um agendamento. |
| 2.8 | Uso de Pacote/Sessão Avulsa | `UsePackageSessionModal` | Debitar uma sessão de um pacote contratado pelo paciente. |
| 2.9 | Sidebar com Filtros | `Sidebar` + `AgendaSidebar` | Mini calendário, barra de pesquisa, filtros por tag (Online, Presencial, Primeira Vez). |
| 2.10 | Status Google Calendar | `useGoogleAuth` | Indicador visual de conexão com Google (Conectado/Desconectado) + sincronização bidirecional. |
| 2.11 | Drag & Drop (Arrastar) | `DraggableAppointmentItem` | Arrastar agendamentos para reagendar visualmente na grade. |
| 2.12 | Realtime Updates | `useAgendaRealtime` | Atualizações em tempo real — se outro dispositivo criar um agendamento, aparece instantaneamente. |
| 2.13 | Menu de Ações por Dia | `DayActionMenu` | Ao clicar num dia vazio, menu contextual com opções rápidas. |

---

## 3. Pacientes

**Rota:** `/pacientes` e `/pacientes/:id`
**Componentes:** `PatientsList (index.tsx)` + `PatientDetail.tsx`
**Propósito:** A ficha completa de cada paciente — tudo num só lugar, do prontuário ao financeiro.

### 3A. Lista de Pacientes

| # | Funcionalidade | O que faz |
|-----|-------------------------------|----------------------------------------------|
| 3A.1 | Listagem com Busca | Buscar pacientes por nome, e-mail ou telefone. |
| 3A.2 | Novo Paciente | Formulário completo de cadastro com dados pessoais, contato, endereço. |
| 3A.3 | Editar Paciente | Alterar dados cadastrais de qualquer paciente. |
| 3A.4 | Convite ao Paciente | Enviar convite para o paciente acessar o Portal do Paciente. |
| 3A.5 | Filtros de Status | Filtrar por ativo/inativo/arquivado. |

### 3B. Prontuário do Paciente (Detalhe)

| # | Funcionalidade | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 3B.1 | Resumo Clínico com IA | `ClinicalSummaryCard` | Card gerado por IA com resumo das últimas sessões, evolução e pontos de atenção. |
| 3B.2 | Score de Risco | Lógica interna | Classificação automática em Baixo/Médio/Alto risco baseada em dados clínicos. |
| 3B.3 | Gestão de Medicações | `MedicationUpdateModal` | Registrar, atualizar e acompanhar medicações do paciente (nome, dosagem). |
| 3B.4 | Geração de Documentos | `DocumentGeneratorModal` | Gerar documentos profissionais: relatórios, atestados, encaminhamentos, declarações. |
| 3B.5 | Alterar Status do Paciente | Select de status | Alterar entre Ativo/Inativo/Arquivado diretamente do cabeçalho. |
| 3B.6 | Repetição Rápida de Agendamento | Botão "Agendamento" | Replica o último agendamento para a próxima semana em um clique. |
| 3B.7 | Notas Laterais | `SideNotes` | Bloco de anotações rápidas ancorado no prontuário, sempre visível. |
| 3B.8 | Biofeedback | `BiofeedbackWidget` | Monitoramento e visualização de dados de biofeedback do paciente. |

### 3B — Sub-Abas do Prontuário:

| # | Aba | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 3B.T1 | Histórico | `PatientHistoryTab` | Timeline unificada de todas as sessões, com notas e evolução clínica. |
| 3B.T2 | Anamneses | `AnamnesisTab` | Formulários de anamnese digital, enviáveis ao paciente, com respostas integradas. |
| 3B.T3 | Humor | `PatientMoodTab` | Gráficos de evolução do humor ao longo do tempo, preenchido pelo paciente via portal. |
| 3B.T4 | Metas Terapêuticas | `PatientGoalsTab` | Definir, acompanhar e marcar metas terapêuticas como atingidas. |
| 3B.T5 | Planos/Pacotes | `PatientPackagesTab` | Gerenciar pacotes de sessões (ex: 4 sessões, 8 sessões) — criação, consumo e saldo. |
| 3B.T6 | Financeiro do Paciente | `PatientFinanceTab` | Histórico financeiro individual: pagamentos, cobranças, inadimplência. |
| 3B.T7 | Documentos/Arquivos | `PatientDocumentsTab` | Upload e gestão de arquivos do paciente (laudos, exames, documentos). |

---

## 4. NeuroDrive (Central de Notas & Conhecimento)

**Rota:** `/notas`
**Componente:** `Notes.tsx`
**Propósito:** O segundo cérebro do psicólogo — notas, tarefas, mapas mentais e gestão de conhecimento.

### Sub-Abas (viewMode):

| # | Aba/Modo | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 4.1 | Editor de Notas | `NoteEditor` | Editor rich-text avançado com formatação, blocos, tabelas, citações, checklists. |
| 4.2 | Lista de Notas | `NotesListPanel` | Painel lateral com busca, criação e seleção de notas (chamadas "Fragmentos"). |
| 4.3 | Módulos/Pastas | `NotesSidebar` | Organização por módulos personalizáveis, como pastas temáticas. |
| 4.4 | Modo Foco | `isFocusMode` | Esconde tudo e deixa só o editor — foco absoluto na escrita. |
| 4.5 | Board de Tarefas | `TaskBoard` | Kanban de tarefas com drag & drop, categorias, datas e status. |
| 4.6 | NeuroView | `NeuroView` | Visualização em grafo/rede neural das conexões entre notas e pacientes — mapa mental interativo. |
| 4.7 | NeuroFlow | `NeuroFlow` + `NeuroFlowVault` | Fluxos de trabalho visuais — como um Figma/Miro para processos clínicos e protocolos. |
| 4.8 | NeuroPulse | `NeuroPulse` | Painel de análise e pulso das atividades — métricas de produtividade e uso das notas. |
| 4.9 | Gerenciador de Arquivos | `FilesManager` | Sistema completo de upload, organização e busca de documentos (Google Drive integrado). |
| 4.10 | Notion Sync | `NotionPagesPanel` | Integração com Notion: visualizar e sincronizar páginas do Notion dentro do NeuroNex. |
| 4.11 | Templates | `TemplateSelector` + `TemplateLibraryModal` | Biblioteca de templates prontos para notas clínicas, sessões, relatórios. |
| 4.12 | Menu Mágico de IA | `AIMagicMenu` | Menu contextual com ações de IA: resumir, expandir, corrigir, traduzir texto selecionado. |
| 4.13 | Diagramas Mermaid | `MermaidDiagram` | Criar diagramas visuais (fluxogramas, mapas de conceito) dentro das notas. |
| 4.14 | Lembretes | `RemindersWidget` | Widget de lembretes integrado às notas com datas e categorias. |
| 4.15 | Layout Customizável | Controles de dock | Recolher/expandir sidebar e lista de notas independentemente. |

---

## 5. NeuroBank (Financeiro)

**Rota:** `/financeiro`
**Componente:** `DesktopFinanceiro.tsx`
**Propósito:** Gestão financeira completa — do recebimento ao imposto — sem sair do sistema.

### Sub-Abas (FinanceView):

| # | Aba | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 5.1 | Visão Geral (Overview) | `NeuroNexBankPanel` + `CashFlowScenarios` + `FinancialWidgets` | Painel bancário completo: saldo, faturamento mensal, lucro líquido, despesas operacionais. Gráfico de fluxo de caixa com cenários projetados. |
| 5.2 | Cobranças/Invoices | `InvoicesListPanel` | Lista de todas as cobranças enviadas, com status (paga/pendente/vencida), filtros e busca. |
| 5.3 | Assinaturas & Recorrência | `RecurringManager` | Gerenciar cobranças recorrentes (pacotes mensais, sessões fixas) automatizadas. |
| 5.4 | Links de Pagamento | `InvoicesListPanel` + `NewInvoiceModal` | Gerar links de pagamento avulsos para enviar ao paciente via WhatsApp, e-mail, etc. |
| 5.5 | Conta Digital | `BankAccountsManager` | Gerenciar contas bancárias vinculadas para recebimento (Stripe Connect). |
| 5.6 | Movimentações/Histórico | `FinancialStatement` | Extrato completo de todas as transações — entradas e saídas com filtros e exportação. |
| 5.7 | Painel Fiscal | `InvoiceEmissionModal` | Emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) automatizada. Métricas fiscais: notas emitidas, faturamento tributável, impostos estimados. |
| 5.8 | Repasses & Comissões | `SmartSplit` | Split de pagamento entre profissionais da clínica. Transparência total nos repasses. |
| 5.9 | Onboarding Stripe | `NeuroNexPayWizard` | Wizard guiado para conectar conta Stripe e começar a receber pagamentos. |
| 5.10 | Recibos | `ReceiptModal` + `GlobalReceiptModal` | Geração e visualização de recibos profissionais para cada transação. |
| 5.11 | Nota Fiscal Personalizada | `BrandInvoiceTemplate` | Template de cobrança com identidade visual do profissional. |
| 5.12 | Sidebar Financeira | `FinanceSidebar` | Navegação lateral com acesso rápido a cada seção financeira. |

---

## 6. Teleconsulta

**Rota:** `/teleconsulta`
**Componente:** `Teleconsulta.tsx`
**Propósito:** Atendimento online com vídeo HD — com tudo o que o psicólogo precisa durante a sessão.

### Funcionalidades:

| # | Funcionalidade | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 6.1 | Painel de Sessões Futuras | `UpcomingSessionsPanel` | Lista de todas as teleconsultas agendadas, com countdown e botão de iniciar. |
| 6.2 | Sessão Ativa (Vídeo) | `ActiveSessionPanel` | Painel de videochamada com Jitsi Meet embarcado — vídeo HD profissional. |
| 6.3 | Videochamada Jitsi | `JitsiMeet` | Motor de vídeo Jitsi Meet integrado — sem instalar nada, direct browser. |
| 6.4 | Chat na Sessão | `SessionChat` + `ChatPanel` | Chat em tempo real entre psicólogo e paciente durante a sessão. |
| 6.5 | Controles de Sessão | `SessionControls` | Mutar, desligar câmera, compartilhar tela, encerrar sessão. |
| 6.6 | Recap do Paciente (Sidebar) | `PatientRecapSidebar` | Resumo clínico do paciente visível durante a sessão — último atendimento, metas, alertas. |
| 6.7 | Compartilhamento de Link | `LinkSharing` | Gerar e enviar link da sessão para o paciente. |
| 6.8 | Alertas de Risco | `RiskAlert` | Indicadores visuais de risco clínico durante a sessão. |
| 6.9 | Convite ao Paciente | `InvitePatientModal` | Convidar paciente não cadastrado para a teleconsulta. |
| 6.10 | Workspace com Abas | `WorkspaceTabs` | Abas de trabalho dentro da sessão (chat, notas, prontuário, etc). |
| 6.11 | Ações Pré-Sessão | `PreJoinActions` | Checklist e configurações antes de entrar na sessão. |
| 6.12 | Contexto Clínico | `ContextPills` | Pills de contexto rápido sobre o paciente (medicações, diagnóstico, etc). |
| 6.13 | Feature Gate | `FeatureGate` | Proteção por plano — teleconsulta disponível a partir do Professional. |

---

## 7. Synapse AI (Chat com Inteligência Artificial)

**Rota:** `/synapse-ai`
**Componente:** `DesktopAIChat.tsx`
**Propósito:** Assistente de IA pessoal do psicólogo — conversa, analisa, redige e automatiza.

### Funcionalidades:

| # | Funcionalidade | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 7.1 | Chat com IA | `ChatContent` + `ChatMessageItem` | Conversa natural com a IA: perguntas clínicas, administrativas, redação, análise. |
| 7.2 | Entrada de Texto + Anexos | `ChatInputArea` | Campo de mensagem com suporte a texto, imagens e arquivos anexos. |
| 7.3 | Comandos de Voz | `useSpeechRecognition` + `DesktopVoiceOverlay` | Falar com a IA por voz — transcrição em tempo real e overlay visual. |
| 7.4 | Sidebar de Conversas | `ChatSidebar` | Histórico de todas as conversas com a IA, com busca e criação de novas sessões. |
| 7.5 | Visualizador de Contexto | `ContextVisualizer` | Mostra quais dados do sistema a IA está usando para responder (pacientes, notas, financeiro). |
| 7.6 | Artefatos Interativos | `ArtifactPanel` | Painéis de artefatos gerados pela IA: gráficos, tabelas, documentos, cards de paciente. |
| 7.7 | Estado Vazio Inteligente | `EmptyChatState` | Sugestões de início de conversa e atalhos rápidos quando não há chat ativo. |
| 7.8 | Mini Cards de Paciente | `PatientMiniCard` | Card interativo de paciente gerado na conversa — clique para abrir prontuário. |
| 7.9 | Gráficos sob Demanda | `ChartWidget` | A IA gera gráficos analíticos sob demanda durante a conversa. |
| 7.10 | Preview de Documentos | `PDFPreviewCard` + `DocumentDraftWidget` | Pré-visualização de documentos gerados (PDFs, relatórios). |
| 7.11 | Rascunho de E-mail | `EmailDraftModal` | IA redige e-mails profissionais prontos para enviar. |
| 7.12 | Rascunho de Cobrança | `InvoiceDraftModal` | IA gera cobranças/faturas formatadas para envio. |
| 7.13 | Widget Financeiro | `FinancialChatWidget` | Dados financeiros agregados exibidos durante a conversa. |
| 7.14 | Preview de Notas | `NotesPreviewWidget` | Preview de notas e fragmentos referenciados na conversa. |
| 7.15 | Widget de Ações | `ActionListWidget` | Lista de ações sugeridas pela IA que o psicólogo pode executar com um clique. |
| 7.16 | Tabelas Interativas | `InteractiveTable` | Tabelas de dados geradas pela IA com sorting e filtragem. |
| 7.17 | Indicador de Pensamento | `ThinkingIndicator` | Animação que mostra quando a IA está processando/pensando. |
| 7.18 | Opções IA (Orb) | `AIOptionsOrb` | Botão orbital com opções avançadas de IA (tom, estilo, contexto). |
| 7.19 | Animação de Voz | `VoiceSpiral` | Visualização espiral animada durante input de voz. |
| 7.20 | Widget de Saldo | `AsaasBalanceWidget` | Saldo financeiro rápido no contexto da conversa. |

---

## 8. Ajustes & Configurações

**Rota:** `/ajustes`
**Componente:** `Ajustes.tsx`
**Propósito:** Configurar o sistema inteiro — perfil, segurança, integrações, fiscal, comunicação.

### Sub-Abas:

| # | Aba | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 8.1 | Meu Perfil | `ProfessionalProfileForm` + `NeuroNexIDCard` | Formulário de dados profissionais (CRP, especialidade, bio) + Cartão Digital NeuroNex ID com identidade visual. |
| 8.2 | Segurança | `SecuritySettingsPanel` | Alterar senha, configurar autenticação em duas etapas (2FA), PIN de acesso financeiro. |
| 8.3 | Assinatura | `UpgradePlanModal` | Visualizar plano atual, comparar planos e fazer upgrade (Essential → Professional → Enterprise). |
| 8.4 | Interface & Tour | Toggle de tema + `handleReplayTour` | Alternar entre Dark Mode e Light Mode. Replançar o tour guiado de onboarding. |
| 8.5 | Pagamentos (Stripe) | `NeuroNexPayWizard` | Configurar recebimento de pagamentos via Stripe Connect. |
| 8.6 | Notificações | `NotificationSettings` | Configurar quais notificações receber: e-mail, push, lembretes de sessão, alertas. |
| 8.7 | Relatórios Mensais | `MonthlyReportSettings` | Configurar a geração e envio automático de relatórios mensais de performance. |
| 8.8 | Integrações | Seção integrations | Conectar/desconectar: Google Workspace (Calendar, Drive, Meet, Gmail), Todoist, Notion, Microsoft To Do. |
| 8.9 | Comunicação | `CommunicationSettings` | Templates de mensagens automáticas, lembretes de sessão, e-mails de confirmação, mensagens de aniversário. |
| 8.10 | Dados Fiscais | `FiscalConfigPanel` | CNPJ/CPF, regime tributário, dados para emissão de NFS-e, certificado digital. |
| 8.11 | Equipe/Clínica | `OrganizationSettings` | [Enterprise only] Gerenciar profissionais da clínica, permissões, convites. |
| 8.12 | Sair da Conta | `handleLogout` | Logout seguro do sistema. |

---

## 9. Portal do Paciente

**Rota:** `/portal`
**Componente:** `PatientPortal.tsx`
**Propósito:** Espaço do paciente — acompanhamento de sessões, humor, documentos e financeiro.

### Funcionalidades:

| # | Funcionalidade | Componente | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 9.1 | Agenda de Sessões | `PatientAppointmentsList` | Paciente visualiza suas próximas sessões e histórico. |
| 9.2 | Rastreador de Humor | `MoodTracker` | Paciente registra seu humor diário com escalas e emojis. |
| 9.3 | Solicitar Agendamento | `RequestAppointmentModal` | Paciente pode solicitar novo horário de atendimento. |
| 9.4 | Entrar na Teleconsulta | `JoinSessionModal` | Acesso direto à videochamada da sessão agendada. |
| 9.5 | Financeiro do Paciente | `PatientFinancePanel` + `PatientBillingPanel` | Visualizar cobranças, pagamentos e histórico financeiro. |
| 9.6 | Documentos | `PatientDocumentsPanel` | Acessar documentos compartilhados pelo psicólogo. |
| 9.7 | Metas Terapêuticas | `PatientGoalsPanel` | Visualizar e acompanhar metas definidas com o psicólogo. |
| 9.8 | Progresso Clínico | `PatientProgressPanel` | Gráficos de evolução e progresso do tratamento. |

---

## 10. Funcionalidades Transversais (em todas as páginas)

| # | Funcionalidade | Onde aparece | O que faz |
|-----|-------------------------------|-------------------------------|----------------------------------------------|
| 10.1 | Command Menu (⌘K) | Global | Busca universal: encontre qualquer coisa no sistema digitando. |
| 10.2 | Navbar com Navegação | Global (autenticado) | Barra superior com acesso a todas as abas do sistema. |
| 10.3 | Responsividade Mobile | Todas as páginas | Versões mobile otimizadas de cada página (`MobileNotes`, `MobileSettings`, etc). |
| 10.4 | Tour Guiado (Onboarding) | Global | Tour interativo para novos usuários conhecerem o sistema. |
| 10.5 | App Desktop (Electron) | Global | Versão nativa para Windows/Mac com barra de título personalizada e atualizações automáticas. |
| 10.6 | Dark/Light Mode | Global | Tema escuro (Liquid Glass) e claro (Ceramic) com transição suave. |
| 10.7 | Criptografia & Segurança | Global | Dados criptografados, Row Level Security (RLS) no Supabase, PIN financeiro. |
| 10.8 | Realtime (Tempo Real) | Agenda, Dashboard | Dados atualizados em tempo real via Supabase Realtime. |
| 10.9 | Subscription Guard | Features premium | Controle de acesso por plano: Essential, Professional, Enterprise. |
| 10.10 | Confirmação de Agendamento | Rota pública | Link externo que o paciente recebe para confirmar sua sessão. |
| 10.11 | Anamnese Externa | Rota pública | Formulário de anamnese que o paciente preenche fora do sistema. |
| 10.12 | Cookie Consent | Landing page | Banner de consentimento de cookies (LGPD). |
