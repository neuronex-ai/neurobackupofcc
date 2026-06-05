import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { CheckCircle2, Clock, CalendarDays, Lock, Loader2, ShieldCheck, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { isCancelledAppointmentStatus } from "@/lib/appointment-status";

interface Appointment {
  id: string;
  user_id: string;
  token: string;
  start_time: string;
  end_time: string;
  status: string;
  auth_code: string;
  price?: number;
  payment_config?: {
    type?: string;
    paymentType?: string;
  };
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  patients?: {
    name: string;
  };
}

// Pagamento integrado via Asaas BaaS

export default function ConfirmAppointment() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [authCodeInput, setAuthCodeInput] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busyTimes, setBusyTimes] = useState<string[]>([]);

  const times = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  useEffect(() => {
    if (selectedDate && appointment?.user_id) {
      fetchBusyTimes();
    }
  }, [selectedDate, appointment?.user_id]);

  const fetchBusyTimes = async () => {
    if (!selectedDate || !appointment?.user_id) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('appointments')
      .select('start_time, status, notes')
      .eq('user_id', appointment.user_id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    if (data) {
      const busy = data
        .filter(app => !isCancelledAppointmentStatus(app.status, app.notes))
        .map(app => format(new Date(app.start_time), 'HH:mm'));
      setBusyTimes(busy);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [token]);

  const fetchAppointment = async () => {
    if (!token) return;
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles(full_name, id, avatar_url), patients(name)')
      .eq('token', token)
      .single();

    if (error || !data) {
      console.error("Erro ao buscar agendamento:", error);
      toast.error(`Link de convite inválido ou expirado. ${error?.message || ''}`);
      return;
    }
    setAppointment(data);
  };

  const handleAuthenticate = () => {
    if (appointment?.auth_code && authCodeInput.toUpperCase() === appointment.auth_code?.toUpperCase()) {
      setStep(2);
      toast.success("Identidade confirmada!");
    } else {
      toast.error("Código incorreto. Verifique seu e-mail.");
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !appointment) {
      toast.error("Selecione data e horário.");
      return;
    }

    const start = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    start.setHours(parseInt(hours), parseInt(minutes));
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .update({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .eq('id', appointment.id);

    if (error) {
      toast.error("Erro ao agendar.");
      setLoading(false);
      return;
    }

    // Insert Notification
    await supabase.from('notifications').insert({
      user_id: appointment.user_id,
      title: 'Sessão Reagendada pelo Paciente',
      message: `A consulta de ${appointment.patients?.name || 'um paciente'} foi movida para o dia ${format(start, "dd/MM 'às' HH:mm", { locale: ptBR })}.`,
      type: 'reschedule',
      read: false,
      action_link: `/agenda?date=${format(start, 'yyyy-MM-dd')}`
    });

    if (appointment.payment_config?.type === 'charge' || appointment.payment_config?.paymentType === 'charge') {
      try {
        console.log("[ConfirmAppointment] Criando cobrança PIX via Asaas para appointment:", appointment.id);
        const { data: { session } } = await supabase.auth.getSession();

        if (session && appointment.price) {
          const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://krewdaklcyzqfxkkgvqr.supabase.co';
          const response = await fetch(`${baseUrl}/functions/v1/asaas-create-payment`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify({
              amount: Math.round(appointment.price * 100), // centavos
              description: `Sessão com ${appointment.profiles?.full_name || 'profissional'}`,
              appointment_id: appointment.id,
              payment_methods: ['pix'],
              expires_in_minutes: 60,
            }),
          });

          if (response.ok) {
            const paymentData = await response.json();
            // Save checkout URL or payment ID for display
            setClientSecret(paymentData?.checkout_url || paymentData?.payment_id || "payment_created");
            setStep(3);
          } else {
            // If Asaas payment fails, proceed without payment
            console.warn("[ConfirmAppointment] Asaas payment creation failed, finalizing without payment");
            handleFinalize();
          }
        } else {
          handleFinalize();
        }
      } catch (e) {
        console.warn("[ConfirmAppointment] Payment error, finalizing:", e);
        handleFinalize();
      }
    } else {
      console.log("[ConfirmAppointment] Finalizando agendamento sem cobrança imediata.");
      handleFinalize();
    }
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!appointment) return;

    // Se temos uma checkout URL (Asaas), redirecionamos o usuário para pagar
    if (clientSecret && clientSecret.startsWith('http')) {
      window.location.href = clientSecret;
      return;
    }

    const newStatus = 'unscored';

    await supabase.from('appointments').update({ status: newStatus }).eq('id', appointment.id);

    // Insert Notification
    const title = 'Agendamento confirmado';
    await supabase.from('notifications').insert({
      user_id: appointment.user_id,
      title: title,
      message: `A presença de ${appointment.patients?.name || 'um paciente'} foi confirmada para ${format(new Date(appointment.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })}.`,
      type: 'status_update',
      read: false,
      action_link: `/agenda?date=${format(new Date(appointment.start_time), 'yyyy-MM-dd')}`
    });

    setStep(4);
    launchConfetti();
  };

  const launchConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#10b981', '#6366f1']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#10b981', '#6366f1']
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  if (!appointment) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
      </div>
      <p className="text-muted-foreground text-sm font-medium tracking-wide">Carregando convite...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md mb-10 text-center space-y-3 relative z-10 animate-fade-in">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Portal do Paciente</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]">Agendamento Seguro</p>
      </div>

      <Card className="w-full max-w-[460px] shadow-2xl border-border bg-card/60 backdrop-blur-2xl rounded-[32px] overflow-hidden relative z-10 ring-1 ring-border">
        <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-400 opacity-80" />
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="p-8 md:p-10"
            >
              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Código de Acesso</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                      Para sua privacidade, digite o código de 5 dígitos que você recebeu.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="relative group">
                      <Input
                        className="text-center text-3xl font-mono tracking-[0.5em] h-20 uppercase rounded-2xl border-border bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-black text-foreground placeholder:text-muted-foreground/30"
                        placeholder="•••••"
                        maxLength={5}
                        value={authCodeInput}
                        onChange={(e) => setAuthCodeInput(e.target.value.toUpperCase())}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                    </div>

                    <Button
                      className="w-full h-16 text-base font-bold rounded-2xl bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-all shadow-xl shadow-foreground/5"
                      onClick={handleAuthenticate}
                    >
                      Confirmar Identidade <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-5 p-5 rounded-2xl bg-muted/50 border border-border shadow-inner">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl" />
                      <div className="w-14 h-14 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center shrink-0 text-foreground relative z-10">
                        {appointment.profiles?.avatar_url ?
                          <img src={appointment.profiles.avatar_url} className="w-full h-full rounded-xl object-cover" /> :
                          <User className="w-7 h-7" />
                        }
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/80 mb-1">Você recebeu um convite de</p>
                      <h3 className="font-bold text-lg text-foreground truncate leading-tight">{appointment.profiles?.full_name || "Seu Psicólogo"}</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 px-1">
                      <CalendarDays className="w-4 h-4 text-primary" /> Selecione a Data
                    </h3>
                    <div className="border border-border rounded-2xl p-4 bg-background/50 backdrop-blur-sm shadow-sm flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={ptBR}
                        className="rounded-md mx-auto custom-calendar"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 px-1">
                      <Clock className="w-4 h-4 text-primary" /> Horários Disponíveis
                    </h3>
                    <div className="grid grid-cols-4 gap-2.5">
                      {times.map(t => {
                        const isBusy = busyTimes.includes(t);
                        return (
                          <button
                            key={t}
                            disabled={isBusy}
                            onClick={() => setSelectedTime(t)}
                            className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isBusy ? 'opacity-30 cursor-not-allowed bg-muted text-muted-foreground border border-transparent' :
                              selectedTime === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 border-primary' :
                                'bg-background text-foreground hover:bg-muted border border-border'
                              }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full h-16 text-base font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 mt-6"
                    disabled={loading || !selectedTime || !selectedDate}
                    onClick={handleSchedule}
                  >
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (appointment.payment_config?.type === 'charge' || appointment.payment_config?.paymentType === 'charge' ? "Ir para Pagamento" : "Confirmar Agendamento")}
                  </Button>
                </div>
              )}

              {step === 3 && clientSecret && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <ShieldCheck className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Pagamento</h2>
                    <p className="text-sm text-muted-foreground">Confirme o pagamento da sua sessão.</p>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-2xl border border-border mb-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                      <span>Serviço Profissional</span>
                      <span>Valor Único</span>
                    </div>
                    <div className="flex justify-between items-center text-3xl font-black text-foreground">
                      <span>Total</span>
                      <span className="text-emerald-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price || 0)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleFinalize}
                    className="w-full h-16 text-base font-bold rounded-2xl bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-all shadow-xl shadow-foreground/5"
                  >
                    Confirmar Pagamento
                  </Button>
                </div>
              )}

              {step === 4 && (
                <div className="text-center space-y-10 py-6">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse" />
                    <div className="w-32 h-32 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center relative z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Confirmado!</h2>
                    <p className="text-muted-foreground leading-relaxed text-sm max-w-[280px] mx-auto">
                      Seu agendamento para <br />
                      <strong className="text-foreground font-bold text-lg">{format(new Date(appointment.start_time), "dd 'de' MMMM", { locale: ptBR })}</strong> <br />
                      às <strong className="text-primary font-bold text-lg">{format(new Date(appointment.start_time), "HH:mm")}</strong> foi concluído com sucesso.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full h-16 text-base font-bold rounded-2xl bg-muted text-foreground hover:bg-muted/80 border border-border active:scale-[0.98] transition-all" onClick={() => navigate('/')}>
                      Voltar ao Portal
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="mt-12 text-center animate-fade-in opacity-50 relative z-10">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3">
          <span className="w-10 h-px bg-border" />
          <ShieldCheck className="w-3.5 h-3.5" /> Site Seguro • Criptografia de Ponta
          <span className="w-10 h-px bg-border" />
        </p>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-calendar.rdp { 
          --rdp-cell-size: 40px; 
          --rdp-accent-color: hsl(var(--primary)); 
          --rdp-background-alpha: 0.1; 
          color: hsl(var(--foreground)); 
          border: none !important; 
          margin: 0 auto !important;
          display: block;
        }
        @media (max-width: 440px) {
          .custom-calendar.rdp { --rdp-cell-size: 34px; }
        }
        @media (max-width: 380px) {
          .custom-calendar.rdp { --rdp-cell-size: 30px; }
        }
        .custom-calendar .rdp-day_selected { background-color: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; font-weight: 800; border-radius: 12px; }
        .custom-calendar .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background: hsl(var(--muted)) !important; color: hsl(var(--foreground)); border-radius: 12px; }
        .custom-calendar .rdp-head_cell { font-size: 11px; font-weight: 800; text-transform: uppercase; color: hsl(var(--muted-foreground)); padding-bottom: 1rem; }
        .custom-calendar .rdp-caption_label { font-size: 16px; font-weight: 800; color: hsl(var(--foreground)); text-transform: capitalize; padding: 0 0.5rem; }
      `}</style>
    </div>
  );
}
