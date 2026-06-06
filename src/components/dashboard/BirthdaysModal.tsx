import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Edit2, Gift, Mail, MessageCircle, Send, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const BIRTHDAY_TEMPLATE_KEY = 'neuronex:birthday-message-template';
const DEFAULT_BIRTHDAY_TEMPLATE =
  'Olá, {{nome_do_paciente}}! Passando para te desejar um feliz aniversário. Que seu novo ciclo seja leve, especial e cheio de boas experiências. Um abraço!';

interface PatientBirthday {
  id: string;
  name: string;
  birth_date: string;
  birth_day: number;
  birth_month: number;
  phone?: string | null;
  email?: string | null;
}

interface BirthdaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdays: PatientBirthday[];
}

export const BirthdaysModal = ({ isOpen, onClose, birthdays }: BirthdaysModalProps) => {
  const { user } = useAuth();
  const [sortMode, setSortMode] = useState<'temporal' | 'alphabetical'>('temporal');
  const [selectedPatient, setSelectedPatient] = useState<PatientBirthday | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [messageMode, setMessageMode] = useState<'options' | 'edit' | 'custom' | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState(DEFAULT_BIRTHDAY_TEMPLATE);

  const professionalName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'profissional';

  useEffect(() => {
    const saved = window.localStorage.getItem(BIRTHDAY_TEMPLATE_KEY);
    if (saved) setDefaultTemplate(saved);
  }, []);

  const sortedBirthdays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();

    return [...birthdays].sort((a, b) => {
      if (sortMode === 'alphabetical') return a.name.localeCompare(b.name);

      const aDistance = a.birth_day >= currentDay ? a.birth_day - currentDay : a.birth_day + 40;
      const bDistance = b.birth_day >= currentDay ? b.birth_day - currentDay : b.birth_day + 40;
      return aDistance - bDistance || a.name.localeCompare(b.name);
    });
  }, [birthdays, sortMode]);

  const getBirthdayLabel = (patient: PatientBirthday) =>
    format(new Date(2000, patient.birth_month, patient.birth_day), "dd 'de' MMMM", { locale: ptBR });

  const fillTemplate = (patient: PatientBirthday, template: string) => {
    const firstName = patient.name.split(' ')[0] || patient.name;
    return template
      .replaceAll('{{nome_do_paciente}}', firstName)
      .replaceAll('{{nome_completo_do_paciente}}', patient.name)
      .replaceAll('{{nome_do_profissional}}', professionalName)
      .replaceAll('{{data_aniversario}}', getBirthdayLabel(patient));
  };

  const finishSend = () => {
    setMessageMode(null);
    setSelectedPatient(null);
    setCustomMessage('');
  };

  const handleSendWhatsApp = (patient: PatientBirthday, message: string) => {
    if (!patient.phone) {
      toast.error('Telefone indisponível para este paciente.');
      return;
    }

    const finalMessage = fillTemplate(patient, message);
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(finalMessage)}`, '_blank');
    toast.success('WhatsApp aberto com a mensagem preparada.');
    finishSend();
  };

  const handleSendEmail = (patient: PatientBirthday, message: string) => {
    if (!patient.email) {
      toast.error('E-mail indisponível para este paciente.');
      return;
    }

    const finalMessage = fillTemplate(patient, message);
    window.open(`mailto:${patient.email}?subject=Feliz aniversário&body=${encodeURIComponent(finalMessage)}`, '_blank');
    toast.success('E-mail aberto com a mensagem preparada.');
    finishSend();
  };

  const handleSendAction = (patient: PatientBirthday, message: string) => {
    if (selectedChannel === 'whatsapp') {
      handleSendWhatsApp(patient, message);
      return;
    }

    handleSendEmail(patient, message);
  };

  const openMessageOptions = (patient: PatientBirthday, channel: 'whatsapp' | 'email') => {
    const hasContact = channel === 'whatsapp' ? !!patient.phone : !!patient.email;
    if (!hasContact) {
      toast.info(channel === 'whatsapp' ? 'Paciente sem telefone cadastrado.' : 'Paciente sem e-mail cadastrado.');
      return;
    }

    setSelectedPatient(patient);
    setSelectedChannel(channel);
    setMessageMode('options');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[860px] w-[95vw] max-h-[86vh] p-0 bg-white dark:bg-[#080809] text-zinc-950 dark:text-white border border-zinc-200/80 dark:border-white/10 overflow-hidden flex flex-col rounded-[34px] shadow-[0_42px_120px_-42px_rgba(24,24,27,0.38)]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.85),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(161,161,170,0.18),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(161,161,170,0.10),transparent_28%)]" />

        <div className="relative flex items-center justify-between gap-4 px-8 py-6 bg-white/70 dark:bg-zinc-950/[0.72] border-b border-zinc-200/70 dark:border-white/10 shrink-0 backdrop-blur-2xl">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">Aniversariantes do mês</h2>
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-zinc-400">
                {birthdays.length} pacientes encontrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100/90 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200/60 dark:border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortMode('temporal')}
                className={cn('h-9 rounded-xl text-[10px] font-black uppercase tracking-wider px-4', sortMode === 'temporal' ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-950 dark:text-white' : 'text-zinc-400')}
              >
                Próximos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortMode('alphabetical')}
                className={cn('h-9 rounded-xl text-[10px] font-black uppercase tracking-wider px-4', sortMode === 'alphabetical' ? 'bg-white dark:bg-white/10 shadow-sm text-zinc-950 dark:text-white' : 'text-zinc-400')}
              >
                A-Z
              </Button>
            </div>
            <DialogClose className="h-11 w-11 rounded-2xl bg-zinc-100/90 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto p-8 custom-scrollbar space-y-3">
          {sortedBirthdays.length === 0 ? (
            <div className="min-h-[280px] flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-700 dark:text-zinc-200">Nenhum paciente aniversaria neste mês.</p>
                <p className="text-xs font-semibold text-zinc-400 mt-1">Quando houver pacientes com data de nascimento no mês vigente, eles aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            sortedBirthdays.map((patient, index) => {
              const hasPhone = !!patient.phone;
              const hasEmail = !!patient.email;

              return (
                <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                  className="group bg-white dark:bg-white/[0.035] rounded-[24px] border border-zinc-200/80 dark:border-white/10 p-4 flex items-center gap-5 hover:border-zinc-300 dark:hover:bg-white/[0.06] hover:shadow-[0_18px_48px_-30px_rgba(0,0,0,0.35)] transition-all"
                >
                  <div className="flex flex-col items-center justify-center min-w-[64px] h-16 bg-zinc-50 dark:bg-white/[0.04] rounded-2xl border border-zinc-200/70 dark:border-white/10">
                    <span className="text-xl font-black text-zinc-950 dark:text-white tabular-nums leading-none">{patient.birth_day}</span>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                      {format(new Date(2000, patient.birth_month, patient.birth_day), 'MMM', { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-zinc-950 dark:text-white truncate tracking-tight">{patient.name}</h3>
                    <p className="text-xs font-semibold text-zinc-400">{getBirthdayLabel(patient)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <ContactActionButton
                      icon={<MessageCircle className="w-4 h-4" />}
                      label="WhatsApp"
                      disabled={!hasPhone}
                      onClick={() => openMessageOptions(patient, 'whatsapp')}
                    />
                    <ContactActionButton
                      icon={<Mail className="w-4 h-4" />}
                      label="E-mail"
                      disabled={!hasEmail}
                      onClick={() => openMessageOptions(patient, 'email')}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {messageMode && selectedPatient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/[0.92] dark:bg-black/[0.82] backdrop-blur-xl flex items-center justify-center p-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="w-full max-w-lg bg-white/95 dark:bg-zinc-950/95 rounded-[34px] shadow-2xl border border-zinc-200/70 dark:border-white/10 overflow-hidden flex flex-col"
              >
                <div className="p-7 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">Enviar via {selectedChannel === 'whatsapp' ? 'WhatsApp' : 'e-mail'}</h3>
                    <p className="text-xs font-semibold text-zinc-400 mt-1">Para {selectedPatient.name} • {getBirthdayLabel(selectedPatient)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMessageMode(null)} className="rounded-2xl h-10 w-10">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-7 space-y-4">
                  {messageMode === 'options' && (
                    <div className="grid grid-cols-1 gap-3">
                      <MessageOptionCard
                        title="Usar mensagem padrão"
                        description={fillTemplate(selectedPatient, defaultTemplate)}
                        icon={<Check className="w-4 h-4" />}
                        onClick={() => handleSendAction(selectedPatient, defaultTemplate)}
                      />
                      <MessageOptionCard
                        title="Escrever mensagem personalizada"
                        description="Escreva uma mensagem livre antes do envio."
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => setMessageMode('custom')}
                      />
                      <MessageOptionCard
                        title="Editar template padrão"
                        description="Personalize o texto usado nos próximos aniversários."
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => setMessageMode('edit')}
                      />
                    </div>
                  )}

                  {messageMode === 'custom' && (
                    <BirthdayTextarea
                      value={customMessage}
                      onChange={setCustomMessage}
                      placeholder={fillTemplate(selectedPatient, defaultTemplate)}
                      actionLabel="Enviar agora"
                      onAction={() => handleSendAction(selectedPatient, customMessage || defaultTemplate)}
                    />
                  )}

                  {messageMode === 'edit' && (
                    <BirthdayTextarea
                      value={defaultTemplate}
                      onChange={setDefaultTemplate}
                      actionLabel="Salvar template"
                      helper="Variáveis: {{nome_do_paciente}}, {{nome_completo_do_paciente}}, {{nome_do_profissional}}, {{data_aniversario}}."
                      onAction={() => {
                        window.localStorage.setItem(BIRTHDAY_TEMPLATE_KEY, defaultTemplate);
                        toast.success('Template de aniversário atualizado.');
                        setMessageMode('options');
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

const ContactActionButton = ({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    size="sm"
    disabled={disabled}
    title={disabled ? `${label} não cadastrado` : `Enviar por ${label}`}
    onClick={onClick}
    className={cn(
      'h-11 w-11 rounded-2xl p-0 bg-zinc-50/80 dark:bg-white/[0.04] border-zinc-200/80 dark:border-white/10 text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-all',
      disabled && 'opacity-[0.35] cursor-not-allowed hover:text-zinc-500 hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]'
    )}
  >
    {icon}
    <span className="sr-only">{label}</span>
  </Button>
);

const BirthdayTextarea = ({
  value,
  onChange,
  onAction,
  actionLabel,
  helper,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onAction: () => void;
  actionLabel: string;
  helper?: string;
  placeholder?: string;
}) => (
  <div className="space-y-4">
    <textarea
      className="w-full h-36 bg-zinc-50 dark:bg-white/[0.04] rounded-2xl p-4 text-sm font-medium text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/20 outline-none resize-none placeholder:text-zinc-400"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
    {helper && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">{helper}</p>}
    <Button className="w-full h-14 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black gap-2" onClick={onAction}>
      <Send className="w-4 h-4" />
      {actionLabel}
    </Button>
  </div>
);

const MessageOptionCard = ({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-5 rounded-3xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.07] transition-all group"
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-black text-zinc-950 dark:text-white tracking-tight">{title}</h4>
      <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
        {icon}
      </div>
    </div>
    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">{description}</p>
  </button>
);
