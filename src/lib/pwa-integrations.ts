const PWA_INTENT_STORAGE_KEY = "neuronex:pwa-pending-intent";
const MAX_TEXT_FILE_SIZE = 2 * 1024 * 1024;

export type PendingPwaIntent = {
  title: string;
  content: string;
  source: "file" | "share" | "protocol" | "note";
};

type LaunchFileHandle = {
  getFile: () => Promise<File>;
};

type LaunchParamsLike = {
  files?: LaunchFileHandle[];
  targetURL?: string;
};

type LaunchQueueLike = {
  setConsumer: (consumer: (params: LaunchParamsLike) => void | Promise<void>) => void;
};

type PwaWindow = Window & {
  launchQueue?: LaunchQueueLike;
};

const savePendingIntent = (intent: PendingPwaIntent) => {
  window.sessionStorage.setItem(PWA_INTENT_STORAGE_KEY, JSON.stringify(intent));
};

export const consumePendingPwaIntent = (): PendingPwaIntent | null => {
  const raw = window.sessionStorage.getItem(PWA_INTENT_STORAGE_KEY);
  if (!raw) return null;

  window.sessionStorage.removeItem(PWA_INTENT_STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw) as Partial<PendingPwaIntent>;
    if (typeof parsed.title !== "string" || typeof parsed.content !== "string") return null;

    return {
      title: parsed.title,
      content: parsed.content,
      source: parsed.source === "file" || parsed.source === "share" || parsed.source === "protocol"
        ? parsed.source
        : "note",
    };
  } catch {
    return null;
  }
};

const fileTitle = (file: File) => {
  const withoutExtension = file.name.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || "Arquivo importado";
};

const handleIncomingFile = async (handle: LaunchFileHandle) => {
  const file = await handle.getFile();

  if (file.size > MAX_TEXT_FILE_SIZE) {
    throw new Error("O arquivo excede o limite de 2 MB para importação como nota.");
  }

  const content = await file.text();
  savePendingIntent({
    title: fileTitle(file),
    content,
    source: "file",
  });

  window.dispatchEvent(new CustomEvent("neuronex:pwa-intent-ready"));

  if (window.location.pathname !== "/pwa-intent") {
    window.location.assign("/pwa-intent?mode=file");
  }
};

export const registerPwaLaunchHandlers = () => {
  const launchQueue = (window as PwaWindow).launchQueue;
  if (!launchQueue?.setConsumer) return;

  launchQueue.setConsumer(async (params) => {
    const firstFile = params.files?.[0];
    if (!firstFile) return;

    try {
      await handleIncomingFile(firstFile);
    } catch (error) {
      console.error("[NeuroNex PWA] Não foi possível importar o arquivo.", error);
    }
  });
};

export const buildIntentFromSearchParams = (params: URLSearchParams): PendingPwaIntent | null => {
  const mode = params.get("mode");

  if (mode === "new-note") {
    return {
      title: "Nova Nota",
      content: "",
      source: "note",
    };
  }

  const shareTitle = params.get("shareTitle")?.trim() ?? "";
  const shareText = params.get("shareText")?.trim() ?? "";
  const shareUrl = params.get("shareUrl")?.trim() ?? "";

  if (shareTitle || shareText || shareUrl) {
    return {
      title: shareTitle || "Conteúdo compartilhado",
      content: [shareText, shareUrl].filter(Boolean).join("\n\n"),
      source: "share",
    };
  }

  const protocol = params.get("protocol")?.trim();
  if (protocol) {
    return {
      title: "Conteúdo aberto pelo NeuroNex",
      content: protocol,
      source: "protocol",
    };
  }

  return null;
};
