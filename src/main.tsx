import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/design-tokens.css";
import { registerPwaBackgroundCapabilities, registerPwaLaunchHandlers } from "./lib/pwa-integrations";

const firebaseWorkerConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const serviceWorkerUrl = () =>
  `/firebase-messaging-sw.js?${new URLSearchParams(
    Object.entries(firebaseWorkerConfig).map(([key, value]) => [key, value || ""]),
  )}`;

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  const { protocol, hostname } = window.location;
  const isSecureOrigin = protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";

  if (!import.meta.env.PROD || !isSecureOrigin) return;

  try {
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl(), {
      scope: "/",
      updateViaCache: "none",
    });

    void registration.update();
  } catch (error) {
    console.error("[NeuroNex PWA] Falha ao registrar o service worker.", error);
  }
};

window.addEventListener("load", () => {
  void registerServiceWorker();
  registerPwaBackgroundCapabilities();
});

registerPwaLaunchHandlers();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("NeuroNex root element was not found.");
}

const root = createRoot(rootElement);

function StartupFailure({ error }: { error: unknown }) {
  const isEnvironmentConfigurationError =
    error instanceof Error && error.message.includes("Missing Supabase public environment variables");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#050505",
        color: "#f5f5f5",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(520px, 100%)",
          padding: "32px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: "13px", letterSpacing: "0.24em", opacity: 0.58 }}>NEURONEX</div>
        <h1 style={{ margin: "18px 0 10px", fontSize: "28px", lineHeight: 1.1 }}>
          Não foi possível iniciar o sistema.
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
          {isEnvironmentConfigurationError
            ? "A implantação foi concluída, mas a configuração pública do ambiente ainda não está disponível."
            : "O aplicativo encontrou uma falha durante a inicialização. Tente atualizar a página em alguns instantes."}
        </p>
        <p style={{ margin: "20px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.42)" }}>
          Código de referência: NX-BOOT-001
        </p>
      </section>
    </main>
  );
}

async function bootstrap() {
  try {
    const { default: App } = await import("./App.tsx");
    root.render(<App />);
  } catch (error) {
    console.error("[NeuroNex] Falha durante a inicialização do aplicativo.", error);
    root.render(<StartupFailure error={error} />);
  }
}

void bootstrap();
