import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

type WhatsAppLabel = {
  name: string;
};

export type WAConversation = {
  id: string;
  user_id?: string | null;
  remote_jid: string;
  patient_name: string | null;
  patient_phone: string;
  profile_picture_url?: string | null;
  last_message_preview?: string | null;
  last_message_at: string;
  unread_count: number;
  labels?: WhatsAppLabel[] | null;
};

export type WAMessage = {
  id: string;
  conversation_id?: string | null;
  direction: "inbound" | "outbound";
  content: string | null;
  content_type: string;
  status: string;
  is_from_ai?: boolean | null;
  media_base64?: string | null;
  media_mimetype?: string | null;
  media_filename?: string | null;
  created_at: string;
};

type SendMessagePayload = {
  conversationId: string;
  remoteJid: string;
  message?: string;
  triggerAI?: boolean;
  messageType?: string;
  mediaBase64?: string;
  mediaMimetype?: string;
  mediaFilename?: string;
};

type SimulateInboundPayload = {
  phone: string;
  content: string;
};

const toIso = (value: unknown) =>
  typeof value === "string" && value ? value : new Date().toISOString();

const mapConversation = (row: Record<string, any>): WAConversation => ({
  id: String(row.id),
  user_id: row.user_id ?? null,
  remote_jid: String(row.remote_jid || row.contact_phone || row.patient_phone || ""),
  patient_name: row.patient_name ?? row.contact_name ?? row.name ?? null,
  patient_phone: String(row.patient_phone || row.contact_phone || row.remote_jid || ""),
  profile_picture_url: row.profile_picture_url ?? row.avatar_url ?? null,
  last_message_preview: row.last_message_preview ?? row.last_message ?? null,
  last_message_at: toIso(row.last_message_at || row.updated_at || row.created_at),
  unread_count: Number(row.unread_count || 0),
  labels: Array.isArray(row.labels) ? row.labels : [],
});

const mapMessage = (row: Record<string, any>): WAMessage => ({
  id: String(row.id),
  conversation_id: row.conversation_id ?? null,
  direction: row.direction === "outbound" ? "outbound" : "inbound",
  content: row.content ?? row.message ?? "",
  content_type: row.content_type ?? row.message_type ?? "text",
  status: row.status ?? "sent",
  is_from_ai: Boolean(row.is_from_ai),
  media_base64: row.media_base64 ?? null,
  media_mimetype: row.media_mimetype ?? null,
  media_filename: row.media_filename ?? null,
  created_at: toIso(row.created_at),
});

export function useWhatsAppAgent() {
  const queryClient = useQueryClient();

  const invalidateConversations = () => {
    void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
  };

  const invalidateMessages = (conversationId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", conversationId] });
  };

  const useConversations = () =>
    useQuery<WAConversation[]>({
      queryKey: ["whatsapp-conversations"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("whatsapp_conversations")
          .select("*")
          .order("last_message_at", { ascending: false });

        if (error) throw error;
        return (data || []).map((row) => mapConversation(row as Record<string, any>));
      },
    });

  const useMessages = (conversationId?: string) =>
    useQuery<WAMessage[]>({
      queryKey: ["whatsapp-messages", conversationId],
      enabled: Boolean(conversationId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("whatsapp_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        return (data || []).map((row) => mapMessage(row as Record<string, any>));
      },
    });

  const sendMessage = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          conversationId: payload.conversationId,
          remoteJid: payload.remoteJid,
          message: payload.message,
          triggerAI: payload.triggerAI,
          messageType: payload.messageType || "text",
          mediaBase64: payload.mediaBase64,
          mediaMimetype: payload.mediaMimetype,
          mediaFilename: payload.mediaFilename,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      invalidateMessages(variables.conversationId);
      invalidateConversations();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem.");
    },
  });

  const simulateInbound = useMutation({
    mutationFn: async (payload: SimulateInboundPayload) => {
      const { data, error } = await supabase.functions.invoke("synapse-whatsapp-in", {
        body: {
          remoteJid: `${payload.phone.replace(/\D/g, "")}@s.whatsapp.net`,
          content: payload.content,
          messageType: "text",
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateConversations();
      toast.success("Mensagem simulada recebida.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel simular a mensagem.");
    },
  });

  const fullSync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("whatsapp-sync", { body: {} });
      if (error) throw error;
      return data;
    },
    onSettled: invalidateConversations,
    onError: () => toast.error("Nao foi possivel sincronizar o WhatsApp agora."),
  });

  const syncMessages = useMutation({
    mutationFn: async ({ remoteJid }: { remoteJid: string }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-sync-messages", {
        body: { remoteJid },
      });
      if (error) throw error;
      return data;
    },
    onSettled: invalidateConversations,
    onError: () => toast.error("Nao foi possivel atualizar as mensagens."),
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: (_data, conversationId) => {
      invalidateMessages(conversationId);
      invalidateConversations();
    },
  });

  const reconfigureWebhook = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("whatsapp-configure-webhook", {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success("Webhook reconfigurado."),
    onError: () => toast.error("Nao foi possivel reconfigurar o webhook."),
  });

  return {
    useConversations,
    useMessages,
    sendMessage,
    simulateInbound,
    fullSync,
    syncMessages,
    markAsRead,
    reconfigureWebhook,
  };
}
