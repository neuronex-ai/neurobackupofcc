import { useState, useEffect, useRef } from "react";
import { useWhatsAppAgent, WAConversation, WAMessage } from "@/hooks/use-whatsapp-agent";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare, Send, Bot, User, Settings2, Loader2, Search, RefreshCw,
    CloudDownload, MessageCircle, Paperclip, Image as ImageIcon, Mic, X,
    Sparkles, Tag, Phone, Clock, CheckCheck, Check, AlertCircle, Zap,
    ArrowLeft, MoreVertical, Info, Star, Archive, Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppConnectHelper } from "@/components/whatsapp/WhatsAppConnectHelper";
import { MediaMessage } from "@/components/whatsapp/MediaMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { edgeFunctionUrl } from "@/lib/supabase-config";

// Premium color palette for labels
const LABEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'lead': { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
    'paciente': { bg: 'bg-white/10', text: 'text-white', border: 'border-white/20' },
    'urgente': { bg: 'bg-white', text: 'text-black', border: 'border-white' },
    'agendado': { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-800' },
    'retorno': { bg: 'bg-zinc-900', text: 'text-zinc-500', border: 'border-white/10' },
    'default': { bg: 'bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-800' }
};

const getLabelStyle = (labelName: string) => {
    const key = labelName?.toLowerCase() || 'default';
    return LABEL_COLORS[key] || LABEL_COLORS['default'];
};

const formatMessageDate = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "d 'de' MMMM", { locale: ptBR });
};

const formatConversationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM');
};

// Format display name - clean up @lid, @s.whatsapp.net, etc
const formatDisplayName = (patientName: string | null | undefined, patientPhone: string | null | undefined): string => {
    // If we have a valid name that isn't just the phone/jid
    if (patientName &&
        !patientName.includes('@lid') &&
        !patientName.includes('@s.whatsapp.net') &&
        !patientName.includes('@g.us') &&
        !/^\d+$/.test(patientName)) {
        return patientName;
    }

    // Extract phone number from various formats
    const phone = patientPhone || patientName || '';

    // Clean up formats like "123456789@lid" or "5511999999999@s.whatsapp.net"
    const cleanPhone = phone
        .replace('@s.whatsapp.net', '')
        .replace('@g.us', '')
        .replace(/@lid$/, '')
        .replace(/[^\d+]/g, ''); // Keep only digits and +

    // Format Brazilian phone numbers nicely
    if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
        const digits = cleanPhone.replace(/\D/g, '');
        if (digits.startsWith('55') && digits.length >= 12) {
            // Brazilian format: +55 (11) 99999-9999
            const ddd = digits.slice(2, 4);
            const number = digits.slice(4);
            if (number.length === 9) {
                return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
            } else if (number.length === 8) {
                return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
            }
        }
        // Other format: just show digits grouped
        if (digits.length >= 10) {
            return digits.replace(/(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
        }
    }

    // If all else fails return the cleaned string or a placeholder
    return cleanPhone || 'Contato';
};

// Get initials from name
const getInitials = (name: string): string => {
    if (!name || name.startsWith('(') || /^\d/.test(name)) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
};

const WhatsAppAgent = () => {
    const [selectedConversation, setSelectedConversation] = useState<WAConversation | null>(null);
    const [replyText, setReplyText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [simulatorOpen, setSimulatorOpen] = useState(false);
    const [simPhone, setSimPhone] = useState("5511999999999");
    const [simText, setSimText] = useState("Olá, gostaria de agendar uma consulta para amanhã.");
    const [triggerAI, setTriggerAI] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // New state for profile viewing
    const [viewProfileOpen, setViewProfileOpen] = useState(false);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apiUrl, setApiUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [instanceName, setInstanceName] = useState("");
    const [isActive, setIsActive] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { useConversations, useMessages, sendMessage, simulateInbound, fullSync, syncMessages, markAsRead, reconfigureWebhook } = useWhatsAppAgent();

    const { data: conversations, isLoading: isLoadingConversations } = useConversations();
    const { data: messages, isLoading: isLoadingMessages, refetch: refetchMessages } = useMessages(selectedConversation?.id);

    const { data: currentSettings } = useQuery({
        queryKey: ['whatsapp-settings'],
        queryFn: async () => {
            const { data } = await supabase.from('whatsapp_settings').select('*').maybeSingle();
            return data;
        }
    });

    useEffect(() => {
        if (currentSettings) {
            setApiUrl(currentSettings.api_url || "");
            setApiKey(currentSettings.api_key || "");
            setInstanceName(currentSettings.instance_name || "");
            setIsActive(currentSettings.is_active || false);
        }
    }, [currentSettings]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Filter conversations by search
    const filteredConversations = conversations?.filter(conv =>
        conv.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.patient_phone?.includes(searchQuery)
    );

    const handleSend = () => {
        if (!replyText.trim() || !selectedConversation) return;
        sendMessage.mutate({
            conversationId: selectedConversation.id,
            remoteJid: selectedConversation.remote_jid,
            message: replyText,
            triggerAI: triggerAI
        });
        setReplyText("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversation) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const messageType = file.type.startsWith('image/') ? 'image'
                : file.type.startsWith('audio/') ? 'audio'
                    : 'document';

            sendMessage.mutate({
                conversationId: selectedConversation.id,
                remoteJid: selectedConversation.remote_jid,
                messageType,
                mediaBase64: base64,
                mediaMimetype: file.type,
                mediaFilename: file.name,
                message: messageType === 'image' ? replyText : undefined
            });
            setReplyText("");
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSimulate = async () => {
        await simulateInbound.mutateAsync({
            phone: simPhone,
            content: simText
        });
        setSimulatorOpen(false);
        setSimText("");
        if (selectedConversation && selectedConversation.patient_phone === simPhone) {
            refetchMessages();
        }
    };

    const handleSaveSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('whatsapp_settings').upsert({
            user_id: user.id,
            api_url: apiUrl,
            api_key: apiKey,
            instance_name: instanceName,
            is_active: isActive,
            updated_at: new Date().toISOString()
        });

        if (error) {
            toast.error("Erro ao salvar configurações");
        } else {
            toast.success("Configurações do NeuroZap atualizadas!");
            setSettingsOpen(false);
        }
    };

    const handleSelectConversation = (conv: WAConversation) => {
        setSelectedConversation(conv);
        setShowMobileChat(true);
        if (conv.unread_count > 0) {
            markAsRead.mutate(conv.id);
        }
        syncMessages.mutate({ remoteJid: conv.remote_jid });
    };

    const webhookUrl = `${edgeFunctionUrl("whatsapp-agent")}?professionalId=${currentSettings?.user_id || 'ID-PROFISSIONAL'}`;

    // Group messages by date
    const groupedMessages: Record<string, WAMessage[]> = (messages || []).reduce((groups, msg) => {
        const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {} as Record<string, WAMessage[]>);

    // Status icon for messages
    const MessageStatus = ({ status, direction }: { status: string; direction: string }) => {
        if (direction === 'inbound') return null;
        switch (status) {
            case 'sent': return <Check className="w-3 h-3 text-zinc-600" />;
            case 'delivered': return <CheckCheck className="w-3 h-3 text-zinc-600" />;
            case 'read': return <CheckCheck className="w-3 h-3 text-white" />;
            case 'failed': return <AlertCircle className="w-3 h-3 text-white" />;
            default: return <Clock className="w-3 h-3 text-zinc-600" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#020204] text-white flex flex-col font-sans selection:bg-white/10 overflow-hidden">
            <Navbar />
            {/* Background Decor - Matches Network.tsx */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03),_transparent)] z-0 pointer-events-none" />

            {/* View Profile Modal */}
            <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
                <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[40px] max-w-lg p-0 overflow-hidden gap-0">
                    <div className="h-32 bg-zinc-900/50 w-full relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.05),_transparent)]" />
                    </div>
                    <div className="px-8 pb-8 -mt-12 relative z-10">
                        <div className="flex justify-between items-end mb-6">
                            <Avatar className="w-24 h-24 rounded-[32px] border-4 border-[#020204] shadow-2xl bg-zinc-900">
                                {selectedConversation?.profile_picture_url ? (
                                    <AvatarImage src={selectedConversation.profile_picture_url} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-zinc-800 text-white font-black text-2xl rounded-[32px]">
                                    {getInitials(formatDisplayName(selectedConversation?.patient_name, selectedConversation?.patient_phone))}
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-widest h-9 rounded-xl">
                                Editar Contato
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                                    {formatDisplayName(selectedConversation?.patient_name, selectedConversation?.patient_phone)}
                                </h2>
                                <p className="text-zinc-500 font-medium flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    {selectedConversation?.patient_phone?.replace('@s.whatsapp.net', '')?.replace(/@.*$/, '')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Status</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                        <span className="text-sm font-bold text-zinc-300">Ativo Recentemente</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Classificação</div>
                                    <div className="text-sm font-bold text-zinc-300">Paciente Recorrente</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Histórico</div>
                                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                        <span>Primeiro contato em {format(new Date(), "PP", { locale: ptBR })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                        <span>{messages?.length || 0} mensagens trocadas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="relative z-10 flex-1 flex flex-col pt-20 md:pt-24 px-4 md:px-6 pb-2 max-w-[1800px] mx-auto w-full gap-4">

                {/* Header - Ultra Premium & Monochromatic matches Network.tsx */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Central de Comando
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-4">
                            NeuroZap <span className="opacity-20 text-4xl">.AI</span>
                        </h1>

                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/10 rounded-full">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Sistema Online</span>
                        </div>

                        {/* Simulator Button */}
                        <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-white font-bold text-[10px] uppercase tracking-widest h-11 px-6 rounded-2xl transition-all">
                                    <Bot className="w-4 h-4 mr-2" />
                                    Simular
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[40px] max-w-md p-8">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-2xl font-black tracking-tighter">Simulador de Entrada</DialogTitle>
                                    <DialogDescription className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-2">Ambiente de teste para Inteligência Artificial.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Telefone de Teste</Label>
                                        <Input value={simPhone} onChange={e => setSimPhone(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-5" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mensagem do Paciente</Label>
                                        <Textarea value={simText} onChange={e => setSimText(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-32 resize-none text-white p-5 text-base" />
                                    </div>
                                </div>
                                <DialogFooter className="mt-8">
                                    <Button onClick={handleSimulate} disabled={simulateInbound.isPending} className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs h-12 rounded-xl shadow-2xl shadow-white/5 tracking-widest">
                                        {simulateInbound.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Disparar Simulação"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Settings */}
                        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-white h-11 w-11 rounded-2xl">
                                    <Settings2 className="w-5 h-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[40px] max-w-xl p-8">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-2xl font-black tracking-tighter">Gateway WhatsApp</DialogTitle>
                                    <DialogDescription className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-2">Configuração da infraestrutura de comunicação.</DialogDescription>
                                </DialogHeader>

                                <Tabs defaultValue="managed" className="w-full">
                                    <TabsList className="w-full bg-white/5 p-1 rounded-2xl grid grid-cols-2 mb-8 h-12">
                                        <TabsTrigger value="managed" className="rounded-xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black transition-all h-10">Gerenciado</TabsTrigger>
                                        <TabsTrigger value="custom" className="rounded-xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black transition-all h-10">Custom Server</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="managed" className="mt-0">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden p-2">
                                            <WhatsAppConnectHelper onConnected={() => {
                                                toast.success("Conexão estabelecida! Sincronizando conversas...");
                                                fullSync.mutate();
                                            }} />
                                        </div>

                                        <div className="mt-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="w-4 h-4 text-zinc-500" />
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Ações Avançadas</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => reconfigureWebhook.mutate()}
                                                disabled={reconfigureWebhook.isPending}
                                                className="w-full justify-start h-10 border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-medium"
                                            >
                                                {reconfigureWebhook.isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Settings2 className="w-3.5 h-3.5 mr-2" />}
                                                Reconfigurar Webhook & Eventos
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="custom" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">API Gateway</Label>
                                                <Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.evolution..." className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-5" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Instance ID</Label>
                                                <Input value={instanceName} onChange={e => setInstanceName(e.target.value)} placeholder="NeuroNex" className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-5" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">API Key (Secret)</Label>
                                            <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-5" />
                                        </div>
                                        <Button onClick={handleSaveSettings} className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs h-14 rounded-2xl shadow-2xl shadow-white/5 tracking-widest mt-4">
                                            Salvar Configuração
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </div>
                </motion.div>

                {/* Main Content - Monochromatic Ultra Premium */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 overflow-hidden rounded-[40px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl">

                    {/* Conversations List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "lg:col-span-4 xl:col-span-3 flex flex-col border-r border-white/5 bg-white/[0.01]",
                            showMobileChat ? "hidden lg:flex" : "flex"
                        )}
                    >
                        {/* Search Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                                    <Input
                                        placeholder="Buscar..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-white/[0.03] border-white/5 rounded-2xl h-12 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.05] transition-all font-medium"
                                    />
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => fullSync.mutate()}
                                                disabled={fullSync.isPending}
                                                className="h-12 w-12 rounded-2xl border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-white/20 hover:text-white shrink-0 transition-all"
                                            >
                                                <RefreshCw className={cn("w-4 h-4", fullSync.isPending && "animate-spin")} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-zinc-900 border-white/10">
                                            <p className="text-xs">Sincronizar WhatsApp</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {conversations?.length || 0} conversas
                                </span>
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    {conversations?.filter(c => c.unread_count > 0).length || 0} não lidas
                                </span>
                            </div>
                        </div>

                        {/* Conversations List - Premium Scrollable */}
                        <ScrollArea className="flex-1 h-full pr-1">
                            <div className="p-3 space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {isLoadingConversations ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-12 flex flex-col items-center justify-center gap-3"
                                        >
                                            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                                            <span className="text-xs text-zinc-500 font-medium">Carregando...</span>
                                        </motion.div>
                                    ) : (!currentSettings?.is_active && (!filteredConversations || filteredConversations.length === 0)) ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-8 flex flex-col items-center justify-center gap-4 text-center"
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                                                <AlertCircle className="w-10 h-10 text-zinc-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Instância Offline</h4>
                                                <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                                                    Sua instância do WhatsApp está desconectada.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSettingsOpen(true)}
                                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs gap-2 rounded-xl"
                                            >
                                                <Settings2 className="w-3 h-3" />
                                                Configurar
                                            </Button>
                                        </motion.div>
                                    ) : filteredConversations?.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-8 flex flex-col items-center justify-center gap-4 text-center"
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                                                <MessageCircle className="w-10 h-10 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Nenhuma conversa</h4>
                                                <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                                                    Clique em sincronizar para importar suas conversas.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fullSync.mutate()}
                                                disabled={fullSync.isPending}
                                                className="border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs gap-2 rounded-xl"
                                            >
                                                <CloudDownload className={cn("w-3 h-3", fullSync.isPending && "animate-pulse")} />
                                                {fullSync.isPending ? "Sincronizando..." : "Sincronizar"}
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        filteredConversations?.map((conv) => (
                                            <motion.button
                                                key={conv.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                onClick={() => handleSelectConversation(conv)}
                                                className={cn(
                                                    "w-full p-4 flex items-start gap-4 rounded-[24px] transition-all relative group mb-1",
                                                    selectedConversation?.id === conv.id
                                                        ? "bg-white/[0.08] shadow-xl border border-white/5"
                                                        : "hover:bg-white/[0.02] border border-transparent"
                                                )}
                                            >
                                                {/* Unread Badge */}
                                                {conv.unread_count > 0 && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-4 right-4 px-2 py-0.5 bg-white text-black rounded-lg text-[9px] font-black min-w-[20px] text-center"
                                                    >
                                                        {conv.unread_count}
                                                    </motion.div>
                                                )}

                                                {/* Avatar with liquid glass effect */}
                                                <div className="relative shrink-0">
                                                    <Avatar className="w-14 h-14 rounded-2xl border-2 border-white/10 shadow-xl bg-gradient-to-br from-zinc-700 to-zinc-800">
                                                        {conv.profile_picture_url ? (
                                                            <AvatarImage src={conv.profile_picture_url} className="object-cover rounded-2xl" />
                                                        ) : null}
                                                        <AvatarFallback className="bg-gradient-to-br from-zinc-700 to-zinc-800 text-white font-black text-base rounded-2xl">
                                                            {getInitials(formatDisplayName(conv.patient_name, conv.patient_phone))}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {/* Online indicator - Monochromatic */}
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0a0a0c] flex items-center justify-center border border-white/5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <h4 className={cn(
                                                            "font-bold truncate text-sm tracking-tight",
                                                            conv.unread_count > 0 ? "text-white" : "text-zinc-200"
                                                        )}>
                                                            {formatDisplayName(conv.patient_name, conv.patient_phone)}
                                                        </h4>
                                                        <span className="text-[9px] text-zinc-500 font-semibold shrink-0 uppercase tracking-wider">
                                                            {formatConversationTime(conv.last_message_at)}
                                                        </span>
                                                    </div>

                                                    {/* Phone number - only show if different from name */}
                                                    {conv.patient_phone && !conv.patient_phone.includes('@lid') && (
                                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mb-2 font-medium">
                                                            <Phone className="w-2.5 h-2.5" />
                                                            {conv.patient_phone.replace('@s.whatsapp.net', '').replace(/@.*$/, '')}
                                                        </p>
                                                    )}

                                                    {/* Last message preview */}
                                                    <p className={cn(
                                                        "text-[11px] truncate mb-2",
                                                        conv.unread_count > 0 ? "text-zinc-300 font-semibold" : "text-zinc-500"
                                                    )}>
                                                        {conv.last_message_preview || "Conversa iniciada"}
                                                    </p>

                                                    {/* Labels/Tags - Premium Design */}
                                                    {conv.labels && conv.labels.length > 0 && (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {conv.labels.slice(0, 2).map((label: any, idx: number) => {
                                                                const style = getLabelStyle(label.name);
                                                                return (
                                                                    <span
                                                                        key={idx}
                                                                        className={cn(
                                                                            "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border backdrop-blur-sm",
                                                                            style.bg, style.text, style.border
                                                                        )}
                                                                    >
                                                                        {label.name}
                                                                    </span>
                                                                );
                                                            })}
                                                            {conv.labels.length > 2 && (
                                                                <span className="text-[8px] text-zinc-500 font-bold">+{conv.labels.length - 2}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    </motion.div>

                    {/* Chat Area */}
                    <div className={cn(
                        "lg:col-span-8 xl:col-span-9 flex flex-col relative",
                        !showMobileChat && !selectedConversation ? "hidden lg:flex" : "flex"
                    )}>
                        {!selectedConversation ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col items-center justify-center text-center p-12"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/10">
                                    <MessageSquare className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">Central NeuroZap</h3>
                                <p className="mt-2 text-zinc-500 text-sm max-w-sm">
                                    Selecione uma conversa para visualizar as mensagens e responder seus pacientes.
                                </p>
                                <div className="flex items-center gap-3 mt-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        IA Integrada
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <span className="flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-zinc-500" />
                                        Alta Velocidade
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col h-full overflow-hidden"
                            >
                                {/* Chat Header */}
                                <div className="px-4 py-3 border-b border-white/[0.03] flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        {/* Back button for mobile */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setShowMobileChat(false);
                                                setSelectedConversation(null);
                                            }}
                                            className="lg:hidden h-9 w-9 rounded-lg text-zinc-400 hover:text-white"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>

                                        <Avatar className="w-11 h-11 rounded-xl border-2 border-white/5">
                                            {selectedConversation.profile_picture_url ? (
                                                <AvatarImage src={selectedConversation.profile_picture_url} className="object-cover" />
                                            ) : null}
                                            <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-white font-bold rounded-xl">
                                                {getInitials(formatDisplayName(selectedConversation.patient_name, selectedConversation.patient_phone))}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white text-sm">{formatDisplayName(selectedConversation.patient_name, selectedConversation.patient_phone)}</h3>
                                                <Badge className="bg-white/10 text-zinc-200 border-white/10 text-[9px] font-bold px-1.5 py-0 uppercase tracking-widest">
                                                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                                                    IA
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {selectedConversation.patient_phone.replace('@s.whatsapp.net', '').replace(/@.*$/, '')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => syncMessages.mutate({ remoteJid: selectedConversation.remote_jid })}
                                                        disabled={syncMessages.isPending}
                                                        className="h-9 w-9 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                    >
                                                        <RefreshCw className={cn("w-4 h-4", syncMessages.isPending && "animate-spin")} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-zinc-950 border-white/10 text-xs">
                                                    <p>Atualizar</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-zinc-400 hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 rounded-2xl p-2 w-48">
                                                <DropdownMenuItem onClick={() => setViewProfileOpen(true)} className="text-zinc-300 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-3 mb-1">
                                                    <Info className="w-4 h-4 mr-3" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Ver perfil</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-zinc-300 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-3 mb-1">
                                                    <Star className="w-4 h-4 mr-3" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Favoritar</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                <DropdownMenuItem className="text-zinc-300 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-3">
                                                    <Archive className="w-4 h-4 mr-3" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Arquivar</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Messages Area - Scrollable with Premium Design */}
                                <ScrollArea className="flex-1 h-full px-4 md:px-6 py-4 pr-2">
                                    <div className="max-w-3xl mx-auto space-y-3">
                                        {isLoadingMessages ? (
                                            <div className="flex justify-center py-20">
                                                <Loader2 className="animate-spin w-8 h-8 text-emerald-400" />
                                            </div>
                                        ) : (
                                            Object.entries(groupedMessages || {}).map(([date, dayMessages]) => (
                                                <div key={date}>
                                                    {/* Date Separator - Premium */}
                                                    <div className="flex items-center justify-center my-8">
                                                        <span className="px-5 py-2 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 text-[10px] text-zinc-400 uppercase font-black tracking-[0.15em] shadow-lg backdrop-blur-xl">
                                                            {formatMessageDate(new Date(date))}
                                                        </span>
                                                    </div>

                                                    {/* Messages */}
                                                    {dayMessages.map((msg) => (
                                                        <motion.div
                                                            key={msg.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={cn(
                                                                "flex w-full mb-3",
                                                                msg.direction === 'outbound' ? "justify-end" : "justify-start"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "px-5 py-3 rounded-3xl text-sm max-w-[75%] md:max-w-[65%] relative group",
                                                                msg.direction === 'outbound'
                                                                    ? "bg-white text-black rounded-br-none shadow-xl border-none"
                                                                    : "bg-white/[0.05] backdrop-blur-md border border-white/5 text-zinc-100 rounded-bl-none shadow-sm"
                                                            )}>
                                                                {/* AI indicator */}
                                                                {msg.is_from_ai && msg.direction === 'outbound' && (
                                                                    <div className="flex items-center gap-1.5 mb-2 opacity-90">
                                                                        <CheckCheck className="w-3 h-3 text-white" />
                                                                        <span className="text-[9px] uppercase font-black tracking-widest">Resposta IA</span>
                                                                    </div>
                                                                )}

                                                                {/* Message Content */}
                                                                <MediaMessage
                                                                    contentType={msg.content_type}
                                                                    content={msg.content}
                                                                    mediaBase64={msg.media_base64}
                                                                    mediaMimetype={msg.media_mimetype}
                                                                    mediaFilename={msg.media_filename}
                                                                    direction={msg.direction}
                                                                />

                                                                {/* Time and Status */}
                                                                <div className={cn(
                                                                    "flex items-center gap-1.5 mt-2",
                                                                    msg.direction === 'outbound' ? "justify-end" : "justify-start"
                                                                )}>
                                                                    <span className={cn(
                                                                        "text-[9px] font-semibold",
                                                                        msg.direction === 'outbound' ? "text-[#0a0a0c]/60" : "text-zinc-500"
                                                                    )}>
                                                                        {format(new Date(msg.created_at), 'HH:mm')}
                                                                    </span>
                                                                    <MessageStatus status={msg.status} direction={msg.direction} />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>

                                {/* Input Area */}
                                <div className="p-4 bg-gradient-to-t from-[#0c0c0f] to-transparent border-t border-white/[0.03]">
                                    <div className="max-w-3xl mx-auto">
                                        {/* AI Toggle */}
                                        <div className="flex items-center justify-end mb-3">
                                            <label className={cn(
                                                "flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl transition-all",
                                                triggerAI
                                                    ? "bg-white/10 border border-white/20"
                                                    : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={triggerAI}
                                                    onChange={e => setTriggerAI(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative",
                                                    triggerAI
                                                        ? "bg-white"
                                                        : "bg-zinc-800"
                                                )}>
                                                    <div className={cn(
                                                        "absolute w-4 h-4 rounded-full transition-all shadow-md top-0.5",
                                                        triggerAI ? "bg-black translate-x-[22px]" : "bg-zinc-500 translate-x-0.5"
                                                    )} />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className={cn(
                                                        "w-3.5 h-3.5 transition-colors",
                                                        triggerAI ? "text-white" : "text-zinc-500"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[11px] font-semibold transition-colors",
                                                        triggerAI ? "text-white" : "text-zinc-500"
                                                    )}>
                                                        {triggerAI ? "IA Responderá" : "Modo Manual"}
                                                    </span>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="flex gap-2 items-end">
                                            {/* Attachment */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                accept="image/*,audio/*,.pdf,.doc,.docx"
                                                className="hidden"
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/5"
                                                    >
                                                        <Paperclip className="w-5 h-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="bg-zinc-900 border-white/10 rounded-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.accept = 'image/*';
                                                                fileInputRef.current.click();
                                                            }
                                                        }}
                                                        className="text-zinc-300 focus:bg-white/5 rounded-lg"
                                                    >
                                                        <ImageIcon className="w-4 h-4 mr-2 text-white" />
                                                        Imagem
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.accept = '.pdf,.doc,.docx';
                                                                fileInputRef.current.click();
                                                            }
                                                        }}
                                                        className="text-zinc-300 focus:bg-white/5 rounded-lg"
                                                    >
                                                        <Paperclip className="w-4 h-4 mr-2 text-zinc-400" />
                                                        Documento
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* Text Input */}
                                            <div className="flex-1 relative">
                                                <textarea
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    onKeyDown={handleKeyPress}
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white resize-none h-12 min-h-[48px] max-h-32 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all placeholder:text-zinc-600"
                                                    placeholder="Digite sua mensagem..."
                                                    rows={1}
                                                />
                                            </div>

                                            {/* Send Button */}
                                            <Button
                                                onClick={handleSend}
                                                disabled={sendMessage.isPending || !replyText.trim()}
                                                className="h-12 w-12 bg-white hover:bg-zinc-200 text-black rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                                            >
                                                {sendMessage.isPending ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppAgent;
