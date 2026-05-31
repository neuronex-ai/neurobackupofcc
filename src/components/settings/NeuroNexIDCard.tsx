import { motion } from "framer-motion";
import { ShieldCheck, Fingerprint, CheckCircle, QrCode, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NeuroNexIDCardProps {
    profile: any;
}

export const NeuroNexIDCard = ({ profile }: NeuroNexIDCardProps) => {
    const plan = profile?.subscription_plan || 'Professional';
    const qrData = `https://neuronex.site/id/${profile?.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=300x300&bgcolor=ffffff&color=0a0a0b&format=svg`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(qrData);
        toast.success("Link copiado!");
    };

    return (
        <div className="flex flex-col items-center gap-10 py-12 w-full h-full justify-center">
            <div className="text-center space-y-3 z-10">
                <motion.h3
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="text-2xl font-black text-zinc-950 dark:text-white tracking-[0.2em] uppercase drop-shadow-lg"
                >
                    NEURONEX ID
                </motion.h3>
                <div className="flex items-center gap-3 justify-center">
                    <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-800" />
                    <p className="text-[9px] text-zinc-500 uppercase tracking-[0.4em] font-black">Digital Access Protocol</p>
                    <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-800" />
                </div>
            </div>

            <div className="relative group">
                {/* Outer Glow for Premium Feel */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div
                    className={cn(
                        "relative w-[340px] h-[520px] rounded-[48px] p-10 overflow-hidden border transition-all duration-700 backdrop-blur-3xl",
                        "bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-2xl"
                    )}
                >
                    {/* Content Component */}
                    <div className="relative h-full flex flex-col justify-between">

                        {/* Header: Auth Node (Fingerprint) */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black text-zinc-950 dark:text-white/90 uppercase tracking-[0.3em] drop-shadow-md flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    Auth Secure
                                </h3>
                                <div className="flex gap-1.5 opacity-20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-white" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-white" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-white" />
                                </div>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 backdrop-blur-xl">
                                <Fingerprint className={cn("w-5 h-5", plan === 'Enterprise' ? "text-zinc-700 dark:text-white" : "text-zinc-950/40 dark:text-white/40")} />
                            </div>
                        </div>

                        {/* Profile Area */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative group/avatar">
                                <div className="p-1 rounded-[45px] bg-gradient-to-br from-black/10 dark:from-white/20 via-transparent dark:via-white/5 to-transparent shadow-2xl">
                                    <Avatar className="h-[150px] w-[150px] border-[6px] border-white dark:border-zinc-950 shadow-inner rounded-[40px] transition-all duration-700">
                                        <AvatarImage src={profile?.avatar_url} className="object-cover" />
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-black text-5xl tracking-tighter">
                                            {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {/* Verified Seal */}
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 shadow-2xl border-2 border-white dark:border-black flex items-center justify-center rounded-full backdrop-blur-3xl transition-transform group-hover/avatar:scale-110">
                                    <CheckCircle className="w-4 h-4 text-white fill-white" />
                                </div>
                            </div>

                            <div className="space-y-3 text-center">
                                <h4 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase leading-none drop-shadow-sm">
                                    {profile?.first_name} {profile?.last_name}
                                </h4>
                                <div className="px-5 py-2 rounded-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 inline-block backdrop-blur-md">
                                    <p className="text-[9px] text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.4em] font-black">{profile?.crp || 'UNAUTHORIZED NODE'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer / QR / Badge */}
                        <div className="flex items-end justify-between pt-6">
                            <div className="space-y-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="p-1.5 bg-white rounded-xl shadow-xl transition-all w-[64px] h-[64px] flex items-center justify-center cursor-pointer hover:scale-[1.05] active:scale-[0.98] border border-zinc-100 dark:border-zinc-800">
                                            <img
                                                src={qrUrl}
                                                alt="QR Code"
                                                className="w-full h-full object-contain rounded-lg"
                                            />
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950/95 backdrop-blur-[80px] border-white/[0.08] sm:max-w-[400px] p-0 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
                                        {/* Top highlight */}
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                        <div className="flex flex-col items-center p-8 space-y-6">
                                            {/* Header */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                                                    <QrCode className="w-5 h-5 text-white/60" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-white">NeuroNex ID</h4>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-medium">
                                                        Digital Access Protocol
                                                    </p>
                                                </div>
                                            </div>

                                            {/* QR Code Container */}
                                            <div className="relative group">
                                                <div className="absolute -inset-3 bg-white/10 blur-[30px] rounded-full opacity-50" />
                                                <div className="relative p-4 bg-white rounded-[20px] shadow-2xl shadow-white/5">
                                                    <img
                                                        src={qrUrl}
                                                        alt="QR Code Expanded"
                                                        className="w-56 h-56 object-contain"
                                                    />
                                                </div>
                                            </div>

                                            {/* Profile Info */}
                                            <div className="text-center space-y-1">
                                                <p className="text-lg font-bold text-white">
                                                    {profile?.first_name} {profile?.last_name}
                                                </p>
                                                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                                                    {profile?.crp || 'Profissional Verificado'}
                                                </p>
                                            </div>

                                            {/* URL Display */}
                                            <div className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                <p className="text-[11px] text-white/50 text-center break-all font-mono">
                                                    {qrData}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 w-full">
                                                <Button
                                                    variant="outline"
                                                    onClick={copyToClipboard}
                                                    className="flex-1 h-11 rounded-xl border-white/[0.08] text-white hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-[0.1em]"
                                                >
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Copiar Link
                                                </Button>
                                                <Button
                                                    onClick={() => window.open(qrData, '_blank')}
                                                    className="flex-1 h-11 rounded-xl bg-white text-black hover:bg-white/90 text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-white/5"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Abrir Perfil
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">Protocol Version</p>
                                    <p className="text-[10px] font-mono font-bold text-zinc-950/40 dark:text-white/40 italic tracking-wider">v2.4.0-ID</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-5">
                                <div className={cn(
                                    "px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-2xl shadow-xl transition-all",
                                    plan === 'Enterprise' ? "bg-zinc-800/80 border-zinc-700/30 text-white shadow-black/20" :
                                        plan === 'Professional' ? "bg-black/5 dark:bg-white/[0.03] border-black/10 dark:border-white/10 text-zinc-950 dark:text-white shadow-black/5" :
                                            "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700/30 text-zinc-600 dark:text-zinc-400"
                                )}>
                                    {plan} TIER
                                </div>
                                <div className="text-right">
                                    <p className="text-[7px] font-black text-zinc-500 dark:text-zinc-700 uppercase tracking-widest mb-1">Established</p>
                                    <p className="text-lg font-black text-zinc-950 dark:text-white tracking-tighter drop-shadow-sm">2024</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <p className="text-[9px] text-zinc-500 dark:text-zinc-600 max-w-[280px] text-center font-bold tracking-[0.2em] uppercase leading-relaxed transition-colors group-hover:text-zinc-800 dark:group-hover:text-zinc-400">
                    ID Bio-Digital certificado pela rede <span className="text-zinc-400 dark:text-zinc-500">NeuroNex Bank</span>. Acesso intransferível e criptografado.
                </p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full" />
            </div>
        </div>
    );
};