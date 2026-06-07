import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Linkedin, Twitter, Youtube, Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export const Footer = () => {
  const navigate = useNavigate();

  const footerLinks: Record<string, Array<{ label: string; path: string }>> = {
    produto: [
      { label: "Central de Ajuda", path: "/help" },
    ],
    empresa: [],
    legal: []
  };

  return (
    <footer className="relative pt-32 pb-16 bg-background overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="absolute -bottom-64 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-24">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center cursor-pointer group/logo"
              onClick={() => navigate('/')}
            >
              <div className="relative w-8 h-8 flex items-center justify-center">
                <Logo className="w-full h-full" />
                <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite] opacity-0 group-hover/logo:opacity-100 transition-opacity" />
              </div>
              <span className="ml-3 text-sm font-black text-foreground tracking-[0.4em] uppercase whitespace-nowrap">NeuroNex</span>
            </motion.div>
            
            <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-xs">
              Redefinindo o futuro da psicologia com inteligência artificial, voz e tecnologia de ponta.
            </p>

            <div className="flex items-center gap-4">
              {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Produto</h4>
            <ul className="space-y-4">
              {footerLinks.produto.map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Empresa</h4>
            <ul className="space-y-4">
              {footerLinks.empresa.map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Jurídico</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div className="lg:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Suporte</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail size={14} className="text-primary/50" />
                <span>contato@neuronexai.com.br</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone size={14} className="text-primary/50" />
                <span>+55 (47) 98873-0611</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <MapPin size={14} className="text-primary/50 mt-1 shrink-0" />
                <span>Thera Faria Lima, 215 - Pinheiros SP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] font-medium text-muted-foreground/50 tracking-wider">
            2026 © NEURONEX AI LTDA. TODOS OS DIREITOS RESERVADOS.
          </p>
          <div className="flex items-center gap-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistemas Operacionais
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
