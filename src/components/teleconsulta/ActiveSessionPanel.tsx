import type { Appointment } from '@/types';
import { DesktopClinicalSession } from './DesktopClinicalSession';

interface ActiveSessionPanelProps {
  activeAppointment: Appointment;
  patientName: string;
  onSessionEnd: () => void;
}

export const ActiveSessionPanel = (props: ActiveSessionPanelProps) => (
  <DesktopClinicalSession {...props} />
);
