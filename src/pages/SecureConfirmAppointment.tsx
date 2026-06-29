import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { isCancelledAppointmentStatus } from '@/lib/appointment-status';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

interface PublicAppointment {
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
}

type PublicAppointmentEvent = 'rescheduled' | 'confirmed';

const AVAILABLE_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

export default function SecureConfirmAppointment() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [appointment, setAppointment] = useState<PublicAppointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [busyTimes, setBusyTimes] = useState<string[]>([]);
  const [paymentReference, setPaymentReference] = useState('');

  const emitNotification = async (
    currentAppointment: PublicAppointment,
    event: PublicAppointmentEvent,
  ) => {
    const { error } = await supabase.functions.invoke(
      'public-appointment-notification',
      {
        body: {
          appointmentId: currentAppointment.id,
          token: currentAppointment.token,
          event,
        },
      },
    );
    if (error) throw error;
  };

  useEffect(() => {
    if (!token) return;

    const loadAppointment = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, profiles(full_name, id, avatar_url)')
        .eq('token', token)
        .single();

      if (error || !data) {
        toast.error('Link de convite inválido ou expirado.');
        return;
      }

      setAppointment(data as PublicAppointment);
    };

    void loadAppointment();
  }, [token]);

  useEffect(() => {
    if (!selectedDate || !appointment?.user_id) return;

    const loadBusyTimes = async () => {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('appointments')
        .select('start_time, status, notes')
        .eq('user_id', appointment.user_id)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      setBusyTimes(
        (data || [])
          .filter((item) => !isCancelledAppointmentStatus(item.status, item.notes))
          .map((item) => format(new Date(item.start_time), 'HH:mm')),
      );
    };

    void loadBusyTimes();
  }, [appointment?.user_id, selectedDate]);

  const confirmIdentity = () => {
    if (
      appointment?.auth_code &&
      authCode.toUpperCase() === appointment.auth_code.toUpperCase()
    ) {
      setStep(2);
      toast.success('Identidade confirmada.');
      return;
    }

    toast.error('Código incorreto. Verifique o convite recebido.');
  };

  const launchConfetti = () => {
    const end = Date.now() + 2200;
    const frame = () => {
      confetti({ particleCount: 4, spread: 55, origin: { x: 0.2 } });
      confetti({ particleCount: 4, spread: 55, origin: { x: 0.8 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const finalizeAppointment = async (currentAppointment: PublicAppointment) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'unscored' })
      .eq('id', currentAppointment.id)
      .eq('token', currentAppointment.token);

    if (error) throw error;

    try {
      await emitNotification(currentAppointment, 'confirmed');
    } catch (notificationError) {
      console.error('[Public appointment] Falha ao emitir confirmação.', notificationError);
    }

    setStep(4);
    launchConfetti();
  };

  const createPayment = async (currentAppointment: PublicAppointment) => {
    if (!currentAppointment.price) return null;

    const { data, error } = await supabase.functions.invoke('asaas-create-payment', {
      body: {
        amount: Math.round(currentAppointment.price * 100),
        description: `Sessão com ${currentAppointment.profiles?.full_name || 'profissional'}`,
        appointment_id: currentAppointment.id,
        payment_methods: ['pix'],
        expires_in_minutes: 60,
      },
    });

    if (error) throw error;
    return data;
  };

  const scheduleAppointment = async () => {
    if (!appointment || !selectedDate || !selectedTime) {
      toast.error('Selecione data e horário.');
      return;
    }

    const start = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        })
        .eq('id', appointment.id)
        .eq('token', appointment.token);

      if (error) throw error;

      const updatedAppointment = {
        ...appointment,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      };
      setAppointment(updatedAppointment);

      try {
        await emitNotification(updatedAppointment, 'rescheduled');
      } catch (notificationError) {
        console.error('[Public appointment] Falha ao emitir reagendamento.', notificationError);
      }

      const requiresPayment =
        appointment.payment_config?.type === 'charge' ||
        appointment.payment_config?.paymentType === 'charge';

      if (!requiresPayment || !appointment.price) {
        await finalizeAppointment(updatedAppointment);
        return;
      }

      try {
        const payment = await createPayment(updatedAppointment);
        const reference = payment?.checkout_url || payment?.payment_id || '';
        setPaymentReference(reference);

        if (typeof reference === 'string' && reference.startsWith('http')) {
          window.location.href = reference;
          return;
        }

        setStep(3);
      } catch (paymentError) {
        console.error('[Public appointment] Falha ao criar cobrança.', paymentError);
        await finalizeAppointment(updatedAppointment);
      }
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível concluir o agendamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 md:p-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-full max-w-4xl -translate-x-1/2 bg-primary/5 blur-[120px]" />
      <div className="relative z-10 w-full max-w-[460px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">Portal do Paciente</h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Agendamento seguro
          </p>
        </div>

        <Card className="overflow-hidden rounded-[32px] border-border bg-card/70 shadow-2xl backdrop-blur-2xl">
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                className="p-8 md:p-10"
              >
                {step === 1 ? (
                  <div className="space-y-7 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Código de acesso</h2>
                      <p className="mt-2 text-sm text-muted-foreground">Digite o código recebido.</p>
                    </div>
                    <Input
                      value={authCode}
                      maxLength={5}
                      onChange={(event) => setAuthCode(event.target.value.toUpperCase())}
                      className="h-20 rounded-2xl text-center font-mono text-3xl font-black tracking-[0.5em]"
                    />
                    <Button onClick={confirmIdentity} className="h-14 w-full rounded-2xl">
                      Confirmar identidade <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-7">
                    <div className="flex items-center gap-4 rounded-2xl border bg-muted/40 p-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-background">
                        {appointment.profiles?.avatar_url ? (
                          <img
                            src={appointment.profiles.avatar_url}
                            alt="Profissional"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">Convite de</p>
                        <p className="font-bold">{appointment.profiles?.full_name || 'Seu Psicólogo'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <CalendarDays className="h-4 w-4" /> Data
                      </p>
                      <div className="flex justify-center rounded-2xl border p-3">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR} />
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <Clock className="h-4 w-4" /> Horário
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {AVAILABLE_TIMES.map((time) => {
                          const busy = busyTimes.includes(time);
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={busy}
                              onClick={() => setSelectedTime(time)}
                              className={`h-10 rounded-xl border text-xs font-bold ${
                                busy
                                  ? 'cursor-not-allowed opacity-30'
                                  : selectedTime === time
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      disabled={loading || !selectedTime}
                      onClick={scheduleAppointment}
                      className="h-14 w-full rounded-2xl"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar agendamento'}
                    </Button>
                  </div>
                ) : null}

                {step === 3 && paymentReference ? (
                  <div className="space-y-7 text-center">
                    <ShieldCheck className="mx-auto h-16 w-16 text-emerald-500" />
                    <h2 className="text-2xl font-bold">Pagamento iniciado</h2>
                    <p className="text-sm text-muted-foreground">A cobrança foi criada. Confirme para concluir.</p>
                    <Button
                      onClick={() => void finalizeAppointment(appointment)}
                      className="h-14 w-full rounded-2xl"
                    >
                      Concluir
                    </Button>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div className="space-y-7 py-5 text-center">
                    <CheckCircle2 className="mx-auto h-24 w-24 text-emerald-500" />
                    <h2 className="text-3xl font-black">Confirmado!</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.start_time), "dd 'de' MMMM", { locale: ptBR })} às{' '}
                      {format(new Date(appointment.start_time), 'HH:mm')}
                    </p>
                    <Button variant="secondary" onClick={() => navigate('/')} className="h-14 w-full rounded-2xl">
                      Voltar ao portal
                    </Button>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
