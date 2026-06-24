import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import {
  buildIntentFromSearchParams,
  consumePendingPwaIntent,
  type PendingPwaIntent,
} from "@/lib/pwa-integrations";

export default function PwaIntent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handledRef = useRef(false);
  const { createNote, isCreatingNote } = usePersonalNotes();

  const processIntent = useCallback(async () => {
    if (handledRef.current || isCreatingNote) return;

    const pendingIntent = consumePendingPwaIntent();
    const queryIntent = buildIntentFromSearchParams(searchParams);
    const intent: PendingPwaIntent | null = pendingIntent ?? queryIntent;

    // File launches may arrive through LaunchQueue moments after the route renders.
    if (!intent && searchParams.get("mode") === "file") return;

    if (!intent) {
      navigate("/notas", { replace: true });
      return;
    }

    handledRef.current = true;

    try {
      const newNote = await createNote({
        title: intent.title || "Nova Nota",
        content: intent.content,
        module_id: null,
        reference_date: new Date().toISOString(),
        tags: ["pwa", intent.source],
        patient_id: null,
      });

      if (newNote?.id) {
        navigate(`/notas?noteId=${encodeURIComponent(newNote.id)}`, { replace: true });
        return;
      }

      navigate("/notas", { replace: true });
    } catch (error) {
      console.error("[NeuroNex PWA] Falha ao criar nota a partir da integração nativa.", error);
      handledRef.current = false;
      navigate("/notas", { replace: true });
    }
  }, [createNote, isCreatingNote, navigate, searchParams]);

  useEffect(() => {
    void processIntent();

    const handleReady = () => {
      void processIntent();
    };

    window.addEventListener("neuronex:pwa-intent-ready", handleReady);
    return () => window.removeEventListener("neuronex:pwa-intent-ready", handleReady);
  }, [processIntent]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">Preparando sua nota</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O NeuroNex está organizando o conteúdo recebido pelo Windows.
          </p>
        </div>
      </div>
    </main>
  );
}
