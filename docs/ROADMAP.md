# Roadmap de Desenvolvimento & Status

Este documento rastreia o progresso da substituição de dados simulados (mock) por dados reais integrada ao Supabase, bem como melhorias técnicas e limpezas de código realizadas.

## ✅ Concluído (High Priority)

### Substituição de Dados Mock
- **Relatórios de Desempenho (`PerformanceReports.tsx`)**:
  - Implementada busca real de dados via `usePerformanceData` e `usePatientBreakdown`.
  - Métricas reais de Agendamentos, Faturamento (Receita), Novos Pacientes e Taxa de Ocupação.
  - Filtros de período (Mês Atual, Mês Anterior, Trimestre, Ano) funcionais.
  
- **Visão Geral da Equipe (`TeamOverviewWidget.tsx`)**:
  - Substituídos dados aleatórios (`Math.random()`) por consultas reais no banco.
  - Exibição de contagens reais de atendimentos (hoje e mês atual) por profissional.
  - Integração correta com os dados de `organization_members` e `profiles`.

- **Formulário de Transação (`EditTransactionForm.tsx`)**:
  - Removida a exibição "fake" de detalhamento de taxas (`fee_amount`, `net_amount`) que referenciava colunas inexistentes no banco.
  - Código limpo e simplificado para refletir a estrutura real do banco de dados.

- **Sincronização com Planilhas (`use-sheets-sync.tsx`)**:
  - Corrigida documentação enganosa sobre URLs "mock"; a construção da URL do Google Sheets agora é tratada como implementação oficial.

- **Disponibilidade Inteligente (`use-smart-availability.ts`)**:
  - Removida a lógica hardcoded de "pular finais de semana".
  - Implementado suporte parametrizado para dias e horários de trabalho (`workDays`, `workHours`), permitindo configuração futura via interface sem alterações de código.
  - Padrão mantido como Seg-Sex, 08:00-19:00 até que tabela de configurações de usuário seja criada.

### Melhorias Técnicas & Limpeza
- **Estabilidade Visual**: Corrigido problema de waveform de áudio "piscando" em mensagens de mídia (`MediaMessage.tsx`) usando memoização.
- **Limpeza de Código**: Removidas importações não utilizadas e variáveis mortas em múltiplos arquivos para melhorar a manutenibilidade e reduzir warnings:
  - `MassRescheduleModal.tsx`
  - `MobileAgendaView.tsx`
  - `NewAppointmentTransactionModal.tsx`
  - `NewRecurringAppointmentForm.tsx`
  - `EditTransactionForm.tsx`
  - `use-sheets-sync.tsx`

---

## 🚧 Em Aberto / Próximos Passos (Medium Priority)

Funcionalidades que requerem implementação de backend ou novas tabelas antes de serem finalizadas no frontend.

### Funcionalidades Pendentes
1.  **Compartilhamento de Notas (`NoteEditor.tsx`)**:
    -   Atualmente exibe "Em breve".
    -   *Necessário*: Tabela de compartilhamento/permissões no banco de dados.

2.  **Gráficos de Tendência (`PerformanceReports.tsx`)**:
    -   Aba "Tendências" e "Consolidado" são placeholders.
    -   *Necessário*: Endpoints ou views agregadas no Supabase para dados históricos eficientes.

3.  **Exportação PDF**:
    -   *Necessário*: Integração com biblioteca de geração de PDF (ex: `react-pdf` ou `jspdf`) com dados reais.

4.  **Configuração de Horário de Trabalho**:
    -   O hook `useSmartAvailability` já suporta parâmetros, mas a UI para o usuário definir seus horários (ex: no Perfil) ainda não existe.
    -   *Necessário*: Adicionar colunas `work_schedule` na tabela `profiles` ou criar tabela `user_settings`.

---

## 📋 Baixa Prioridade / Wishlist

- **Waveforms Reais**: Implementar análise real de arquivos de áudio para gerar visualização precisa (atualmente usa padrão visual estável).
- **Notificações Push**: Integração com service workers para lembretes reais.
