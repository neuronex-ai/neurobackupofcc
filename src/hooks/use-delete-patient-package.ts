import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';

interface DeletePackageData {
  packageId: string;
  patientId: string;
}

const deletePatientPackage = async ({ packageId }: DeletePackageData, userId: string) => {
  const { error } = await supabase
    .from('patient_packages')
    .delete()
    .eq('id', packageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao excluir pacote de sessões:', error);
    throw new Error(error.message);
  }

  return true;
};

export const useDeletePatientPackage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (data: DeletePackageData) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return deletePatientPackage(data, userId);
    },
    onSuccess: (_, variables) => {
      toast.success("Pacote de sessões excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['patientPackages', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['activePatientPackages', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['advancedCashFlow'] });
    },
    onError: (error) => {
      toast.error(`Falha ao excluir pacote: ${error.message}`);
    }
  });
};