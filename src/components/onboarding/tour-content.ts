export const TOUR_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao NeuroNex',
        description: 'Seu ecossistema clínico completo. Vamos te guiar pelas principais funcionalidades.',
        layout: 'modal'
    },
    {
        id: 'dashboard',
        title: 'Painel de Controle',
        description: 'Comece o dia aqui. Resumo dos atendimentos, alertas inteligentes e métricas de desempenho da sua clínica.',
        targetId: 'nav-dashboard',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'agenda',
        title: 'Agenda Inteligente',
        description: 'Gerencie seus horários com sincronização automática do Google Calendar, lembretes via WhatsApp e confirmação por link.',
        targetId: 'nav-agenda',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'teleconsulta',
        title: 'Teleconsulta',
        description: 'Sala virtual segura e criptografada para seus atendimentos online com qualidade HD e recap de sessão por IA.',
        targetId: 'nav-teleconsulta',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'patients',
        title: 'Pacientes',
        description: 'Acesse prontuários completos, histórico de sessões, evolução clínica e gestão de documentos num só lugar.',
        targetId: 'nav-pacientes',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'notes',
        title: 'Notas & NeuroView',
        description: 'Documente sessões com auxílio da IA. O NeuroView oferece análise sistêmica de casos para insights clínicos profundos.',
        targetId: 'nav-notas',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'finance',
        title: 'NeuroFinance',
        description: 'Gestão financeira completa. Controle de pagamentos, cobranças automáticas e relatórios inteligentes.',
        targetId: 'nav-financeiro',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'search',
        title: 'Busca Global',
        description: 'Encontre pacientes, sessões e notas rapidamente. Use o atalho Ctrl+K para buscar de qualquer tela.',
        targetId: 'global-search',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'notifications',
        title: 'Notificações',
        description: 'Acompanhe alertas em tempo real: novos agendamentos, pagamentos recebidos e lembretes importantes.',
        targetId: 'notifications-trigger',
        position: 'bottom',
        expectedRoute: '/dashboard'
    },
    {
        id: 'conclusion',
        title: 'Tudo Pronto!',
        description: 'Sua clínica inteligente está configurada. Explore cada módulo e conte com nosso suporte sempre que precisar. 🚀',
        layout: 'modal'
    }
];