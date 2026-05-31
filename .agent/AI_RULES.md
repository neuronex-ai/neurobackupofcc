# AI Rules for NeuroNex Project

This document outlines the core technologies used in the NeuroNex project and provides guidelines for library usage to maintain consistency and best practices.

## Tech Stack

*   **Vite**: A fast build tool that provides an instant development server and optimized builds.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and maintainability.
*   **React**: A declarative, component-based JavaScript library for building user interfaces.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and styled with Tailwind CSS, providing a consistent and accessible UI.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup.
*   **React Router**: A standard library for routing in React applications, used for declarative navigation.
*   **TanStack Query**: A powerful data-fetching library for managing server state, caching, and synchronization.
*   **Recharts**: A composable charting library built with React and D3, used for data visualization.
*   **Lucide React**: A library providing a set of beautiful, customizable SVG icons.
*   **React Hook Form & Zod**: Used together for efficient form management and schema-based validation.
*   **Date-fns**: A comprehensive and lightweight JavaScript date utility library.
*   **Sonner**: A modern toast component for displaying notifications.
*   **Asaas (BaaS v3)**: Provedor atual de infraestrutura bancária (subcontas, cobranças, saques e KYC).

## Library Usage Rules

To ensure consistency and maintainability, please adhere to the following guidelines when developing:

*   **UI Components**: Always prioritize `shadcn/ui` components for building the user interface. If a specific component is not available or requires significant customization, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify `shadcn/ui` component files directly.**
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid inline styles or separate CSS files (beyond `src/index.css` for global styles).
*   **Routing**: Use `react-router-dom` for all client-side navigation. Define routes within `src/App.tsx`.
*   **Data Fetching & Server State**: Utilize `TanStack Query` for managing all server-side data fetching, caching, and synchronization.
*   **Forms**: Implement forms using `react-hook-form` for state management and `zod` for schema validation.
*   **Icons**: All icons should be sourced from the `lucide-react` library.
*   **Charts & Data Visualization**: Use `recharts` for creating all graphs and data visualizations.
*   **Date Handling**: For any date manipulation, formatting, or comparison, use `date-fns`.
*   **Notifications**: For transient, non-blocking notifications, use `sonner`. For more interactive or persistent toasts, use the `shadcn/ui` toast system (via `useToast`).
*   **Utility Functions**: General utility functions that are not specific to a single component or page should be placed in `src/lib/utils.ts`.
*   **Custom Hooks**: Any custom React hooks should be defined in `src/hooks/`.

## Banking / BaaS Provider Rule

*   **Provedor único**: O projeto deve tratar **Asaas (API v3 / BaaS)** como o único provedor bancário ativo.
*   **Evitar legado**: Não adicionar nem reintroduzir referências a Stripe/C6 (tabelas, edge functions, env vars, docs ou dependências).