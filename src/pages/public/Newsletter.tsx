import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#000000', '#ffffff', '#808080']
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden font-sans selection:bg-primary/10 flex flex-col">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20">
        <Starfield />
      </div>

      <main className="flex-1 flex items-center justify-center relative px-6 py-48">
        <div className="premium-noise opacity-[0.015]" />

        {/* Monochromatic Atmospheric Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-foreground/[0.03] rounded-full blur-[180px] pointer-events-none mix-blend-overlay" />

        <div className="w-full max-w-[700px] relative z-10">
          <FadeIn>
            <div className="relative p-[0.5px] rounded-[56px] bg-border/40 hover:bg-foreground/20 transition-all duration-700 gpu-accelerated shadow-[0_64px_128px_-32px_rgba(0,0,0,0.2)]">
              <div className="relative bg-card/60 backdrop-blur-[40px] rounded-[55.5px] p-12 md:p-20 border border-border/20 text-center overflow-hidden">
                <div className="premium-noise opacity-[0.025]" />

                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="py-12"
                    >
                      <div className="w-24 h-24 bg-foreground/[0.03] rounded-full flex items-center justify-center mx-auto mb-10 border border-border/40 shadow-premium">
                        <CheckCircle2 className="w-12 h-12 text-foreground/60" />
                      </div>
                      <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">Sincronia Estabelecida</h2>
                      <p className="text-xl text-muted-foreground/60 max-w-sm mx-auto mb-12 font-medium tracking-tight">
                        Você agora faz parte do <span className="text-foreground">The Synapse</span>. A inteligência clínica semanal será entregue no seu ID.
                      </p>
                      <Button variant="outline" onClick={() => setStatus('idle')} className="h-14 rounded-full px-10 border-border/40 hover:bg-foreground/5 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
                        Reset Terminal
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-foreground/[0.03] border border-border/30 mb-8 shadow-premium group transition-all duration-700 hover:scale-110">
                        <Mail className="w-8 h-8 text-foreground/40 group-hover:text-foreground transition-colors" />
                      </div>

                      <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.05em] text-foreground leading-none">
                          The Synapse.
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground/60 font-medium leading-tight tracking-tight max-w-lg mx-auto">
                          O canal de alta frequência onde a elite da psicologia encontra estratégias reais de gestão e tecnologia.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="relative max-w-md mx-auto group">
                        <div className="absolute inset-0 bg-foreground/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-40 transition-opacity duration-700" />

                        <div className="relative flex items-center bg-foreground/[0.02] border border-border/40 rounded-full p-2.5 focus-within:border-foreground/30 transition-all shadow-2xl group-focus-within:bg-foreground/[0.05]">
                          <div className="pl-6 pr-3 text-muted-foreground/40 font-black">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <Input
                            type="email"
                            placeholder="Seu ID de Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-none bg-transparent focus-visible:ring-0 h-14 text-lg font-medium placeholder:text-muted-foreground/30 text-foreground"
                            required
                          />
                          <Button
                            type="submit"
                            disabled={status === 'loading'}
                            className="rounded-full h-14 w-14 flex items-center justify-center bg-foreground text-background hover:opacity-90 font-black transition-all hover:scale-105 active:scale-95 shadow-xl"
                          >
                            {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground/30 mt-8 uppercase tracking-[0.4em] font-black">
                          ZERO NOISE. UNLIMITED INSIGHTS.
                        </p>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </FadeIn>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Newsletter;