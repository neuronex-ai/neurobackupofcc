# NeuronEx Brand DNA — Design System Specification

> The definitive source of truth for visual identity, component behavior, animation language, and interaction design across the NeuronEx platform.

---

## 1. Design Philosophy

NeuronEx's visual language draws from **Apple Vision Pro's spatial design** and **Framer's motion vocabulary**. Every surface should feel like precision-milled glass — translucent, layered, and alive.

**Core Principles:**
1. **Monochromatic Precision** — Pure black ↔ white spectrum with no rogue color accents. Color is reserved exclusively for semantic states (success, error, warning).
2. **Depth Through Light** — Layers are communicated through blur, opacity, and shadow weight — never through competing colors.
3. **Organic Motion** — All transitions use Apple-family easing curves. No linear motion. Everything breathes.
4. **Tactile Feedback** — Every interactive element must respond to input with scale, opacity, or glow changes that mimic physical surfaces.
5. **Restraint** — Premium = subtlety. Never glow too bright, never animate too fast, never over-decorate.

---

## 2. Color System

### 2.1 Token Palette — Dark Mode (Default)

| Token | HSL Value | Purpose |
|---|---|---|
| `--background` | `240 10% 4%` | Page canvas — deepest onyx |
| `--card` | `240 10% 6%` | Card surfaces |
| `--foreground` | `0 0% 98%` | Primary text — ceramic white |
| `--muted-foreground` | `240 5% 65%` | Secondary text |
| `--border` | `0 0% 15%` | Subtle dividers |
| `--primary` | `0 0% 98%` | Interactive emphasis — pure white |

### 2.2 Token Palette — Light Mode

| Token | HSL Value | Purpose |
|---|---|---|
| `--background` | `0 0% 100%` | Page canvas — pure white |
| `--card` | `0 0% 98.5%` | Card surfaces — snow |
| `--foreground` | `240 10% 3.9%` | Primary text — near-black |
| `--muted-foreground` | `240 5% 45%` | Secondary text |
| `--border` | `240 5% 88%` | Subtle dividers |
| `--primary` | `240 10% 3.9%` | Interactive emphasis — near-black |

### 2.3 Semantic Colors

| State | Dark Mode | Light Mode | Use Case |
|---|---|---|---|
| Success | `emerald-500/10` bg / `emerald-400` text | `emerald-500/10` bg / `emerald-600` text | Positive metrics, confirmations |
| Destructive | `red-500/10` bg / `red-400` text | `red-500/10` bg / `red-600` text | Errors, deletions |
| Warning | `amber-500/10` bg / `amber-400` text | `amber-500/10` bg / `amber-600` text | Warnings, pending states |

### 2.4 Glass Surfaces

| Property | Dark Mode | Light Mode |
|---|---|---|
| Background | `rgba(20, 20, 25, 0.7)` | `rgba(255, 255, 255, 0.75)` |
| Border | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` |
| Shadow | `0 8px 32px rgba(0,0,0,0.4)` | `0 8px 32px rgba(0,0,0,0.08)` |
| Blur | `24px` | `24px` |

> **RULE:** Never use hardcoded `text-white` or `bg-zinc-950` in components. Always use semantic tokens (`text-foreground`, `bg-card`, `text-muted-foreground`).

---

## 3. Typography

**Font Stack:** `'Inter', system-ui, -apple-system, sans-serif`

| Role | Size | Weight | Tracking |
|---|---|---|---|
| **Page Title** (H1) | `text-2xl` | `font-bold` | `-0.04em` |
| **Section Title** (H2) | `text-xl` | `font-bold` | `-0.03em` |
| **Card Header** (H3) | `text-base` | `font-semibold` | `-0.02em` |
| **Body Text** | `text-sm` | `font-normal` | `-0.011em` |
| **Label / Caption** | `text-xs` | `font-bold` | `0.05em` |
| **Micro Label** | `text-[10px]` | `font-black` | `0.1em` |
| **System Label** | `text-[9px]` | `font-bold` | `0.2em` |

> All labels and captions are `uppercase` with `tracking-wider` or `tracking-widest`.

---

## 4. Spacing & Layout

### 4.1 Page Structure
- Navbar: fixed, glass-capsule, z-50 at `top-6`
- Content: `pt-32`, `pb-24`, `.page-spacing` (px-4 → px-10), max-width 1800px
- Sections: `space-y-10`
- Card grids: `gap-4` or `gap-6`

### 4.2 Border Radius Scale
| Component | Radius |
|---|---|
| Page cards | `rounded-[24px]` |
| Modals | `rounded-[32px]` |
| Buttons | `rounded-xl` |
| Tabs pill | `rounded-full` |
| Badges/Chips | `rounded-full` |
| Icon containers | `rounded-xl` |

---

## 5. Animation System

### 5.1 Easing Curves
| Name | Curve | Usage |
|---|---|---|
| **Apple** | `[0.22, 1, 0.36, 1]` | Default for all UI transitions |
| **Spring** | `[0.175, 0.885, 0.32, 1.275]` | Tab indicators, toggles |
| **Bounce** | `[0.34, 1.56, 0.64, 1]` | Active press feedback |
| **Smooth** | `[0.4, 0, 0.2, 1]` | Opacity fades |

### 5.2 Duration Scale
| Name | Value | Usage |
|---|---|---|
| `instant` | `100ms` | Icon swaps |
| `fast` | `150ms` | Micro-interactions |
| `normal` | `300ms` | Standard transitions |
| `slow` | `500ms` | Page enters |
| `theme` | `800ms` | Theme switch |

### 5.3 Standard Framer Motion Variants
```typescript
const pageEnter = {
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const staggerChild = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const cardEnter = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const modalEnter = {
  initial: { opacity: 0, scale: 0.95, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
};
```

### 5.4 Micro-Interactions
| Element | Hover | Active Press |
|---|---|---|
| **Button (primary)** | `scale: 1.02`, shadow↑ | `scale: 0.97` |
| **Card** | `translateY(-4px)`, shadow lift | — |
| **Navbar icon** | `scale: 1.1`, color brighten | — |
| **Table row** | `bg-foreground/[0.02]` | — |
| **Selectable item** | border lighten, bg increase | `scale: 0.98` |

---

## 6. Component Specifications

### 6.1 GlassCard
- `bg-card border-border/50 rounded-[24px]`
- Noise texture at `opacity-[0.02]`
- Hover: `card-lift` class (translateY -4px, shadow deepen)

### 6.2 Modals
- `bg-card/80 backdrop-blur-[80px] border-border/20 rounded-[32px]`
- Ambient radial gradient overlays
- Sticky header/footer: `bg-card/90 backdrop-blur-xl border-border/10`

### 6.3 Tabs
- TabsList: `rounded-full bg-muted/50 backdrop-blur-sm border-border/30`
- Active: `bg-background text-foreground shadow-sm border-border/50`
- Transition: 300ms apple easing

### 6.4 Metric Cards
- Icon container: `w-12 h-12 rounded-xl bg-foreground/[0.06]`
- Icon: `text-foreground/70`
- Value: `text-2xl font-bold text-foreground`
- Label: `text-xs font-medium text-muted-foreground uppercase tracking-wider`

### 6.5 Page Headers
- Icon container: `w-16 h-16 rounded-2xl bg-foreground/[0.06] border-border/30`
- Icon: `text-foreground/70`
- Title: `text-2xl font-bold text-foreground`
- Subtitle: `text-sm text-muted-foreground`

### 6.6 Desktop Workspace Pattern

Use this pattern for dense desktop surfaces such as Dashboard, Gestao Financeira, NeuroFinance, Agenda, Pacientes and operational command centers.

**Composition**
- One dominant high-contrast panel owns the primary job of the screen.
- A fixed, non-expanding action sidebar can sit at the left edge for icon-first shortcuts.
- Pending work should live in its own list block, not inside the shortcut rail.
- Secondary panels show lists, summaries and follow-up signals without duplicating full tabs.
- The next operational event can sit beside the greeting as a premium utility panel.
- Prefer lists, rows, segmented controls, toolbars and native buttons over decorative hero cards.
- The first fold must answer: what is happening now, what needs action, and where the user can go next.

**Reusable primitives**
- `DesktopWorkspaceShell`: outer desktop canvas, `rounded-[40px]`, low-light radial overlays, subtle border and restrained shadow.
- `DesktopWorkspacePanel`: standard panel, `rounded-[34px]`, tokenized surface, optional `highContrast` variant.
- `DesktopActionTile`: compact icon-first action, primary action in foreground/background contrast.
- `DesktopMiniStat`: compact metric block; use `accent` for the one stat that deserves high contrast.
- `DesktopWorkspaceIcon`: icon capsule for headers, rows and compact status blocks.

**Contrast rule**
- Light mode: active buttons, selected mini-cards and primary icon capsules use near-black foreground surfaces.
- Dark mode: active buttons, selected mini-cards and primary icon capsules use white foreground surfaces.
- Neutral surfaces stay quiet: `bg-card/78`, `bg-white`, `dark:bg-white/[0.04]`, or equivalent tokens.
- Semantic colors are reserved for success, warning and destructive states.

**Light, texture and shadow**
- Desktop workspace light must be restrained. Prefer radial opacity near `0.006` to `0.018`.
- Avoid large glow clouds. When migrating older dashboard surfaces, reduce ornamental light by about 60%.
- In dark mode, panel shadows must be dark/black, not white. White light is allowed only as an internal highlight near `0.002` to `0.012`.
- Texture/noise should be barely visible: `opacity-[0.015]` to `opacity-[0.03]`.
- Shadows communicate hierarchy, not decoration. Use heavier shadow only on the dominant panel or active surface.

**Density and hierarchy**
- Keep primary panels at `p-6` to `p-8`; compact rails at `p-5` to `p-6`.
- Left shortcut sidebars should use compact action tiles, no expandable labels, and no legacy actions.
- Lists should use rows around `rounded-[20px]`, direct labels, status pills and one clear destination.
- Mini action blocks should be icon-first, roughly `w-20` to `w-[86px]`, with labels limited to one or two words.
- Avoid explanatory copy when a status, metric or action already makes the state clear.

**Motion**
- Use hover lift no stronger than `translateY(-0.5)` and active scale between `0.96` and `0.99`.
- Add `motion-reduce` fallbacks to remove hover lift and press scaling.
- Do not animate decorative light, blur, or background effects unless they clarify state change.

---

## 7. Background System

- `.neuronex-bg`: Light `#FAFAFA` / Dark `#020204` with radial gradient overlay
- `.premium-noise`: `opacity-[0.015]` light / `opacity-[0.02]` dark
- `Starfield`: Dark mode only (`hidden dark:block`)

---

## 8. Theme Transition
1. Radial gradient overlay flash (800ms)
2. CSS variables swap simultaneously
3. `html` element: `transition: background-color 0.8s, color 0.8s`
4. Sun ↔ Moon icon: rotate + scale (400ms, apple easing)
