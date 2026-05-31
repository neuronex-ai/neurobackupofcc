
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Use relative base when building (for Electron file:// compatibility).
  // In dev mode, use "/" for the dev server. 
  // The electron:build and electron:preview scripts pass --base=./
  // but we also default to "./" in production builds to be safe.
  const isProduction = command === 'build';

  return {
    base: isProduction ? "./" : "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      mode === 'development' && dyadComponentTagger(),
      react()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
      },
    },
    optimizeDeps: {
      include: []
    }
  };
});