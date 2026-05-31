import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useSessionMessages, useSendChatMessage, useChatSessions, useCreateChatSession } from "@/hooks/use-ai-chat";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Efeito de Digitação Simples
const Typewriter = ({ text, speed = 10 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return <span>{displayedText}</span>;
};

const ChatMessage = ({ message, isLast }: { message: Message, isLast: boolean }) => {
  const isUser = message.role === 'user';
  // Só anima se for a última mensagem e for da IA (assistant)
  const shouldAnimate = !isUser && isLast;

  return (
    <div className={cn(
      "flex flex-col max-w-[85%] mb-4 animate-fade-in",
      isUser ? "items-end ml-auto" : "items-start mr-auto"
    )}>
      <div className={cn(
        "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg transition-all",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-sm shadow-primary/20"
          : "bg-white/10 text-foreground backdrop-blur-md border border-white/10 rounded-bl-sm"
      )}>
        {shouldAnimate ? <Typewriter text={message.content} /> : message.content}
      </div>
      <span className="text-[10px] text-muted-foreground/60 mt-1 px-1 font-medium">
        {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

interface ChatContentProps {
  height: string;
}

export const ChatContent = ({ height }: ChatContentProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const { data: sessions } = useChatSessions();
  const createSession = useCreateChatSession();
  const activeSessionId = sessions?.[0]?.id || null;
  const { data: history, isLoading: isLoadingHistory } = useSessionMessages(activeSessionId);
  const { mutate: sendMessage, isPending: isSending } = useSendChatMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputMessage.trim() && !isSending) {
      if (!activeSessionId) {
        // Create a new session first if none exists
        createSession.mutateAsync("Nova Conversa").then((session) => {
          sendMessage({ message: inputMessage.trim(), sessionId: session.id });
        });
      } else {
        sendMessage({ message: inputMessage.trim(), sessionId: activeSessionId });
      }
      setInputMessage("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history, isSending]);

  return (
    // Aplicando a classe glass-base para garantir o efeito "liquid glass" fosco e escuro
    <Card className={cn("flex flex-col overflow-hidden glass-base border-white/10", height)}>
      <div className="flex items-center justify-between border-b border-white/10 p-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <h2 className="text-sm font-semibold tracking-wide text-white/90">NeuroNex AI</h2>
        </div>
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>

      {/* Chat History Area */}
      <ScrollArea className="flex-1 p-4 bg-black/20">
        <div className="space-y-1 pb-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            </div>
          ) : history && history.length > 0 ? (
            history.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLast={index === history.length - 1}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shadow-inner">
                <MessageSquare className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">Como posso ajudar na gestão do seu consultório hoje?</p>
            </div>
          )}

          {isSending && (
            <div className="flex flex-col items-start max-w-[85%] mr-auto animate-fade-in">
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-white/[0.02] border-t border-white/10">
        <div className="flex gap-2 items-end bg-black/40 rounded-[20px] p-1.5 border border-white/10 focus-within:border-primary/40 transition-colors shadow-inner">
          <Input
            placeholder="Digite sua mensagem..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isSending}
            className="border-none bg-transparent focus-visible:ring-0 min-h-[44px] max-h-[120px] py-2.5 px-4 resize-none shadow-none text-sm placeholder:text-muted-foreground/50"
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !inputMessage.trim()}
            size="icon"
            className="h-10 w-10 rounded-full mb-0.5 mr-0.5 bg-primary hover:bg-primary/90 shrink-0 shadow-glow btn-tactile"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};