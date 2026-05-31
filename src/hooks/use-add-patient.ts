import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewPatientFormValues } from '@/lib/validation';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { format } from 'date-fns';

const addPatient = async (patientData: NewPatientFormValues, userId: string) => {
  // Concatena nome e telefone para salvar no campo único de emergência
  const emergencyContact = [patientData.emergency_name, patientData.emergency_phone]
    .filter(Boolean)
    .join(" - ");

  const { data, error } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      name: patientData.name,
      email: patientData.email || null,
      phone: patientData.phone || null,
      cpf: patientData.cpf || null, // Novo campo
      diagnosis: patientData.diagnosis || null,
      notes: patientData.notes || null,
      status: 'pending',
      birth_date: patientData.birth_date ? format(patientData.birth_date, 'yyyy-MM-dd') : null,
      address: patientData.address || null,
      emergency_contact: emergencyContact || null,
      payer_type: patientData.payer_type,
      payer_name: patientData.payer_name || null,
      payer_cpf: patientData.payer_cpf || null,
      medications: patientData.medications || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar paciente:', error);
    throw new Error(error.message);
  }

  return data;
};

export const useAddPatient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (patientData: NewPatientFormValues) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return addPatient(patientData, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};