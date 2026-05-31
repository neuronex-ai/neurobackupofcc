# Plano de Implementação: Refatoração da Agenda Mobile

## Objetivo
Refatorar a aba Agenda exclusivamente para a versão mobile, implementando um layout dividido:
1. **Calendário Mensal** na metade superior.
2. **Lista de Agendamentos (Diário)** na metade inferior.
3. Manter a versão Desktop inalterada.

## Arquitetura da Solução

### 1. Novo Componente: `MobileAgendaView`
Criar um componente dedicado para a visualização mobile para isolar a lógica e o estilo, evitando conflitos com a versão desktop.

*   **Localização**: `src/components/agenda/MobileAgendaView.tsx`
*   **Props**:
    *   `date`: Data selecionada atualmente.
    *   `onDateChange`: Função para atualizar a data.
    *   `appointments`: Lista de agendamentos filtrados.
*   ** Estrutura Visual**:
    *   **Header**: Título "Agenda" + Ícones de Busca e Novo Agendamento.
    *   **Navegação de Mês**: Título do Mês/Ano com setas de navegação.
    *   **Grid de Dias**: Visualização mensal customizada (7 colunas). Dias selecionados com destaque (círculo preto/branco). Indicadores de agendamento (bolinhas).
    *   **Lista Inferior**: Container com cantos arredondados (Bottom Sheet style) contendo a lista de agendamentos do dia selecionado.
*   **Interatividade**:
    *   Click no dia -> Atualiza `date` -> Atualiza lista inferior.
    *   Click no agendamento -> Abre `AppointmentDetailModal`.

### 2. Integração em `Agenda.tsx`
Modificar a página principal para renderizar condicionalmente os componentes baseados no breakpoint `md` (768px).

*   **Mobile (< md)**: Renderiza `MobileAgendaView`.
*   **Desktop (>= md)**: Renderiza o layout original (Sidebar + CalendarView), encapsulado em um container `hidden md:block`.

## Detalhes Técnicos
*   **Bibliotecas**: `date-fns` para manipulação de datas, `framer-motion` para animações suaves, `lucide-react` para ícones.
*   **Estilos**: Tailwind CSS para layout e responsividade. Ajustes de altura `100dvh` para mobile.
*   **Dark Mode**: Suporte completo ao modo escuro no novo componente.

## Passos Realizados
1.  Criação do arquivo `src/components/agenda/MobileAgendaView.tsx`.
2.  Implementação da lógica de calendário e lista.
3.  Atualização de `src/pages/Agenda.tsx` para importar e usar o novo componente.
