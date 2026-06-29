import { htmlToPlainText } from "@/lib/note-content";

const MERMAID_START =
  /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|block-beta)\b/i;

const decodeHtmlEntities = (value: string) => htmlToPlainText(value || "");

const stripMarkdownFence = (value: string) =>
  value
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

const normalizeCandidate = (value: string) =>
  stripMarkdownFence(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

export const isLikelyMermaid = (value?: string | null) =>
  Boolean(value && MERMAID_START.test(value.trim()));

export const extractMermaidCode = (value?: string | null): string | null => {
  if (!value) return null;

  const raw = String(value);
  const fenced = raw.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const candidate = normalizeCandidate(fenced[1]);
    if (isLikelyMermaid(candidate)) return candidate;
  }

  const mermaidPre = raw.match(/<pre[^>]*class=["'][^"']*mermaid[^"']*["'][^>]*>([\s\S]*?)<\/pre>/i);
  if (mermaidPre?.[1]) {
    const candidate = normalizeCandidate(decodeHtmlEntities(mermaidPre[1]));
    if (isLikelyMermaid(candidate)) return candidate;
  }

  const candidates = [
    raw,
    decodeHtmlEntities(raw),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    const start = normalized.match(MERMAID_START);
    if (!start?.index && isLikelyMermaid(normalized)) return normalized;
    if (typeof start?.index === "number" && start.index > 0) {
      const sliced = normalized.slice(start.index).trim();
      if (isLikelyMermaid(sliced)) return sliced;
    }
  }

  return null;
};

const mermaidLabel = (value: string) =>
  value
    .replace(/"/g, "'")
    .replace(/[{}[\]|<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);

export const buildNeuroPulseFallbackMermaid = ({
  input,
  lensLabel,
}: {
  input: string;
  lensLabel: string;
}) => {
  const relato = mermaidLabel(input) || "Relato clinico informado";
  const lens = mermaidLabel(lensLabel) || "Lente clinica";

  return [
    "flowchart TD",
    `  A["Relato: ${relato}"] --> B["Gatilhos e contexto"]`,
    `  A --> C["Leitura ${lens}"]`,
    `  C --> D["Pensamentos / significados"]`,
    `  D --> E["Emocoes e sensacoes"]`,
    `  E --> F["Comportamentos / respostas"]`,
    `  F --> G["Consequencias percebidas"]`,
    `  C --> H["Hipoteses a investigar"]`,
    `  H --> I["Dados clinicos a confirmar"]`,
    "  classDef core fill:#111,stroke:#fff,color:#fff,stroke-width:1px;",
    "  classDef support fill:#222,stroke:#777,color:#eee,stroke-width:1px;",
    "  class A,C,H core;",
    "  class B,D,E,F,G,I support;",
  ].join("\n");
};
