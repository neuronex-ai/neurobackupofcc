import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(projectRoot, "public");
const errors = [];

const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

const fileExists = async (relativePath) => {
  try {
    await access(path.join(projectRoot, relativePath));
    return true;
  } catch {
    return false;
  }
};

const manifest = JSON.parse(await readFile(path.join(publicDir, "manifest.json"), "utf8"));
const mainSource = await readFile(path.join(projectRoot, "src/main.tsx"), "utf8");
const pushSource = await readFile(path.join(projectRoot, "src/lib/push-notifications.ts"), "utf8");
const workerSource = await readFile(path.join(publicDir, "firebase-messaging-sw.js"), "utf8");
const indexSource = await readFile(path.join(projectRoot, "index.html"), "utf8");

requireValue(manifest.id === "/", "O manifesto precisa declarar id como '/'.");
requireValue(Boolean(manifest.name && manifest.short_name), "O manifesto precisa de name e short_name.");
requireValue(manifest.start_url === "/", "O start_url precisa permanecer na raiz.");
requireValue(manifest.scope === "/", "O scope precisa permanecer na raiz.");
requireValue(Boolean(manifest.display || manifest.display_override), "O manifesto precisa de display.");
requireValue(manifest.orientation !== "portrait-primary", "A PWA desktop não pode ficar bloqueada em retrato.");
requireValue(manifest.theme_color === "#0A0A0B", "A cor do tema deve seguir a identidade escura do NeuroNex.");
requireValue(manifest.prefer_related_applications !== true, "prefer_related_applications não pode ser true.");
requireValue(Array.isArray(manifest.icons), "O manifesto precisa de um array icons.");
requireValue(Array.isArray(manifest.screenshots), "O manifesto precisa de screenshots para a instalação enriquecida.");
requireValue(manifest.lang === "pt-BR", "O idioma principal deve permanecer pt-BR.");

const declaredSizes = new Set();

for (const icon of manifest.icons || []) {
  requireValue(typeof icon.src === "string", "Todo ícone precisa de src.");
  requireValue(typeof icon.sizes === "string", `O ícone ${icon.src || "sem src"} precisa de sizes.`);
  requireValue(icon.type === "image/png", `O ícone ${icon.src || "sem src"} deve ser PNG.`);
  requireValue(icon.purpose !== "any maskable", `Separe os propósitos do ícone ${icon.src || "sem src"}; não use 'any maskable'.`);

  if (!icon.src || !icon.sizes) continue;

  requireValue(
    await fileExists(path.join("public", icon.src.replace(/^\//, ""))),
    `Arquivo de ícone ausente: ${icon.src}`,
  );

  for (const size of icon.sizes.split(/\s+/)) declaredSizes.add(size);
}

requireValue(declaredSizes.has("192x192"), "É obrigatório declarar um ícone 192x192.");
requireValue(declaredSizes.has("512x512"), "É obrigatório declarar um ícone 512x512.");

const screenshots = manifest.screenshots || [];
const wideScreenshot = screenshots.find((item) => item.form_factor === "wide");
const narrowScreenshot = screenshots.find((item) => item.form_factor !== "wide");

requireValue(Boolean(wideScreenshot), "Inclua ao menos um screenshot com form_factor 'wide'.");
requireValue(Boolean(narrowScreenshot), "Inclua ao menos um screenshot mobile/narrow.");

for (const screenshot of screenshots) {
  requireValue(typeof screenshot.src === "string", "Todo screenshot precisa de src.");
  requireValue(typeof screenshot.sizes === "string", `O screenshot ${screenshot.src || "sem src"} precisa de sizes.`);

  if (screenshot.src) {
    requireValue(
      await fileExists(path.join("public", screenshot.src.replace(/^\//, ""))),
      `Arquivo de screenshot ausente: ${screenshot.src}`,
    );
  }
}

requireValue(await fileExists("public/firebase-messaging-sw.js"), "Worker unificado ausente em public/firebase-messaging-sw.js.");
requireValue(await fileExists("public/offline.html"), "Fallback offline ausente em public/offline.html.");
requireValue(mainSource.includes("firebase-messaging-sw.js"), "src/main.tsx precisa registrar o worker unificado.");
requireValue(pushSource.includes("firebase-messaging-sw.js"), "As notificações precisam usar o worker unificado.");
requireValue(workerSource.includes("onBackgroundMessage"), "O worker unificado precisa preservar Firebase Messaging.");
requireValue(workerSource.includes("addEventListener('fetch'"), "O worker unificado precisa preservar o comportamento PWA.");
requireValue(indexSource.includes('rel="manifest" href="/manifest.json"'), "index.html precisa apontar para /manifest.json.");

if (errors.length > 0) {
  console.error("\nNeuroNex PWA: validação falhou\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("NeuroNex PWA: manifesto, screenshots, worker unificado e fallback offline validados.");
