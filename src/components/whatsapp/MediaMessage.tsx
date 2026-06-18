import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

type MediaMessageProps = {
  contentType?: string | null;
  content?: string | null;
  mediaBase64?: string | null;
  mediaMimetype?: string | null;
  mediaFilename?: string | null;
  direction?: string | null;
};

const toMediaSrc = (mediaBase64?: string | null, mediaMimetype?: string | null) => {
  if (!mediaBase64) return null;
  if (/^https?:\/\//i.test(mediaBase64) || mediaBase64.startsWith("data:")) return mediaBase64;
  return `data:${mediaMimetype || "application/octet-stream"};base64,${mediaBase64}`;
};

export function MediaMessage({
  contentType,
  content,
  mediaBase64,
  mediaMimetype,
  mediaFilename,
  direction,
}: MediaMessageProps) {
  const normalizedType = (contentType || "text").toLowerCase();
  const mediaSrc = toMediaSrc(mediaBase64, mediaMimetype);
  const outbound = direction === "outbound";

  if (normalizedType.includes("image") && mediaSrc) {
    return (
      <div className="space-y-2">
        <img
          src={mediaSrc}
          alt={mediaFilename || "Imagem enviada pelo WhatsApp"}
          className="max-h-80 rounded-2xl object-contain"
        />
        {content ? <p className="whitespace-pre-wrap break-words">{content}</p> : null}
      </div>
    );
  }

  if (normalizedType.includes("audio") && mediaSrc) {
    return (
      <div className="space-y-2">
        <audio controls src={mediaSrc} className="max-w-full" />
        {content ? <p className="whitespace-pre-wrap break-words">{content}</p> : null}
      </div>
    );
  }

  if ((normalizedType.includes("document") || normalizedType.includes("file")) && mediaSrc) {
    return (
      <a
        href={mediaSrc}
        download={mediaFilename || true}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-3 text-xs font-bold",
          outbound ? "border-black/10 bg-black/5 text-black" : "border-white/10 bg-white/[0.04] text-zinc-100",
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">{mediaFilename || content || "Documento"}</span>
      </a>
    );
  }

  return <p className="whitespace-pre-wrap break-words">{content || ""}</p>;
}
