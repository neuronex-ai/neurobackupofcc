# Página /funcionalidades — Blueprint de Implementação

> Documento de referência para criação da página pública de funcionalidades do NeuroNex.
> Tudo que o visitante precisa ver antes de se cadastrar.

---

## Objetivo

Criar uma página pública (`/funcionalidades`) que apresente todas as funcionalidades do NeuroNex de forma visual, navegável e persuasiva. O visitante deve entender o valor completo da plataforma sem precisar criar conta.

---

## Onde linkar

1. **Navbar da Landing Page** — Adicionar "Funcionalidades" no array `navItems` de `Navbar.tsx`
2. **Footer** — Substituir o link `"Funcionalidades": "/#vision"` por `"/funcionalidades"` em `Footer.tsx`
3. **Botões de "Explorar" no EcosystemShowcase** — Os cards já têm botões que podem apontar para `/funcionalidades#seção`
4. **Hero** — CTA secundário "Explorar Funcionalidades"

---

## Estrutura da Página

### Seção 0 — Hero
- **Título:** "Tudo que o NeuroNex faz por você"
- **Subtítulo:** "Cada funcionalidade foi desenhada para a rotina real do psicólogo. Sem complicação, sem excesso."
- **CTA:** "Começar Agora" (→ `/auth`) + "Explorar Abaixo" (scroll suave)
- **Visual:** Animação sutil com partículas ou gradiente cinético

### Seção 1 — Dashboard
- **Âncora:** `#dashboard`
- **Conteúdo:** Extraído de `02-dashboard.md`
- **Visual sugerido:** Mockup/screenshot do dashboard real ou visual abstrato representando dados

### Seção 2 — Agenda
- **Âncora:** `#agenda`
- **Conteúdo:** Extraído de `03-agenda.md`
- **Visual sugerido:** Calendário animado com transição entre visões

### Seção 3 — Pacientes & Prontuário
- **Âncora:** `#pacientes`
- **Conteúdo:** Extraído de `04-pacientes.md`
- **Visual sugerido:** Card de paciente com sub-abas animadas

### Seção 4 — NeuroDrive
- **Âncora:** `#neurodrive`
- **Conteúdo:** Extraído de `05-neurodrive.md`
- **Visual sugerido:** Editor com notas fluindo visualmente, grafo neural

### Seção 5 — NeuroBank
- **Âncora:** `#neurobank`
- **Conteúdo:** Extraído de `06-neurobank.md`
- **Visual sugerido:** Gráfico de fluxo de caixa animado

### Seção 6 — Teleconsulta
- **Âncora:** `#teleconsulta`
- **Conteúdo:** Extraído de `07-teleconsulta.md`
- **Visual sugerido:** Tela de vídeo minimizada com sidebar de prontuário

### Seção 7 — Synapse AI
- **Âncora:** `#synapse-ai`
- **Conteúdo:** Extraído de `08-synapse-ai.md`
- **Visual sugerido:** Chat UI com artefatos interativos aparecendo

### Seção 8 — Portal do Paciente
- **Âncora:** `#portal`
- **Conteúdo:** Extraído de `10-portal-paciente.md`
- **Visual sugerido:** Tela mobile do portal com mood tracker

### Seção 9 — Integrações & Configurações
- **Âncora:** `#ajustes`
- **Conteúdo:** Resumido de `09-ajustes.md`
- **Visual sugerido:** Grid de logos (Google, Notion, Todoist, Microsoft)

### Seção 10 — CTA Final
- **Título:** "Seu consultório nunca mais vai ser o mesmo"
- **CTA:** "Criar Conta Grátis" + "Falar com a Equipe"
- **Visual:** Gradiente premium com efeitos de luz

---

## Navegação Interna

- **Barra lateral fixa (desktop):** Menu vertical com links âncora para cada seção
- **Barra horizontal sticky (mobile):** Scroll horizontal com as seções
- **Indicador de scroll:** Destaca automaticamente a seção visível
- **Scroll suave:** `scrollIntoView({ behavior: 'smooth' })` + `IntersectionObserver`

---

## Design Guidelines

### Estética
- **Ultra-premium, monochromatic** — mesma paleta do sistema
- **Dark mode by default** com suporte full a light mode
- **Glassmorphism** nos cards de funcionalidade (usar `GlassCard`)
- **Texturas:** `premium-noise` overlay em backgrounds
- **Tipografia:** Font-black para títulos, tracking apertado (-0.03em)

### Animações
- **FadeIn** no scroll (componente `FadeIn` já existe)
- **Parallax sutil** nos visuais das seções
- **Stagger** nos items de cada lista de funcionalidades
- **Scale on hover** nos cards de feature
- **Gradient shifts** nos backgrounds ao scrollar

### Componente sugerido: `FeatureSection`
```tsx
interface FeatureSectionProps {
  id: string;                    // Âncora
  title: string;                 // "Dashboard"
  subtitle: string;              // "Sua Torre de Controle"
  description: string;           // Parágrafo introdutório
  features: {
    title: string;
    description: string;
  }[];
  visual: ReactNode;             // Componente visual à direita
  direction: 'left' | 'right';  // Alternar visual esquerda/direita
  badge?: string;                // "Professional" para features gated
}
```

---

## Considerações Técnicas

### Rota
- Adicionar em `App.tsx` como rota pública: `/funcionalidades`
- Lazy load: `const Funcionalidades = lazy(() => import("@/pages/Funcionalidades"))`

### SEO
- `<title>` — "Funcionalidades | NeuroNex — A Plataforma para Psicólogos"
- `<meta description>` — "Conheça todas as funcionalidades do NeuroNex..."
- Heading hierarchy: H1 no hero, H2 por seção, H3 por feature
- Semantic HTML: `<section>`, `<article>`, `<nav>`

### Performance
- Lazy load de visuais/imagens por seção (IntersectionObserver)
- Componentes animados com `motion.div` + `whileInView`
- Sem carregamento de 3D do Babylon.js nesta página

---

## Arquivos que precisam ser modificados

| Arquivo | Modificação |
|---------|------------|
| `App.tsx` | Adicionar rota `/funcionalidades` |
| `Navbar.tsx` | Adicionar item "Funcionalidades" no navItems |
| `Footer.tsx` | Atualizar link "Funcionalidades" de `/#vision` para `/funcionalidades` |
| Novo: `Funcionalidades.tsx` | Página principal |
| Novo: `FeatureSection.tsx` | Componente reutilizável por seção |
| Novo: `FeaturesNav.tsx` | Navegação lateral/horizontal |

---

## Contagem Total

| Seção | Funcionalidades | Status |
|-------|----------------|--------|
| Dashboard | 7 | Documentado |
| Agenda | 13 | Documentado |
| Pacientes | 18 | Documentado |
| NeuroDrive | 15 | Documentado |
| NeuroBank | 11 | Documentado |
| Teleconsulta | 13 | Documentado |
| Synapse AI | 20 | Documentado |
| Ajustes | 12 | Documentado |
| Portal Paciente | 8 | Documentado |
| Transversais | 12 | Documentado |
| **TOTAL** | **129** | ✅ |
