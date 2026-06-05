# NeuroNex Vision & Roadmap (Lean MVP 2026)

## 🎯 Objetivo: Lean MVP
Transformar o NeuroNex em uma plataforma enxuta, focada na área autenticada, eliminando distrações institucionais e preparando o terreno para escalabilidade técnica e funcional.

---

## 🛠️ Fase 1: Estabilização e Core (Imediato)

### Consolidação de Ambiente
- [x] Unificação das pastas de documentação (`@docs` -> `docs`).
- [x] Remoção de páginas públicas e redirecionamento de `/` para `/auth`.
- [ ] Correção de erros de Build (Vite/Rollup).
- [ ] Resolução de erros de tipos TypeScript (tsc).

### Backend & Supabase
- [ ] Auditoria de Edge Functions (remover obsoletas, otimizar proxies).
- [ ] Revisão de RLS (Row Level Security) em todas as novas tabelas.
- [ ] Validação do fluxo de integração com Asaas (Webhooks e Proxy).

---

## 📂 Fase 2: Reorganização de Arquitetura (Próximas Semanas)

### Organização de Pastas
- [ ] **Frontend**: Mover componentes genéricos para `@/components/shared`.
- [ ] **Módulos**: Agrupar lógica por domínio (Agenda, Pacientes, Finanças).
- [ ] **Documentação**: Atualizar `ARCHITECTURE.md` para refletir o estado de Lean MVP.

### Limpeza de Dependências
- [ ] Identificar e remover pacotes não utilizados (ex: `react-hot-toast` se estiver sendo substituído por `sonner`).
- [ ] Padronizar estilos e componentes UI.

---

## 🚀 Fase 3: Roadmap de Funcionalidades (Pós-MVP)

### Automação de Prontuários
- [ ] Refinamento do NeuroScan (IA para extração de logs de sessão).
- [ ] Integração nativa com NeuroFlow Edit para edição dinâmica de notas.

### Expansão Neurobank/Asaas
- [ ] Sistema de Split de pagamentos para clínicas.
- [ ] Dashboards financeiros avançados (Fluxo de Caixa vs Realizado).

---

## 📌 Status Atual
- **Versão**: 2.1.0-lean-mvp
- **Estado**: Refatoração Ativa
- **Foco**: Build Success & Backend Stability
