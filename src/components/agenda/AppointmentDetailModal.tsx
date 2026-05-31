"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Textarea } from "@/components/ui/textarea";
import { useSendEmail } from "@/hooks/use-send-email";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  User,
  MapPin,
  Video,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  AlertCircle,
  Clock,
  Briefcase,
  ChevronRight,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatTimeBrazil } from "@/lib/timezone";

export const AppointmentDetailModal = ({ children, appointment }: { children: React.ReactNode, appointment: Appointment }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [patientData, setPatientData] = useState<any>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);

  const [editSection, setEditSection] = useState<'time' | 'status' | 'financial' | 'notes' | null>(null);
  const [editedTime, setEditedTime] = useState("");
  const [editedAmount, setEditedAmount] = useState<string>("");

  const [confirmationAction, setConfirmationAction] = useState<'reschedule' | 'cancel' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sendEmail = useSendEmail();

  const isExpired = new Date(appointment.end_time) < new Date() && appointment.status !== 'cancelled';

  const getStatusInfo = () => {
    if (appointment.status === 'cancelled') return { label: 'Cancelado', color: 'bg-rose-500', textColor: 'text-rose-500', bgColor: 'bg-rose-500/10' };
    if (isExpired) return { label: 'Finalizado', color: 'bg-zinc-500', textColor: 'text-zinc-500', bgColor: 'bg-zinc-500/10' };
    if (appointment.status === 'confirmed') return { label: 'Confirmado', color: 'bg-emerald-500', textColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
    return { label: 'Pendente', color: 'bg-amber-500', textColor: 'text-amber-500', bgColor: 'bg-amber-500/10' };
  };
  const statusInfo = getStatusInfo();

  useEffect(() => {
    if (open) loadData();
  }, [open, appointment]); // added appointment to deps if it changes

  const loadData = async () => {
    setStep(1);
    setEditSection(null);
    setConfirmationAction(null);
    setNotes(appointment.notes || "");
    setEditedTime(format(new Date(appointment.start_time), "HH:mm"));

    // Carregar dados do paciente
    if (appointment.patient_id) {
      const { data: patient } = await supabase.from('patients').select('email, phone, name').eq('id', appointment.patient_id).single();
      setPatientData(patient);
    }

    // Carregar transação vinculada
    const { data: transaction } = await supabase.from('transactions').select('*').eq('appointment_id', appointment.id).maybeSingle();
    setTransactionData(transaction);
    if (transaction) {
      setEditedAmount(transaction.amount?.toString() || "");

      // Se houver pacote vinculado na transação ou agendamento
      const packageId = transaction.package_id || (appointment as any).package_id;
      if (packageId) {
        const { data: pkg } = await supabase.from('patient_packages').select('*').eq('id', packageId).maybeSingle();
        setPackageData(pkg);
      }
    }
  };

  const handleSaveNotes = async () => {
    try {
      await supabase.from('appointments').update({ notes }).eq('id', appointment.id);
      toast.success("Notas salvas com sucesso");
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch {
      toast.error("Erro ao salvar notas");
    }
  };

  const handleWhatsApp = () => {
    if (!patientData?.phone) {
      toast.error("Paciente sem telefone cadastrado");
      return;
    }
    const phone = patientData.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${patientData.name}! Gostaria de lembrá-lo(a) da sua consulta agendada para ${format(new Date(appointment.start_time), "dd/MM")} às ${formatTimeBrazil(appointment.start_time)}.`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleSendEmail = () => {
    if (!patientData?.email) {
      toast.error("Paciente sem e-mail cadastrado");
      return;
    }
    sendEmail.mutate({
      type: 'reminder',
      params: {
        patientEmail: patientData.email,
        patientName: patientData.name,
        startTime: new Date(appointment.start_time).toISOString(),
        appointmentId: appointment.id,
        action: 'reminder',
      }
    });
  };

  const handleActionClick = (action: 'reschedule' | 'cancel') => {
    setConfirmationAction(action);
    setStep(2);
  };

  const executeAction = async () => {
    setIsLoading(true);
    try {
      if (confirmationAction === 'cancel') {
        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointment.id);
      } else {
        const datePart = format(new Date(appointment.start_time), "yyyy-MM-dd");
        const newStart = new Date(`${datePart}T${editedTime}:00-03:00`); // Emulating Brazil TZ
        const duration = new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime();
        await supabase.from('appointments').update({
          start_time: newStart.toISOString(),
          end_time: new Date(newStart.getTime() + duration).toISOString(),
          status: 'pending'
        }).eq('id', appointment.id);
      }
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setStep(3);
    } catch (e) {
      toast.error("Falha na operação");
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatus = () => {
    if (!transactionData) return null;
    if (transactionData.status === 'paid') return { label: 'Pago', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };

    const dueDate = new Date(transactionData.date);
    const today = startOfDay(new Date());
    if (isBefore(dueDate, today)) return { label: 'Atrasado', color: 'text-rose-500', bgColor: 'bg-rose-500/10' };

    return { label: 'Pendente', color: 'text-amber-500', bgColor: 'bg-amber-500/10' };
  };

  const paymentStatus = getPaymentStatus();

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'pix': return <QrCode className="h-4 w-4" />;
      case 'credit_card':
      case 'debit_card':
      case 'cartão': return <CreditCard className="h-4 w-4" />;
      case 'money':
      case 'dinheiro': return <Banknote className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      className="bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-[40px] border border-zinc-200 dark:border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] rounded-[28px] p-0 overflow-hidden sm:max-w-[600px] max-h-[90vh] flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-zinc-50/50 dark:from-card/50 to-transparent">

        {/* Header Consistente */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Ficha da Sessão</h2>
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-current/10", statusInfo.bgColor)}>
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusInfo.color)} />
                <span className={cn("text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap", statusInfo.textColor)}>{statusInfo.label}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{format(new Date(appointment.start_time), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full w-10 h-10 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-90 shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="px-8 py-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* Ações Rápidas & Paciente Header */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 p-5 rounded-[24px] bg-zinc-100/60 dark:bg-secondary/20 border border-zinc-200 dark:border-border/10 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-0.5">Paciente</p>
                        <h4 className="text-base font-bold text-foreground tracking-tight line-clamp-1">{patientData?.name || appointment.patient_name || "..."}</h4>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 backdrop-blur-md" onClick={() => navigate(`/pacientes/${appointment.patient_id}`)}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button variant="outline" onClick={handleWhatsApp} className="flex-1 sm:flex-none h-auto py-3 rounded-[20px] bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 text-muted-foreground transition-all flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">WhatsApp</span>
                    </Button>
                    <Button variant="outline" onClick={handleSendEmail} disabled={sendEmail.isPending} className="flex-1 sm:flex-none h-auto py-3 rounded-[20px] bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 text-muted-foreground transition-all flex items-center gap-2">
                      {sendEmail.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">E-mail</span>
                    </Button>
                  </div>
                </div>

                {/* Bloco de Detalhes Principais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Cronograma Box */}
                  <div className="p-5 rounded-[24px] bg-zinc-100/60 dark:bg-secondary/20 border border-zinc-200 dark:border-border/10 space-y-4 group/time shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Horário
                      </span>
                      <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full opacity-0 group-hover/time:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" onClick={() => setEditSection('time')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>

                    {editSection === 'time' ? (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <input type="time" value={editedTime} onChange={e => setEditedTime(e.target.value)} className="flex-1 bg-background border border-border/20 rounded-xl text-foreground font-bold font-mono px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                        <Button size="sm" onClick={() => handleActionClick('reschedule')} className="rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 shrink-0">Salvar</Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl font-light tracking-tighter text-foreground tabular-nums">
                          {formatTimeBrazil(appointment.start_time)}
                          <span className="text-lg text-muted-foreground ml-1 font-mono">
                            - {formatTimeBrazil(appointment.end_time)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modalidade Box */}
                  <div className="p-5 rounded-[24px] bg-zinc-100/60 dark:bg-secondary/20 border border-zinc-200 dark:border-border/10 space-y-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                      {appointment.type?.toLowerCase() === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      Modalidade
                    </span>
                    <div>
                      <p className="text-lg font-bold text-foreground tracking-tight">
                        {appointment.type?.toLowerCase() === 'online' ? 'Teleconsulta' : 'Presencial'}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground line-clamp-1 mt-0.5">
                        {appointment.location || 'Consultório Principal'}
                      </p>
                    </div>
                  </div>

                  {/* Financeiro Box - Ocupa 2 colunas se existir */}
                  {transactionData && (
                    <div className="col-span-1 sm:col-span-2 p-5 rounded-[24px] bg-zinc-100/60 dark:bg-secondary/20 border border-zinc-200 dark:border-border/10 shadow-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                            <Banknote className="w-3.5 h-3.5" />
                            Cobrança
                          </span>
                          <p className="text-3xl font-light text-foreground tracking-tighter tabular-nums flex items-baseline">
                            R$ <span className="font-bold ml-1">{parseFloat(editedAmount || appointment.price?.toString() || "0").toFixed(2).replace('.', ',')}</span>
                          </p>
                        </div>

                        <div className="flex gap-4 sm:flex-row flex-col sm:items-center shrink-0">
                          <div className="flex items-center gap-2 text-foreground font-medium text-sm bg-background/50 px-3 py-1.5 rounded-full border border-border/10">
                            {getMethodIcon(transactionData.payment_method)}
                            <span className="capitalize">{transactionData.payment_method?.replace('_', ' ') || 'Não definido'}</span>
                          </div>

                          {/* Status e Pacote tags */}
                          <div className="flex flex-wrap gap-2">
                            {paymentStatus && (
                              <div className={cn("flex items-center px-3 py-1.5 rounded-full border border-current/10", paymentStatus.bgColor)}>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", paymentStatus.color)}>
                                  {paymentStatus.label}
                                </span>
                              </div>
                            )}
                            {packageData && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                                <Briefcase className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Via Pacote</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Notas Estratégicas - Matching Form Modal */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Notas da Sessão
                  </label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[120px] bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] resize-none text-foreground px-6 py-4 text-base transition-all focus:border-border/20 focus:ring-0 placeholder:text-muted-foreground/50"
                    placeholder="Adicione observações da consulta..."
                  />
                </div>

              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-8 space-y-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-500",
                    confirmationAction === 'cancel' ? "bg-rose-500/20 text-rose-500" : "bg-primary/20 text-primary"
                  )}>
                    {confirmationAction === 'cancel' ? <AlertCircle className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Confirmar Operação</h2>
                    <p className="text-muted-foreground font-medium max-w-[300px] mx-auto text-sm">
                      {confirmationAction === 'cancel'
                        ? "Tem certeza que deseja cancelar esta sessão? Esta ação mudará o status e liberará o horário na agenda."
                        : `Deseja realmente reagendar a consulta para as ${editedTime}?`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full h-12 border-border/20">Voltar</Button>
                  <Button
                    onClick={executeAction}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 rounded-full h-12 font-bold shadow-md",
                      confirmationAction === 'cancel' ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center space-y-6 py-12">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Sucesso!</h2>
                  <p className="text-muted-foreground text-sm">Ação concluída e registrada.</p>
                </div>
                <Button onClick={() => setOpen(false)} className="rounded-full px-8 h-12 bg-primary text-primary-foreground font-bold shadow-lg mt-4">Fechar Ficha</Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer actions */}
        {step === 1 && (
          <div className="p-6 bg-zinc-50/60 dark:bg-card/60 border-t border-zinc-200 dark:border-border/10 flex flex-col sm:flex-row gap-3 justify-between items-center backdrop-blur-xl shrink-0">
            <Button
              variant="ghost"
              onClick={() => handleActionClick('cancel')}
              className="w-full sm:w-auto text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full px-6 h-12 font-bold transition-all"
            >
              Cancelar Agendamento
            </Button>

            <Button
              onClick={async () => { await handleSaveNotes(); setOpen(false); }}
              className="w-full sm:w-auto rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg transition-all active:scale-95 tracking-wide"
            >
              Salvar & Fechar
            </Button>
          </div>
        )}

      </div>
    </ResponsiveModal>
  );
};
