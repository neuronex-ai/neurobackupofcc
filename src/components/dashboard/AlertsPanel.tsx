import { Button } from "@/components/ui/button";
import { useDashboardAlerts } from "@/hooks/use-dashboard-alerts";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle, Info, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const AlertsPanel = () => {
  const { data: alertsData, isLoading } = useDashboardAlerts();
  const navigate = useNavigate();
  const [visibleAlerts, setVisibleAlerts] = useState<any[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (alertsData) {
      const dismissed = JSON.parse(sessionStorage.getItem('dismissed_alerts') || '[]');
      setVisibleAlerts(alertsData.filter((a: any) => !dismissed.includes(a.id)));
    }
  }, [alertsData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('dismissed_alerts');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleClearAll = async () => {
    if (visibleAlerts.length === 0) return;

    try {
      const currentIds = visibleAlerts.map(a => a.id);
      const dismissed = JSON.parse(sessionStorage.getItem('dismissed_alerts') || '[]');
      const newDismissed = [...dismissed, ...currentIds];
      sessionStorage.setItem('dismissed_alerts', JSON.stringify(newDismissed));
      setVisibleAlerts([]);
      toast.success("Notificações limpas com sucesso");
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error("Erro ao limpar notificações");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'destructive': return AlertCircle;
      case 'info': default: return Info;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Header ajustado para ser integrado ao Drawer no mobile */}
      <div className={cn(
        "flex items-center justify-between px-6 border-border/5 z-20",
        isMobile ? "py-2 mb-4" : "py-4 border-b bg-background/80 backdrop-blur-xl sticky top-0"
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          <span className="text-[10px] font-black text-foreground/80 tracking-[0.3em] uppercase">Notificações</span>
        </div>
        {visibleAlerts.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearAll}
            className="h-8 px-4 text-[10px] text-zinc-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest font-bold rounded-full transition-all border border-transparent hover:border-border/10"
          >
            Limpar tudo
          </Button>
        )}
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto custom-scrollbar space-y-4",
        isMobile ? "px-6 pb-20" : "p-4"
      )}>
        <AnimatePresence mode="popLayout">
          {visibleAlerts.length > 0 ? (
            visibleAlerts.map((alert, index) => {
              const Icon = getIcon(alert.type);

              return (
                <motion.div
                  key={alert.id}
                  layout
                  custom={index}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  className="group relative p-5 rounded-[32px] border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#121214] shadow-sm hover:shadow-md dark:shadow-none transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    <div className={cn(
                      "p-3.5 rounded-full border border-border/5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner",
                      alert.type === 'destructive' ? 'bg-red-500/10' : 'bg-secondary/30'
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        alert.type === 'destructive' ? 'text-red-500' : 'text-foreground/70'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start gap-4 mb-2.5">
                        <p className="text-[13px] font-bold text-foreground leading-tight tracking-tight">{alert.title}</p>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider whitespace-nowrap bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-full border border-border/10">
                          {alert.time}
                        </span>
                      </div>

                      <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium mb-5">
                        {alert.message}
                      </p>

                      {alert.actionLink && (
                        <div className="flex justify-start">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-5 text-[10px] font-black uppercase tracking-[0.15em] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-none hover:opacity-90 rounded-full transition-all group/btn shadow-lg dark:shadow-white/5"
                            onClick={() => {
                              navigate(alert.actionLink!);
                            }}
                          >
                            Resolver <ArrowRight className="h-3 w-3 ml-2 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-center border border-zinc-200 dark:border-white/5 shadow-2xl relative">
                <Shield className="h-10 w-10 text-zinc-300 dark:text-zinc-700" strokeWidth={1} />
                <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping duration-[3000ms]" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em]">Zero Alertas</p>
                <p className="text-xs text-zinc-500 font-medium max-w-[200px] leading-relaxed">Seu painel de controle está limpo e seguro no momento.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};