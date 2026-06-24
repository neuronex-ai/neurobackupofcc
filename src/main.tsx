import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/design-tokens.css";

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  const { protocol, hostname } = window.location;
  const isSecureOrigin = protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";

  if (!import.meta.env.PROD || !isSecureOrigin) return;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
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
});

createRoot(document.getElementById("root")!).render(<App />);
