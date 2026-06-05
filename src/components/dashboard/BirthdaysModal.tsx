import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X, MessageCircle, Mail, Gift, Check, Edit2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PatientBirthday {
  id: string;
  name: string;
  birth_date: string;
  birth_day: number;
  birth_month: number;
  phone?: string;
  email?: string;
}

interface BirthdaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdays: PatientBirthday[];
}

export const BirthdaysModal = ({ isOpen, onClose, birthdays }: BirthdaysModalProps) => {
  const [filter, setFilter] = useState<'temporal' | 'alphabetical'>('temporal');
  const [selectedPatient, setSelectedPatient] = useState<PatientBirthday | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [messageMode, setMessageMode] = useState<'options' | 'edit' | 'custom' | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('Olá [NOME]! 🎂 Passando para te desejar um feliz aniversário! Que seu novo ciclo seja repleto de saúde, alegria e realizações. Um grande abraço!');

  const sortedBirthdays = [...birthdays].sort((a, b) => {
    if (filter === 'temporal') return a.birth_day - b.birth_day;
    return a.name.localeCompare(b.name);
  });

  const handleSendWhatsApp = (patient: PatientBirthday, message: string) => {
    if (!patient.phone) {
      toast.error("Paciente sem telefone cadastrado.");
      return;
    }
    const finalMessage = message.replace('[NOME]', patient.name.split(' ')[0]);
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(finalMessage)}`, '_blank');
    toast.success("WhatsApp aberto!");
    setMessageMode(null);
    setSelectedPatient(null);
  };

  const handleSendEmail = (patient: PatientBirthday, message: string) => {
    if (!patient.email) {
      toast.error("Paciente sem e-mail cadastrado.");
      return;
    }
    const finalMessage = message.replace('[NOME]', patient.name.split(' ')[0]);
    window.open(`mailto:${patient.email}?subject=Feliz Aniversário!&body=${encodeURIComponent(finalMessage)}`, '_blank');
    toast.success("E-mail aberto!");
    setMessageMode(null);
    setSelectedPatient(null);
  };

  const handleSendAction = (patient: PatientBirthday, message: string) => {
    if (selectedChannel === 'whatsapp') {
      handleSendWhatsApp(patient, message);
    } else {
      handleSendEmail(patient, message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-[95vw] max-h-[85vh] p-0 bg-[#F8F9FA] dark:bg-[#080809] border-none overflow-hidden flex flex-col rounded-[32px]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-pink-600">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Aniversariantes do Mês</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Total de {birthdays.length} pacientes</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilter('temporal')}
                className={cn("h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3", filter === 'temporal' ? "bg-white dark:bg-white/10 shadow-sm" : "text-zinc-400")}
              >
                Ordem Temporal
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilter('alphabetical')}
                className={cn("h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3", filter === 'alphabetical' ? "bg-white dark:bg-white/10 shadow-sm" : "text-zinc-400")}
              >
                Ordem Alfabética
              </Button>
            </div>

            <DialogClose className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
          {sortedBirthdays.map((patient) => (
            <motion.div 
              key={patient.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-white/5 p-4 flex items-center gap-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center justify-center min-w-[60px] h-16 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5">
                <span className="text-lg font-black text-zinc-900 dark:text-white tabular-nums leading-none">{patient.birth_day}</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  {format(new Date(2000, patient.birth_month, patient.birth_day), 'MMM', { locale: ptBR })}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white">{patient.name}</h3>
                <p className="text-xs text-zinc-400">Aniversário em breve</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                   variant="outline" 
                   size="icon" 
                   className="h-10 w-10 rounded-[14px] bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 group/wa"
                   onClick={() => {
                     setSelectedPatient(patient);
                     setSelectedChannel('whatsapp');
                     setMessageMode('options');
                   }}
                >
                  <MessageCircle className="w-5 h-5 transition-transform group-hover/wa:scale-110" />
                </Button>
                <Button 
                   variant="outline" 
                   size="icon" 
                   className="h-10 w-10 rounded-[14px] bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 group/mail"
                   onClick={() => {
                     setSelectedPatient(patient);
                     setSelectedChannel('email');
                     setMessageMode('options');
                   }}
                >
                  <Mail className="w-5 h-5 transition-transform group-hover/mail:scale-110" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Messaging Sub-Modal / Overlay */}
        <AnimatePresence>
          {messageMode && selectedPatient && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
            >
              <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl border border-zinc-100 dark:border-white/5 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Enviar via {selectedChannel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</h3>
                    <p className="text-xs text-zinc-400">Para: {selectedPatient.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMessageMode(null)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-8 space-y-6">
                  {messageMode === 'options' && (
                    <div className="grid grid-cols-1 gap-3">
                      <MessageOptionCard 
                        title="Mensagem Padrão" 
                        description={defaultTemplate.replace('[NOME]', selectedPatient.name.split(' ')[0])} 
                        icon={<Check className="w-4 h-4" />}
                        onClick={() => handleSendAction(selectedPatient, defaultTemplate)}
                      />
                      <MessageOptionCard 
                        title="Escrever Personalizada" 
                        description="Escreva uma mensagem única para este paciente." 
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => setMessageMode('custom')}
                      />
                      <MessageOptionCard 
                        title="Editar Template Padrão" 
                        description="Modifique a mensagem base para todos os aniversariantes." 
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => setMessageMode('edit')}
                      />
                    </div>
                  )}

                  {messageMode === 'custom' && (
                    <div className="space-y-4">
                      <textarea 
                        className="w-full h-32 bg-zinc-50 dark:bg-white/5 rounded-2xl p-4 text-sm border border-zinc-100 dark:border-white/10 focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white outline-none"
                        placeholder="Escreva sua mensagem personalizada..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                      />
                      <Button 
                        className="w-full h-14 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold gap-2"
                        onClick={() => handleSendAction(selectedPatient, customMessage || defaultTemplate)}
                      >
                        <Send className="w-4 h-4" />
                        Enviar Agora
                      </Button>
                    </div>
                  )}

                  {messageMode === 'edit' && (
                    <div className="space-y-4">
                      <textarea 
                        className="w-full h-32 bg-zinc-50 dark:bg-white/5 rounded-2xl p-4 text-sm border border-zinc-100 dark:border-white/10 focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white outline-none"
                        value={defaultTemplate}
                        onChange={(e) => setDefaultTemplate(e.target.value)}
                      />
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center">Use [NOME] onde deseja inserir o primeiro nome do paciente</p>
                      <Button 
                        className="w-full h-14 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold gap-2"
                        onClick={() => {
                          toast.success("Template atualizado!");
                          setMessageMode('options');
                        }}
                      >
                        Salvar Template
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

const MessageOptionCard = ({ title, description, icon, onClick }: { title: string, description: string, icon: React.ReactNode, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full text-left p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all group"
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-bold text-zinc-900 dark:text-white">{title}</h4>
      <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
        {icon}
      </div>
    </div>
    <p className="text-xs text-zinc-400 line-clamp-2">{description}</p>
  </button>
);
