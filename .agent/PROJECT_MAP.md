# 🗺️ NeuroNex — Project Map

> **Propósito**: Mapa central da estrutura do projeto para orientação de agentes IA.
> **Atualizado em**: 2026-02-28 (pós-auditoria profunda)

---

## 📂 Estrutura de Diretórios

```
neuronex-v1/
│
├── 📱 src/                          # ===== CÓDIGO-FONTE DA APLICAÇÃO =====
│   ├── App.tsx                      # Router principal (todas as rotas)
│   ├── main.tsx                     # Entry point React
│   ├── index.css                    # Estilos globais + design tokens
│   ├── App.css                      # Estilos do App wrapper
│   ├── vite-env.d.ts                # Tipos do ambiente Vite
│   │
│   ├── components/                  # Componentes React (~305 arquivos)
│   │   ├── agenda/                  # Módulo de agendamento
│   │   ├── ai-chat/                 # Chat com IA (Synapse AI)
│   │   ├── animations/              # Componentes de animação
│   │   ├── auth/                    # Autenticação (login, registro, proteção)
│   │   ├── clinic/                  # Gestão de clínica
│   │   ├── dashboard/               # Painel principal (Dashboard)
│   │   ├── electron/                # Componentes Electron (TitleBar, Updater)
│   │   ├── financeiro/              # Módulo financeiro / NeuroBank
│   │   ├── icons/                   # Ícones SVG customizados
│   │   ├── integrations/            # Integrações externas (Todoist, Drive, etc)
│   │   ├── landing/                 # Landing page + visuais 3D + globo
│   │   ├── layout/                  # Layout geral (sidebar, header, scroll)
│   │   ├── notes/                   # Notas clínicas e editor TipTap
│   │   ├── onboarding/              # Onboarding / tour guiado
│   │   ├── patient-portal/          # Portal do paciente
│   │   ├── patients/                # Gestão de pacientes
│   │   ├── reports/                 # Relatórios
│   │   ├── settings/                # Configurações e ajustes
│   │   ├── subscription/            # Planos e assinaturas (se aplicável; provedor bancário: Asaas)
│   │   ├── teleconsulta/            # Teleconsulta / videochamada
│   │   ├── theme/                   # Tema dark/light
│   │   ├── ui/                      # Componentes UI base (shadcn/Radix)
│   │   └── utils/                   # Utilitários visuais
│   │
│   ├── pages/                       # Páginas da aplicação (~38 arquivos)
│   ├── hooks/                       # Custom React Hooks (~110 arquivos)
│   ├── context/                     # React Contexts (AI, Subscription)
│   ├── data/                        # Dados estáticos / mock
│   ├── integrations/                # Clientes de integração (Supabase client)
│   ├── lib/                         # Utilitários (utils.ts, electron helpers)
│   ├── mobile/                      # Componentes mobile (Capacitor)
│   ├── styles/                      # Design tokens e estilos extras
│   ├── types/                       # Definições TypeScript
│   └── test/                        # Testes unitários
│
├── 🖥️ electron/                     # ===== ELECTRON (PROCESSO PRINCIPAL) =====
│   ├── main.ts                      # Entry point do processo principal
│   └── preload.ts                   # Script de preload
│
├── 🗄️ supabase/                     # ===== SUPABASE =====
│   ├── migrations/                  # Migrations SQL do banco
│   ├── functions/                   # Edge Functions (Deno)
│   └── config.toml                  # Configuração local Supabase
│
├── 🌐 public/                       # ===== ASSETS ESTÁTICOS =====
│   ├── assets/                      # Imagens e logos da marca
│   ├── download/                    # Instaladores (.exe) para download
│   ├── images/                      # Imagens diversas
│   ├── favicon-*.ico/png            # Favicons dark/light
│   ├── manifest.json                # PWA manifest
│   ├── robots.txt                   # SEO crawling rules
│   └── sitemap.xml                  # SEO sitemap
│
├── 🤖 [REMOVIDO] .factory/          # Fábrica autônoma removida na auditoria
│
├── 🛠️ scripts/                      # ===== SCRIPTS DE BUILD =====
│   ├── check-imports.js             # Validação de imports
│   ├── create-ico.cjs               # Geração de ícone .ico
│   ├── rename-cjs.cjs               # Renomeia .js para .cjs (Electron)
│   ├── seed-patients.sql            # Seed SQL para pacientes de teste
│   └── seed-test-patients.ts        # Seed TypeScript para testes
│
├── 📄 docs/                         # ===== DOCUMENTAÇÃO =====
│   ├── ARCHITECTURE.md              # Arquitetura do sistema
│   ├── ROADMAP.md                   # Roadmap de features
│   ├── project-overview.md          # Visão geral técnica do projeto
│   ├── apresentacao_neuronex.md     # Apresentação / pitch
│   ├── roteiro_apresentacao_*.md    # Roteiro narrativo
│   │
│   ├── funcionalidades/             # Specs detalhadas por feature
│   │   ├── 01-mapa-funcionalidades.md
│   │   ├── 02-dashboard.md
│   │   ├── 03-agenda.md
│   │   ├── 04-pacientes.md
│   │   ├── 05-neurodrive.md
│   │   ├── 06-neurobank.md
│   │   ├── 07-teleconsulta.md
│   │   ├── 08-synapse-ai.md
│   │   ├── 09-ajustes.md
│   │   ├── 10-portal-paciente.md
│   │   ├── 11-transversais.md
│   │   └── 12-blueprint-pagina.md
│   │
│   ├── design-guidelines/           # Guias de design e marca
│   │   ├── neuronex-brand-dna.md    # DNA da marca
│   │   └── *.pdf                    # PDFs de guias visuais
│   │
│   ├── product/                     # Documentação de produto
│   │   ├── AI_BRAND_MANUAL.md
│   │   ├── OVERVIEW_DIFERENCIAIS.md
│   │   └── LP_*.md                  # Specs de landing pages
│   │
│   ├── setup/                       # Guias de configuração
│   │   ├── electron-install-guide.md
│   │   ├── white-mode-implementation.md
│   │   ├── DEPLOY_EDGE_FUNCTIONS.md
│   │   ├── EVOLUTION_CONFIG.md
│   │   ├── edge-functions-jwt-audit.md
│   │   └── implementation_plan_production.md
│   │
│   ├── integrations/                # Docs de integrações (limpas)
│   │   ├── INTEGRACOES_TODOIST_DRIVE.md
│   │   ├── cfp_api_endpoints.txt
│   │   └── n8n-fixes.md
│   │
│   └── clinical-templates/          # Templates de anamnese
│       ├── anamnese-adolescente.md
│       ├── anamnese-adulto-e-idoso.md
│       └── anamnese-infantil.md
│
├── 🧠 .agent/                       # ===== AGENTES IA (ANTIGRAVITY/GENÉRICO) =====
│   ├── AI_RULES.md                  # Regras e tech stack do projeto
│   ├── AGENTS.md                    # Configuração de agentes Codex CLI / AIOS
│   ├── PROJECT_MAP.md               # ← ESTE ARQUIVO
│   ├── plans/                       # Planos de implementação
│   └── workflows/                   # Workflows (ex: electron-build)
│
├── 🔧 .github/agents/              # Agentes do GitHub Copilot
├── 🔧 .gemini/                     # Agentes e comandos Gemini
├── 🔧 .antigravity/                # Configuração do Antigravity
│
├── 🎬 marketing-video/             # Projeto de vídeo marketing (Remotion)
├── 📦 @docs/logos/                  # Logos da marca
│
├── ⚙️ Arquivos de Configuração (RAIZ)
│   ├── package.json                 # Dependências e scripts npm
│   ├── package-lock.json            # Lock file npm
│   ├── tsconfig.json                # Config TypeScript (base)
│   ├── tsconfig.app.json            # Config TypeScript (app)
│   ├── tsconfig.node.json           # Config TypeScript (node)
│   ├── tsconfig.electron.json       # Config TypeScript (electron)
│   ├── vite.config.ts               # Configuração Vite
│   ├── vitest.config.ts             # Configuração Vitest
│   ├── tailwind.config.ts           # Configuração Tailwind CSS
│   ├── postcss.config.js            # Configuração PostCSS
│   ├── eslint.config.js             # Configuração ESLint
│   ├── electron-builder.json5       # Configuração electron-builder
│   ├── capacitor.config.ts          # Configuração Capacitor (mobile)
│   ├── components.json              # Configuração shadcn/ui
│   ├── vercel.json                  # Configuração Vercel (deploy web)
│   ├── index.html                   # Entry point HTML
│   │
│   ├── .env                         # Vars de backend/CLI (AIOS, Gemini). NÃO lido pelo Vite
│   ├── .env.example                 # Template completo de todas as vars possíveis
│   ├── .env.local.example           # Template para VITE_* vars (frontend)
│   │   # NOTA: O Vite lê VITE_* de .env.local (quando existir).
│   │   # O frontend tem fallbacks hardcoded em:
│   │   #   src/integrations/supabase/client.ts
│   │   #   (Stripe removido; provedor bancário: Asaas)
│   │
│   └── .gitignore                   # Regras de exclusão do Git
│
└── 📂 Gerados (ignorados pelo git)
    ├── node_modules/                # Dependências npm
    ├── dist/                        # Build de produção web
    ├── dist-electron/               # Build do processo principal Electron
    ├── build/                       # Assets de build (ícones, etc)
    ├── release-current/             # Instalador Electron atual
    └── logs/                        # Logs de execução
```

---

## 🔍 Guia Rápido para Agentes

| Preciso de...                          | Onde encontrar                                         |
|----------------------------------------|--------------------------------------------------------|
| Rotas da aplicação                     | `src/App.tsx`                                          |
| Componente de uma feature              | `src/components/<feature>/`                            |
| Página específica                      | `src/pages/<Nome>.tsx`                                 |
| Hook customizado                       | `src/hooks/use<Nome>.ts`                               |
| Cliente Supabase                       | `src/integrations/supabase/client.ts`                  |
| Tipos TypeScript                       | `src/types/`                                           |
| Estilos globais                        | `src/index.css`                                        |
| Design tokens                          | `src/styles/`                                          |
| Utilitários                            | `src/lib/utils.ts`                                     |
| Migrations do banco                    | `supabase/migrations/`                                 |
| Edge Functions                         | `supabase/functions/`                                  |
| Specs de funcionalidades               | `docs/funcionalidades/`                                |
| Guias de design                        | `docs/design-guidelines/`                              |
| Configuração de build                  | `vite.config.ts`, `tsconfig*.json`                     |
| Build do Electron                      | `.agent/workflows/electron-build.md`                   |
| Auditoria e roadmap                    | `.agent/AUDIT_ROADMAP.md`                              |
| Regras para agentes IA                 | `.agent/AI_RULES.md`                                   |
| Mapa do projeto                        | `.agent/PROJECT_MAP.md` (este arquivo)                 |

---

## 🏗️ Tech Stack

| Camada         | Tecnologia                    |
|----------------|-------------------------------|
| Runtime        | Node.js v22+                  |
| Linguagem      | TypeScript 5.8+               |
| Framework      | React 18                      |
| Bundler        | Vite 5                        |
| Desktop        | Electron 33                   |
| Mobile         | Capacitor                     |
| CSS            | Tailwind CSS 3.4              |
| UI Components  | shadcn/ui + Radix UI          |
| 3D/Visuais     | three.js, cobe, framer-motion |
| Backend        | Supabase (PostgreSQL + Auth)  |
| Infra BaaS     | Asaas (API v3 / BaaS)         |
| Editor de Texto| TipTap                        |
| Gráficos       | Recharts, ReactFlow           |
| Mapas          | Mapbox GL                     |
