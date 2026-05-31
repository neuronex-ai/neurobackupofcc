# AI Rules & Tech Stack

This document outlines the architectural standards, tech stack, and library usage rules for the NeuroNex project. All AI-generated code and manual contributions must adhere to these guidelines.

## 🚀 Tech Stack

- **Framework & Language**: React 18 with TypeScript and Vite for a fast, type-safe development experience.
- **UI & Styling**: Tailwind CSS for utility-first styling, combined with **shadcn/ui** (Radix UI primitives) for accessible, consistent components.
- **Backend & Infrastructure**: **Supabase** providing Authentication, PostgreSQL database, Edge Functions (Deno), and Real-time subscriptions.
- **State Management**: **TanStack Query (React Query)** for server-state synchronization and caching; React Context for global UI state.
- **AI Intelligence**: **Google Gemini** integrated via Supabase Edge Functions for clinical reasoning and automated summaries.
- **Voice & Audio**: **ElevenLabs** for high-fidelity text-to-speech synthesis and native browser Speech Recognition for dictation.
- **Financial Integration**: **Stripe Connect** for managed payments, professional billing, and automated reconciliation.
- **Platform Strategy**: Multi-platform support via **Electron** (Desktop), **Capacitor** (Mobile), and Vercel (Web).
- **Editor & Content**: **Tiptap** for rich-text clinical notes and **Mermaid.js** for interactive diagnostic diagrams.

## 🛠 Library Usage Rules

### UI & Styling
- **Components**: Always prefer components from `src/components/ui/`. If a component is missing, use shadcn/ui patterns.
- **Icons**: Use `lucide-react` for all interface icons.
- **Animations**: Use `framer-motion` for complex interactive transitions and `tailwindcss-animate` for simple entry/exit effects.
- **Theming**: Support both Light and Dark modes using `next-themes`. Use the `glass` and `neural` design tokens defined in `src/styles/`.

### Data & Logic
- **Data Fetching**: All external API or Supabase calls **must** use custom hooks located in `src/hooks/`, powered by TanStack Query.
- **Form Management**: Use `react-hook-form` paired with `zod` for schema-based validation.
- **Date/Time**: Use `date-fns` for all date manipulations and formatting. Always consider the user's timezone via `src/lib/timezone.ts`.
- **Validation**: Centralize all validation logic using Zod schemas in `src/lib/validation.ts` or near the relevant types.

### AI & Clinical Features
- **AI Processing**: Do not call AI APIs directly from the frontend. Use the `supabase/functions/gemini-text-chat` edge function.
- **Clinical Safety**: All AI-generated content must be presented as a "draft" or "suggestion" that requires human verification.
- **Anonymization**: Use `src/lib/anonymization-service.ts` before sending sensitive patient data to LLMs.

### Architecture & Standards
- **File Organization**:
  - `src/pages/`: Full-page route components.
  - `src/components/`: Reusable UI modules (organized by feature).
  - `src/hooks/`: Data fetching and complex logic.
  - `src/types/`: TypeScript interfaces and types.
  - `src/lib/`: Stateless utility functions and shared logic.
- **Routing**: Use `react-router-dom`. Keep all route definitions in `src/App.tsx`.
- **Code Quality**: Maintain strict TypeScript typing. Avoid `any` at all costs. Use functional components and hooks exclusively.
