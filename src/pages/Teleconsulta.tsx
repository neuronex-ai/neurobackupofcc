import { useState, useEffect } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { UpcomingSessionsPanel } from '@/components/teleconsulta/UpcomingSessionsPanel';
import { ActiveSessionPanel } from '@/components/teleconsulta/ActiveSessionPanel';
import { startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTeleconsulta } from '@/mobile/pages/MobileTeleconsulta';
import { FeatureGate, LockedFeatureScreen } from '@/components/subscription';
import { getAppointmentKind, getAppointmentMetadata } from '@/lib/appointment-metadata';
import { isCancelledAppointmentStatus } from '@/lib/appointment-status';

const TeleconsultaCore = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | undefined>(undefined);

  const [dateRange] = useState(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = addMonths(endOfWeek(new Date(), { weekStartsOn: 1 }), 3);
    return { start, end };
  });

  const { data: appointments, isLoading } = useAppointments({
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  useEffect(() => {
    if (location.state?.activeAppointmentId && appointments) {
      const targetApt = appointments.find(a => a.id === location.state.activeAppointmentId);
      if (targetApt) {
        setActiveAppointmentId(targetApt.id);
        window.history.replaceState({}, document.title, location.pathname);
      }
    }
  }, [location.state, appointments]);

  const teleconsultationSessions = (appointments || []).filter((appointment) => {
    if (isCancelledAppointmentStatus(appointment.status, appointment.notes)) return false;
    if (getAppointmentKind(appointment) !== 'session') return false;

    const metadata = getAppointmentMetadata(appointment);
    const appointmentType = appointment.type as string;
    return (
      appointmentType === 'online' ||
      appointmentType === 'teleconsulta' ||
      metadata.modality === 'online' ||
      !!appointment.google_meet_link
    );
  });

  const activeAppointment = teleconsultationSessions.find(apt => apt.id === activeAppointmentId);
  const upcomingSessions = teleconsultationSessions.filter(apt => apt.id !== activeAppointmentId);

  const startSession = (appointmentId: string) => {
    setActiveAppointmentId(appointmentId);
  };

  const endSession = () => {
    setActiveAppointmentId(undefined);
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };

  if (isMobile) {
    return <MobileTeleconsulta />;
  }

  if (activeAppointment) {
    return (
      <div className="desktop-page-canvas relative min-h-screen overflow-hidden">
        <ActiveSessionPanel
          activeAppointment={activeAppointment}
          patientName={activeAppointment.patient_name || 'Paciente'}
          onSessionEnd={endSession}
        />
      </div>
    );
  }

  return (
    <div className="desktop-page-canvas relative min-h-screen overflow-hidden px-5 pb-10 pt-10 lg:px-8">
      <UpcomingSessionsPanel
        upcomingSessions={upcomingSessions}
        activeAppointment={activeAppointment}
        isLoading={isLoading}
        startSession={startSession}
      />
    </div>
  );
};

const Teleconsulta = () => {
  return (
    <FeatureGate
      feature="telemedicine"
      fallback={
        <LockedFeatureScreen
          feature="telemedicine"
          title="Telemedicina HD"
          description="Realize consultas por videochamada com qualidade HD, transcrição automática e integração total com o prontuário. Disponível a partir do plano Professional."
        />
      }
    >
      <TeleconsultaCore />
    </FeatureGate>
  );
};

export default Teleconsulta;
