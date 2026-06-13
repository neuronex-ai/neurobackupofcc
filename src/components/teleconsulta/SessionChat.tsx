import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { SessionChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SessionChatProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  currentUserId: string;
  currentUserName: string;
}

export const SessionChat = ({
  isOpen,
  onClose,
  appointmentId,
  currentUserId,
  currentUserName
}: SessionChatProps) => {
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appointmentId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('session_chat_messages')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`session-chat-${appointmentId}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on<SessionChatMessage>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_chat_messages',
          filter: `appointment_id=eq.${appointmentId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);

    const { error } = await supabase
      .from('session_chat_messages')
      .insert({
        appointment_id: appointmentId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_role: 'therapist',
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
    } else {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute left-6 top-24 bottom-28 w-full max-w-sm bg-white/60 dark:bg-[#050505]/60 backdrop-blur-[40px] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-30 flex flex-col rounded-[24px] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/10">
                  <MessageSquare className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Chat da Sessão</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('/noise.png')] bg-opacity-5">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30">
                  <MessageSquare className="w-8 h-8" />
                  <p className="text-xs">Nenhuma mensagem ainda.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                      <div className="flex items-end gap-2 mb-1.5">
                        {!isMe && (
                          <Avatar className="w-5 h-5 border border-white/20 dark:border-white/10 shadow-sm">
                            <AvatarFallback className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">{msg.sender_name?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{isMe ? 'Você' : msg.sender_name}</span>
                      </div>
                      <div className={cn("px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words relative overflow-hidden transition-all duration-300",
                        isMe
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[20px] rounded-tr-sm"
                          : "bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 text-zinc-800 dark:text-zinc-200 rounded-[20px] rounded-tl-sm backdrop-blur-md"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white/50 dark:bg-white/5 p-1.5 pr-2 rounded-full border border-black/5 dark:border-white/10 focus-within:border-zinc-400 dark:focus-within:border-white/30 focus-within:ring-4 focus-within:ring-zinc-500/10 dark:focus-within:ring-white/5 transition-all duration-300">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm h-9 px-4 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending} className={cn("h-8 w-8 rounded-full transition-all duration-300 shadow-sm", newMessage.trim() ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-100" : "bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-white/20 scale-90")}>
                  {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
