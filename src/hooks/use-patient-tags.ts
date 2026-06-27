import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";

export interface PatientTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

const fetchTags = async (userId: string): Promise<PatientTag[]> => {
  const { data, error } = await supabase
    .from("patient_tags")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const usePatientTags = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["patient-tags", userId],
    queryFn: () => fetchTags(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addTag = useMutation({
    mutationFn: async ({ name, color = "#685094" }: { name: string; color?: string }) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const normalized = name.trim();
      if (!normalized) throw new Error("Informe o nome da tag.");

      const { data, error } = await supabase
        .from("patient_tags")
        .insert({ user_id: userId, name: normalized, color })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data as PatientTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-tags", userId] });
    },
  });

  return {
    ...query,
    addTag,
  };
};
