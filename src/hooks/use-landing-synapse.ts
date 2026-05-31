import { useState, useCallback, useEffect } from "react";

export interface SDRMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: SDRMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Olá! Sou o Synapse, sua nova inteligência clínica. Como posso ajudar a transformar sua rotina hoje?",
  },
];

const CANNED_RESPONSES = [
  "Interessante! O NeuroNex foi desenhado justamente para automatizar essas tarefas burocráticas e te devolver tempo de qualidade com seus pacientes.",
  "Com certeza. Nossa IA de voz consegue realizar agendamentos de forma natural, como uma secretária real faria, mas disponível 24/7.",
  "O Synapse AI entende o contexto clínico e ético, garantindo um atendimento acolhedor e profissional para quem procura sua clínica.",
  "Além do agendamento, o NeuroNex cuida de toda a sua gestão financeira, faturamento e prontuários inteligentes em um só lugar.",
];

export const useLandingSynapse = () => {
  const [messages, setMessages] = useState<SDRMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [shouldOpenWaitlist, setShouldOpenWaitlist] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);

  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const resetChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setUserMessageCount(0);
    setShouldOpenWaitlist(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: SDRMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setUserMessageCount((prev) => prev + 1);

    // Simulate AI thinking
    setTimeout(() => {
      const responseIndex = Math.min(userMessageCount, CANNED_RESPONSES.length - 1);
      const aiMsg: SDRMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: CANNED_RESPONSES[responseIndex],
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);

      // Trigger waitlist after 2 messages or specific keywords
      const triggerKeywords = ["preço", "valor", "assinar", "comprar", "custo", "pagar", "teste", "testar"];
      const hasKeyword = triggerKeywords.some(keyword => content.toLowerCase().includes(keyword));
      
      if (userMessageCount >= 1 || hasKeyword) {
        setShouldOpenWaitlist(true);
      }
    }, 1500);
  }, [userMessageCount]);

  const consumeWaitlistTrigger = useCallback(() => {
    setShouldOpenWaitlist(false);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    shouldOpenWaitlist,
    closeChat,
    toggleChat,
    sendMessage,
    resetChat,
    consumeWaitlistTrigger,
  };
};
