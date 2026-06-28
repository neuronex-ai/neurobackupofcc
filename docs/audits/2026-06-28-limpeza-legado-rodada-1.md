# Limpeza de legado - rodada 1

Data: 2026-06-28

## Escopo

Primeira limpeza conservadora de arquivos frontend que estavam fora do grafo de imports iniciado em `src/main.tsx` e sem uso real na interface atual.

Nao foram alterados Supabase, R2, migrations, Edge Functions, tabelas ou regras de seguranca nesta rodada.

## Resultado

- Antes desta rodada, a analise atual apontava cerca de 185 candidatos orfaos.
- Depois das remocoes, restaram 98 candidatos orfaos.
- Foram removidos 87 arquivos de paginas/componentes/hooks nao usados.

## Grupos removidos

- Paginas publicas antigas sem rota: `Blog`, `Newsletter`.
- Agenda antiga em grade: `AgendaView`, `DayColumn`, `DraggableAppointmentItem`, forms/modais antigos de recorrencia e reagendamento.
- Widgets antigos de dashboard substituidos pelo dashboard atual.
- Componentes decorativos/UI nao usados: backgrounds, cards visuais e componentes shadcn/genericos que nao tinham imports.
- Blocos antigos de landing: manifesto, video hero, globe/ecosystem antigo e modal de assinatura antigo.
- Componentes antigos isolados de AI chat, Synapse, onboarding, clinica, pacientes, notas e settings.

## Verificacao

`npx.cmd tsc -p tsconfig.app.json --noEmit` foi executado.

Nao apareceram erros de import por arquivos removidos.

Erros ainda existentes em codigo vivo:

- `src/components/agenda/CalendarView.tsx`: tipo `UniqueIdentifier` do dnd-kit pode ser `number`, mas o estado espera `string`.
- `src/components/dashboard/desktop/dashboard-command-center-model.test.ts`: teste usa status `"scheduled"` que nao esta aceito pelo tipo atual.
- `src/components/dashboard/desktop/DesktopDashboardCommandCenter.tsx`: `transition.ease` esta como `string`, mas o tipo do Framer Motion espera `Easing`.

## Pendencias para decisao

Estes grupos ainda estao fora da interface atual, mas podem representar funcionalidades que o produto talvez queira reativar:

- Financeiro legado: modais de cobranca, recibo, NFS-e, recorrencia, extrato impresso, pix/pagamentos antigos e widgets de vazamento de receita.
- Portal do paciente legado: paineis antigos de documentos, financeiro, metas, progresso, agenda, humor e agendamento.
- WhatsApp/NeuroZap: pagina desktop `NeuroZap`, helper de conexao e renderizador de midia.
- Teleconsulta antiga: paineis de anexos, resumo, notas e abas antigas do workspace.
- Mobile antigo: telas antigas mobile de financeiro, paciente, notas e NeuroFinance.
- Hooks e libs soltos: hooks de metricas, churn, recorrencia, Microsoft/Todoist/Twilio/WhatsApp e servicos de transcript/anonymization.

