import { useNavigate } from 'react-router-dom';
import {
    User,
    Calendar,
    ChevronRight,
    Stethoscope,
    AlertTriangle,
    DollarSign,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Activity,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SynapseWidgetProps {
    widgetData: {
        __actionType: string;
        data: any;
        title?: string;
    };
}

// ─── Helper: formatação de horário ───────
const toBrazilTime = (iso: string) => {
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return iso;
    }
};

const toBrazilDate = (iso: string) => {
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: 'short',
        }).format(d);
    } catch {
        return iso;
    }
};

// ─── Status badge ──────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
        confirmed: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Confirmada', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
        cancelled: { icon: <XCircle className="w-3 h-3" />, label: 'Cancelada', color: 'text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' },
        pending: { icon: <Clock className="w-3 h-3" />, label: 'Pendente', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
    };
    const c = config[status] || config.pending;
    return (
        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border', c.color)}>
            {c.icon}
            {c.label}
        </div>
    );
};

// ─── Main Widget Component ─────────────────────────────────────────
export const SynapseWidgetRenderer = ({ widgetData }: SynapseWidgetProps) => {
    const navigate = useNavigate();
    const { __actionType, data: rawData, title } = widgetData;

    // Normaliza dados vindos da IA
    let dataArray: any[] | null = null;
    if (Array.isArray(rawData)) {
        dataArray = rawData;
    } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.items)) dataArray = rawData.items;
        else if (Array.isArray(rawData.results)) dataArray = rawData.results;
        else if (Array.isArray(rawData.data)) dataArray = rawData.data;
        else if (Array.isArray(rawData.patients)) dataArray = rawData.patients;
        else if (Array.isArray(rawData.appointments)) dataArray = rawData.appointments;
        else dataArray = [rawData];
    }

    const normalizedType = __actionType.toLowerCase().replace('_widget', '');

    // ─── Componente: Lista de Pacientes ────────────────────────────────
    const renderPatientList = () => (
        <div className="space-y-2">
            {(dataArray || []).map((patient: any) => (
                <button
                    key={patient.id}
                    onClick={() => {
                        toast.success('Abrindo prontuário...', {
                            description: `Acessando os dados de ${patient.name || 'Paciente'}`,
                        });
                        navigate('/pacientes', { state: { openPatientId: patient.id } });
                    }}
                    className={cn(
                        'w-full flex items-center justify-between p-4 rounded-2xl',
                        'bg-zinc-50 dark:bg-white/[0.03]',
                        'border border-zinc-200/50 dark:border-white/[0.06]',
                        'hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
                        'transition-all duration-300 group/item text-left cursor-pointer',
                        'active:scale-[0.98]'
                    )}
                >
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/[0.06] flex items-center justify-center group-hover/item:bg-zinc-300 dark:group-hover/item:bg-white/[0.1] transition-colors">
                                <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
                            </div>
                            <div className={cn(
                                'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-50 dark:border-[#0a0a0c]',
                                patient.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                            )} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[13px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                                {patient.name || 'Paciente sem nome'}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                                {patient.diagnosis || patient.email || 'Clique para visualizar detalhes'}
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-600 dark:group-hover/item:text-zinc-300 group-hover/item:translate-x-0.5 transition-all shrink-0" />
                </button>
            ))}
        </div>
    );

    // ─── Componente: Lista de Agendamentos / Calendário ────────────────
    const renderAppointmentList = () => (
        <div className="space-y-2">
            {(dataArray || []).map((apt: any, i: number) => {
                const time = apt.horario || (apt.start_time
                    ? `${toBrazilTime(apt.start_time)} às ${toBrazilTime(apt.end_time)}`
                    : apt.time || '');
                const patientName = apt.patient_name || apt.patient?.name || 'Horário Bloqueado';
                const status = apt.status || 'confirmed';
                const appointmentType = apt.type || 'presencial';

                return (
                    <button
                        key={apt.id || i}
                        onClick={() => {
                            toast.success('Redirecionando para a agenda...', {
                                description: `Exibindo o evento de ${patientName}`,
                            });
                            navigate('/agenda');
                        }}
                        className={cn(
                            'w-full flex items-center justify-between p-4 rounded-2xl cursor-pointer',
                            'bg-zinc-50 dark:bg-white/[0.03]',
                            'border border-zinc-200/50 dark:border-white/[0.06]',
                            'hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
                            'transition-all duration-300 group/item text-left',
                            'active:scale-[0.98]',
                            status === 'cancelled' && 'opacity-60'
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover/item:bg-indigo-100 dark:group-hover/item:bg-indigo-500/20 transition-colors">
                                {appointmentType === 'online'
                                    ? <Stethoscope className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                                    : <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                                }
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[13px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                                    {patientName}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        {time}
                                    </span>
                                    <StatusBadge status={status} />
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-600 dark:group-hover/item:text-zinc-300 group-hover/item:translate-x-0.5 transition-all shrink-0" />
                    </button>
                );
            })}
        </div>
    );

    // ─── Componente: Alerta de Risco Clínico ───────────────────────────
    const renderRiskAlert = () => (
        <div className="space-y-2">
            {(dataArray || []).map((patient: any, i: number) => (
                <button
                    key={patient.id || i}
                    onClick={() => {
                        toast.error('Analisando fatores de risco...', {
                            description: `Abrindo o perfil de ${patient.name || 'Paciente'}`,
                        });
                        navigate('/pacientes', { state: { openPatientId: patient.id } });
                    }}
                    className={cn(
                        'w-full flex items-center gap-3.5 p-4 rounded-2xl text-left cursor-pointer',
                        'bg-amber-50 dark:bg-amber-500/[0.06]',
                        'border border-amber-200/50 dark:border-amber-500/10',
                        'hover:bg-amber-100 dark:hover:bg-amber-500/10',
                        'transition-all duration-300 active:scale-[0.98]'
                    )}
                >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {patient.name || 'Paciente sem nome'}
                        </span>
                        {patient.risks && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
                                {Array.isArray(patient.risks) ? patient.risks.join(' • ') : patient.risks}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );

    // ─── Componente: Resumo Financeiro ─────────────────────────────────
    const renderFinancialSummary = () => {
        const d = dataArray?.[0] || rawData;
        return (
            <button
                onClick={() => {
                    toast.success('Abrindo módulo financeiro...');
                    navigate('/financeiro');
                }}
                className={cn(
                    'w-full grid grid-cols-2 gap-3 text-left cursor-pointer',
                    'active:scale-[0.98] transition-transform'
                )}
            >
                {[
                    { label: 'Receita Total', value: d?.projectedRevenue || d?.revenue || 0, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Valores Pendentes', value: d?.pendingInvoices || d?.pending || 0, color: 'text-amber-600 dark:text-amber-400' },
                ].map((metric) => (
                    <div key={metric.label} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 mb-1">
                            {metric.label}
                        </p>
                        <p className={cn('text-lg font-black tracking-tight', metric.color)}>
                            R$ {typeof metric.value === 'number' ? metric.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : metric.value}
                        </p>
                    </div>
                ))}
            </button>
        );
    };

    // ─── Componente: Ação Genérica / Sucesso ───────────────────────────
    const getGenericRoute = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('patient') || t.includes('paciente')) return '/pacientes';
        if (t.includes('invoice') || t.includes('payment') || t.includes('finance') || t.includes('financeiro') || t.includes('fatura')) return '/financeiro';
        if (t.includes('appointment') || t.includes('calendar') || t.includes('agenda')) return '/agenda';
        if (t.includes('document') || t.includes('history') || t.includes('prontuario')) return '/prontuario';
        return '/dashboard';
    };

    const renderGenericAction = () => {
        const labelMap: Record<string, string> = {
            create_appointment: 'Novo Agendamento Confirmado',
            send_email: 'Mensagem Enviada',
            create_invoice: 'Fatura e Cobrança Emitida',
            update_patient: 'Dados do Paciente Atualizados',
            create_patient: 'Novo Paciente Cadastrado',
            generate_document: 'Documento Clínico Salvo',
            clinical_history: 'Histórico Adicionado ao Prontuário',
            navigate_system: 'Sistema Redirecionado',
            interactive_table: 'Informações Processadas e Estruturadas',
            table: 'Dados Analisados com Sucesso',
        };
        const label = labelMap[normalizedType] || 'Ação Concluída com Sucesso';

        return (
            <button 
                onClick={() => {
                    toast.success(`Visualizando resultado...`);
                    navigate(getGenericRoute(normalizedType));
                }}
                className={cn(
                    'w-full flex items-center justify-between p-4 rounded-2xl text-left cursor-pointer',
                    'bg-zinc-50 dark:bg-white/[0.03]',
                    'border border-zinc-200/50 dark:border-white/[0.06]',
                    'hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
                    'transition-all duration-300 group/item active:scale-[0.98]'
                )}
            >
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/[0.06] flex items-center justify-center shrink-0 group-hover/item:bg-zinc-300 dark:group-hover/item:bg-white/[0.1] transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                            Executado
                        </span>
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {label}
                        </span>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-600 dark:group-hover/item:text-zinc-300 group-hover/item:translate-x-0.5 transition-all shrink-0" />
            </button>
        );
    };

    // ─── Renderizador Central ──────────────────────────────────────────
    const renderContent = () => {
        if (normalizedType.includes('patient')) return renderPatientList();
        if (normalizedType.includes('appointment') || normalizedType.includes('calendar')) return renderAppointmentList();
        if (normalizedType.includes('risk')) return renderRiskAlert();
        if (normalizedType.includes('finance') || normalizedType.includes('summary')) return renderFinancialSummary();
        return renderGenericAction();
    };

    // Configuração do Cabeçalho com base no tipo
    let headerIcon = <Sparkles className="h-3.5 w-3.5" />;
    let headerLabel = 'Resultado do Processamento';

    if (normalizedType.includes('patient')) { headerIcon = <User className="h-3.5 w-3.5" />; headerLabel = 'Informações de Pacientes'; }
    if (normalizedType.includes('appointment') || normalizedType.includes('calendar')) { headerIcon = <Calendar className="h-3.5 w-3.5" />; headerLabel = 'Gestão de Agenda'; }
    if (normalizedType.includes('risk')) { headerIcon = <AlertTriangle className="h-3.5 w-3.5" />; headerLabel = 'Alerta Clínico Detectado'; }
    if (normalizedType.includes('finance')) { headerIcon = <DollarSign className="h-3.5 w-3.5" />; headerLabel = 'Métricas Financeiras'; }

    return (
        <div className={cn(
            'my-4 rounded-2xl overflow-hidden',
            'bg-white dark:bg-[#0a0a0c]',
            'border border-zinc-200/60 dark:border-white/[0.06]',
            'shadow-sm',
        )}>
            {/* Cabeçalho do Widget */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 dark:border-white/[0.04]">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                    {headerIcon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    {headerLabel}
                </span>
                {dataArray && dataArray.length > 1 && (
                    <span className="ml-auto text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                        {dataArray.length} Registros
                    </span>
                )}
            </div>
            {/* Corpo do Widget */}
            <div className="p-3">
                {renderContent()}
            </div>
        </div>
    );
};