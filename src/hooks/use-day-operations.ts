import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import { Appointment } from '@/types';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface MoveOperation {
  original: Appointment;
  proposedStart: string;
  proposedEnd: string;
  status: 'valid' | 'conflict';
  conflictWith?: Appointment;
}

export const useDayOperations = () => {
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // 1. Simula o movimento para mostrar prévia e identificar conflitos
  const calculateMove = async (sourceDate: Date, targetDate: Date, userId: string): Promise<MoveOperation[]> => {
    setIsCalculating(true);
    try {
      const sourceStr = format(sourceDate, 'yyyy-MM-dd');
      const targetStr = format(targetDate, 'yyyy-MM-dd');

      // Calcular a diferença exata em dias (pode ser positivo ou negativo)
      const daysDiff = differenceInCalendarDays(targetDate, sourceDate);

      if (daysDiff === 0) {
        toast.info("A data de origem e destino são iguais.");
        return [];
      }

      // Buscar agendamentos do dia de origem
      const { data: sourceAppts } = await supabase
        .from('appointments')
        .select('*, patient:patient_id(name)')
        .eq('user_id', userId)
        .gte('start_time', `${sourceStr}T00:00:00`)
        .lte('start_time', `${sourceStr}T23:59:59`)
        .neq('status', 'cancelled');

      if (!sourceAppts || sourceAppts.length === 0) return [];

      // Buscar agendamentos do dia de destino (para checar conflito)
      const { data: targetAppts } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', `${targetStr}T00:00:00`)
        .lte('start_time', `${targetStr}T23:59:59`)
        .neq('status', 'cancelled');

      // Calcular propostas
      const operations: MoveOperation[] = sourceAppts.map((apt: any) => {
        const originalStart = new Date(apt.start_time);
        const originalEnd = new Date(apt.end_time);

        // MÉTODO SEGURO: Adicionar a diferença de dias às datas originais
        // Isso preserva fuso horário e hora exata
        const newStart = addDays(originalStart, daysDiff);
        const newEnd = addDays(originalEnd, daysDiff);

        // Checar colisão no destino
        const conflict = targetAppts?.find(t => {
          const tStart = new Date(t.start_time);
          const tEnd = new Date(t.end_time);
          // Lógica de overlap: (StartA < EndB) e (EndA > StartB)
          return (newStart < tEnd && newEnd > tStart);
        });

        return {
          original: apt,
          proposedStart: newStart.toISOString(),
          proposedEnd: newEnd.toISOString(),
          status: conflict ? 'conflict' : 'valid',
          conflictWith: conflict as unknown as Appointment
        };
      });

      return operations;

    } catch (e) {
      console.error(e);
      toast.error("Erro ao calcular mudanças.");
      return [];
    } finally {
      setIsCalculating(false);
    }
  };

  // 2. Executa o movimento real
  const executeMove = async (operations: MoveOperation[]): Promise<{ success: boolean; count: number }> => {
    setIsExecuting(true);

    // Filtramos apenas as operações que foram marcadas como válidas
    const validOps = operations.filter(op => op.status === 'valid');

    if (validOps.length === 0) {
      toast.warning("Nenhuma operação válida para executar (todos os horários estão ocupados no destino).");
      setIsExecuting(false);
      return { success: false, count: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    try {
      // Executar updates SEQUENCIALMENTE para garantir cada um completa
      for (const op of validOps) {
        const { data, error } = await supabase
          .from('appointments')
          .update({
            start_time: op.proposedStart,
            end_time: op.proposedEnd,
            updated_at: new Date().toISOString()
          })
          .eq('id', op.original.id)
          .select() // Force return to verify update actually happened
          .single();

        if (error) {
          console.error("Falha individual ao mover:", op.original.id, error);
          failCount++;
        } else if (data) {
          console.log("Agendamento movido com sucesso:", data.id, "para", data.start_time);
          successCount++;
        } else {
          console.error("Update retornou vazio para:", op.original.id);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} agendamentos reagendados com sucesso!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} falharam ao mover.`);
      }

      // --- INVALIDAÇáO COM MATCH PARCIAL ---
      // Invalidar TODAS as queries que começam com 'appointments' (qualquer sufixo de data)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'appointments';
        }
      });

      // Forçar refetch de todas as queries de appointments ativas
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'appointments';
        }
      });

      return { success: successCount > 0, count: successCount };

    } catch (e) {
      console.error("Erro fatal no reagendamento:", e);
      toast.error("Erro ao processar reagendamentos.");
      return { success: false, count: 0 };
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    calculateMove,
    executeMove,
    isCalculating,
    isExecuting
  };
};