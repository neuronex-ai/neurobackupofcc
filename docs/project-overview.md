# NeuroNex — Resumo Técnico do Projeto

> **Gerado em:** 2026-02-20  
> **Objetivo:** Análise técnica de dependências, estrutura e implementação.

---

## 1. Versão do Node.js

```
v22.20.0
```

---

## 2. Conteúdo Completo do `package.json`

```json
{
  "name": "neuronex-desktop",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "dist-electron/main.cjs",
  "description": "NeuroNex Desktop — Gestão Inteligente para Psicólogos",
  "author": "NeuroNex",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "electron:dev": "concurrently -k \"vite\" \"wait-on http://localhost:8080 && npx tsc -p tsconfig.electron.json && node scripts/rename-cjs.cjs && electron .\"",
    "electron:preview": "vite build && npx tsc -p tsconfig.electron.json && node scripts/rename-cjs.cjs && electron .",
    "electron:build": "vite build && npx tsc -p tsconfig.electron.json && node scripts/rename-cjs.cjs && electron-builder --win --config electron-builder.json5"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@fullcalendar/core": "^6.1.19",
    "@fullcalendar/daygrid": "^6.1.19",
    "@fullcalendar/interaction": "^6.1.19",
    "@fullcalendar/list": "^6.1.19",
    "@fullcalendar/react": "^6.1.19",
    "@fullcalendar/timegrid": "^6.1.19",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@radix-ui/react-visually-hidden": "^1.2.4",
    "@react-pdf/renderer": "^4.3.1",
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.4.2",
    "@react-three/postprocessing": "^3.0.4",
    "@stripe/react-stripe-js": "^5.3.0",
    "@stripe/stripe-js": "^8.4.0",
    "@supabase/auth-ui-react": "^0.4.7",
    "@supabase/auth-ui-shared": "^0.1.8",
    "@supabase/supabase-js": "^2.76.1",
    "@tanstack/react-query": "^5.83.0",
    "@tiptap/core": "^2.27.1",
    "@tiptap/extension-bubble-menu": "^2.4.0",
    "@tiptap/extension-character-count": "^2.27.1",
    "@tiptap/extension-code-block-lowlight": "^2.27.1",
    "@tiptap/extension-color": "^2.27.1",
    "@tiptap/extension-highlight": "^2.27.1",
    "@tiptap/extension-image": "^2.27.1",
    "@tiptap/extension-link": "^2.27.1",
    "@tiptap/extension-mention": "^2.27.1",
    "@tiptap/extension-placeholder": "^2.4.0",
    "@tiptap/extension-subscript": "^2.27.1",
    "@tiptap/extension-superscript": "^2.27.1",
    "@tiptap/extension-table": "^2.27.1",
    "@tiptap/extension-table-cell": "^2.27.1",
    "@tiptap/extension-table-header": "^2.27.1",
    "@tiptap/extension-table-row": "^2.27.1",
    "@tiptap/extension-task-item": "^2.27.1",
    "@tiptap/extension-task-list": "^2.27.1",
    "@tiptap/extension-text-align": "^2.27.1",
    "@tiptap/extension-text-style": "^2.27.1",
    "@tiptap/extension-typography": "^2.27.1",
    "@tiptap/extension-underline": "^2.27.1",
    "@tiptap/react": "^2.4.0",
    "@tiptap/starter-kit": "^2.4.0",
    "@tiptap/suggestion": "^2.27.1",
    "@types/d3-force": "^3.0.10",
    "@types/react-map-gl": "^6.1.7",
    "@types/react-webcam": "^3.0.0",
    "@types/three": "^0.181.0",
    "axios": "^1.13.2",
    "bcrypt": "^6.0.0",
    "canvas-confetti": "^1.9.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "cobe": "^0.6.5",
    "d3-force": "^3.0.0",
    "date-fns": "^3.6.0",
    "electron-updater": "^6.7.3",
    "embla-carousel": "^8.6.0",
    "embla-carousel-autoplay": "^8.6.0",
    "embla-carousel-react": "^8.6.0",
    "emoji-picker-react": "^4.17.2",
    "framer-motion": "^12.23.25",
    "html2canvas": "^1.4.1",
    "input-otp": "^1.4.2",
    "jose": "^6.1.3",
    "lenis": "^1.3.15",
    "lowlight": "^3.3.0",
    "lucide-react": "^0.462.0",
    "mammoth": "^1.11.0",
    "mapbox-gl": "^3.15.0",
    "mermaid": "^11.12.2",
    "next-themes": "^0.3.0",
    "postprocessing": "^6.38.0",
    "prismjs": "^1.30.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-force-graph-2d": "^1.29.0",
    "react-hook-form": "^7.61.1",
    "react-joyride": "^2.9.3",
    "react-map-gl": "^8.1.0",
    "react-markdown": "^10.1.0",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "react-syntax-highlighter": "^16.1.0",
    "react-webcam": "^7.2.0",
    "react-zoom-pan-pinch": "^3.7.0",
    "reactflow": "^11.11.4",
    "recharts": "^2.15.4",
    "socket.io-client": "^4.8.3",
    "sonner": "^1.7.4",
    "stripe": "^20.0.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "three": "^0.181.1",
    "tippy.js": "^6.3.7",
    "uuid": "^13.0.0",
    "vaul": "^0.9.9",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@dyad-sh/react-vite-component-tagger": "^0.8.0",
    "@eslint/js": "^9.32.0",
    "@tailwindcss/typography": "^0.5.16",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "concurrently": "^9.1.2",
    "electron": "^33.4.11",
    "electron-builder": "^25.1.8",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "vite": "^5.4.19",
    "vitest": "^4.0.18",
    "wait-on": "^8.0.3"
  }
}
```

---

## 3. Estrutura de Pastas Principal

```
neuronex-v1/
├── public/
│   ├── download/
│   ├── images/
│   ├── favicon-dark.ico
│   ├── favicon-dark.png
│   ├── favicon-light.ico
│   ├── favicon-light.png
│   ├── favicon.png
│   ├── manifest.json
│   ├── neuro-logo.png
│   ├── placeholder.svg
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── components/
│   │   ├── agenda/          # Módulo de agendamento
│   │   ├── ai-chat/         # Chat com IA (Synapse AI)
│   │   ├── animations/      # Componentes de animação
│   │   ├── auth/            # Autenticação (login, registro, proteção de rotas)
│   │   ├── clinic/          # Gestão de clínica
│   │   ├── dashboard/       # Painel principal
│   │   ├── electron/        # Componentes Electron (TitleBar, UpdateManager)
│   │   ├── financeiro/      # Módulo financeiro / NeuroBank
│   │   ├── icons/           # Ícones customizados
│   │   ├── integrations/    # Integrações externas
│   │   ├── landing/         # Landing page (inclui visuais 3D e globo)  ← COMPONENTES 3D
│   │   ├── layout/          # Layout geral (sidebar, header, scroll)
│   │   ├── network/         # Grafo de rede neural / conexões
│   │   ├── notes/           # Notas clínicas e editor TipTap
│   │   ├── onboarding/      # Onboarding / tour guiado
│   │   ├── patient-portal/  # Portal do paciente
│   │   ├── patients/        # Gestão de pacientes
│   │   ├── reports/         # Relatórios
│   │   ├── settings/        # Configurações e ajustes
│   │   ├── setup-wizard/    # Wizard de configuração inicial
│   │   ├── subscription/    # Planos e assinaturas
│   │   ├── teleconsulta/    # Teleconsulta / videochamada
│   │   ├── theme/           # Tema (dark/light)
│   │   ├── ui/              # Componentes UI base (shadcn/radix)
│   │   ├── utils/           # Utilitários visuais
│   │   └── whatsapp/        # Integração WhatsApp
│   │
│   ├── context/             # React Contexts (AI, Subscription)
│   ├── data/                # Dados estáticos / mock
│   ├── hooks/               # Custom React Hooks (130 arquivos)
│   ├── integrations/        # Clientes de integração (Supabase)
│   ├── lib/                 # Utilitários (utils, electron helpers)
│   ├── mobile/              # Componentes mobile (Capacitor)
│   ├── pages/               # Páginas da aplicação (46 arquivos)
│   ├── styles/              # Estilos globais e design tokens
│   └── types/               # Definições TypeScript
│
├── electron/                # Código do processo principal Electron
├── supabase/                # Migrations e configurações Supabase
├── scripts/                 # Scripts de build auxiliares
├── android/                 # Projeto Android (Capacitor)
├── ios/                     # Projeto iOS (Capacitor)
└── docs/                    # Documentação do projeto
```

---

## 4. Exemplo de Componente 3D — `InteractiveGlobe.tsx`

Este componente renderiza um globo 3D interativo na landing page usando a biblioteca **cobe** com animações **framer-motion**:

```tsx
// src/components/landing/InteractiveGlobe.tsx

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { useSpring, useMotionValue } from "framer-motion";

export function InteractiveGlobe({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsLight(document.documentElement.classList.contains("light"));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const r = useMotionValue(0);
    const springR = useSpring(r, {
        stiffness: 280,
        damping: 80,
        mass: 1.2
    });

    useEffect(() => {
        let phi = 4.5;
        let width = 0;
        if (canvasRef.current) {
            width = canvasRef.current.offsetWidth;
        }

        const globe = createGlobe(canvasRef.current!, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 4.5,
            theta: 0.4,
            dark: isLight ? 0 : 1,
            diffuse: 3,
            mapSamples: 10000,
            mapBrightness: isLight ? 0.3 : 12,
            baseColor: isLight ? [0, 0, 0] : [0.21, 0.21, 0.21],
            markerColor: [0, 0.5, 1],
            glowColor: isLight ? [0.1, 0.1, 0.1] : [0.43, 0.43, 0.43],
            opacity: 1,
            markers: [
                { location: [-23.5505, -46.6333], size: 0.1 }, // São Paulo
                { location: [40.7128, -74.0060], size: 0.1 },  // NY
                { location: [51.5074, -0.1278], size: 0.1 },   // London
                { location: [35.6762, 139.6503], size: 0.1 },  // Tokyo
                { location: [-33.8688, 151.2093], size: 0.1 }, // Sydney
                { location: [25.2048, 55.2708], size: 0.1 },   // Dubai
            ],
            onRender: (state) => {
                phi += 0.003;
                state.phi = phi + springR.get();
                if (canvasRef.current) {
                    state.width = canvasRef.current.offsetWidth * 2;
                    state.height = canvasRef.current.offsetHeight * 2;
                }
            },
        });

        setTimeout(() => canvasRef.current && (canvasRef.current.style.opacity = '1'));

        return () => {
            globe.destroy();
        }
    }, [isLight]);

    return (
        <div className={`w-full h-full relative flex items-center justify-center ${className} gpu-accelerated`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain transition-opacity duration-1500 ease-in-out"
                style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'grab',
                    contain: 'layout paint size',
                    opacity: 0,
                }}
                onPointerDown={(e) => {
                    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
                    canvasRef.current!.style.cursor = 'grabbing';
                }}
                onPointerUp={() => {
                    pointerInteracting.current = null;
                    canvasRef.current!.style.cursor = 'grab';
                }}
                onPointerOut={() => {
                    pointerInteracting.current = null;
                    canvasRef.current!.style.cursor = 'grab';
                }}
                onMouseMove={(e) => {
                    if (pointerInteracting.current !== null) {
                        const delta = e.clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        r.set(delta / 300);
                    }
                }}
                onTouchMove={(e) => {
                    if (pointerInteracting.current !== null && e.touches[0]) {
                        const delta = e.touches[0].clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        r.set(delta / 150);
                    }
                }}
            />
        </div>
    );
}
```

---

## 5. Exemplo de Componente Visual 3D — `Feature3DVisuals.tsx` (trecho)

Este arquivo contém visuais com efeitos 3D via CSS `perspective` e animações **framer-motion** (dashboard mockup, cartão NeuroBank, brain visual, grafo de conexões):

```tsx
// src/components/landing/Feature3DVisuals.tsx (trecho — Scene3D wrapper + DashboardVisual)

import { motion } from "framer-motion";
import { LayoutDashboard, Users, TrendingUp, Brain, Zap, Globe, Database, Cloud, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Scene3D = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "relative w-full h-full flex items-center justify-center perspective-[1200px] overflow-visible gpu-accelerated",
        className
    )}>
        {children}
    </div>
);

export const DashboardVisual = () => (
    <Scene3D>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[480px] aspect-[16/10] bg-card/60 backdrop-blur-[30px] 
                       border border-border/30 rounded-2xl shadow-premium overflow-hidden flex flex-col group"
        >
            {/* ... conteúdo do dashboard mockup com barras animadas ... */}
        </motion.div>
    </Scene3D>
);

// Outros visuais exportados: NeuroBankCardVisual, AIBrainVisual,
// ConnectivityOrbVisual, PatientsVisual, NeuroSystemsVisual
```

**Componentes visuais 3D exportados neste arquivo:**
| Componente | Descrição |
|---|---|
| `DashboardVisual` | Mockup animado do painel com gráfico de barras |
| `NeuroBankCardVisual` | Cartão de crédito NeuroBank com perspectiva 3D |
| `AIBrainVisual` | Cérebro IA com órbitas rotativas animadas |
| `ConnectivityOrbVisual` | Orbe central com nós de conectividade flutuantes |
| `PatientsVisual` | Cards de pacientes empilhados com profundidade |
| `NeuroSystemsVisual` | Grafo neural interativo com partículas animadas via SVG |

---

## 6. Stack Técnica Resumida

| Camada | Tecnologia | Versão |
|---|---|---|
| **Runtime** | Node.js | v22.20.0 |
| **Linguagem** | TypeScript | ^5.8.3 |
| **Framework** | React | ^18.3.1 |
| **Bundler** | Vite | ^5.4.19 |
| **Desktop** | Electron | ^33.4.11 |
| **Mobile** | Capacitor | (configurado) |
| **CSS** | TailwindCSS | ^3.4.17 |
| **Componentes UI** | Radix UI / shadcn | múltiplos |
| **3D / Visuais** | three.js, cobe, framer-motion | ^0.181.1, ^0.6.5, ^12.23.25 |
| **Backend** | Supabase | ^2.76.1 |
| **Pagamentos** | Stripe | ^20.0.0 |
| **Editor de texto** | TipTap | ^2.27.1 |
| **Gráficos** | Recharts, ReactFlow | ^2.15.4, ^11.11.4 |
| **Mapas** | Mapbox GL, react-map-gl | ^3.15.0, ^8.1.0 |
