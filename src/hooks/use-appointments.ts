import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Appointment } from "@/types";

interface UseAppointmentsProps {
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  includeCancelled?: boolean;
}

export const useAppointments = ({ startDate, endDate, patientId, includeCancelled = false }: UseAppointmentsProps = {}) => {
  return useQuery({
    queryKey: ["appointments", startDate?.toISOString(), endDate?.toISOString(), patientId, includeCancelled],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patients (
            name
          )
        `);

      if (!includeCancelled) {
        query = query.neq("status", "cancelled");
      }

      query = query.order("start_time", { ascending: true });

      if (startDate) {
        query = query.gte("start_time", startDate.toISOString());
      }

      if (endDate) {
        query = query.lte("start_time", endDate.toISOString());
      }

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((app: any) => ({
        ...app,
        patient_name: app.patients?.name || "Paciente não identificado",
      })) as Appointment[];
    },
  });
};