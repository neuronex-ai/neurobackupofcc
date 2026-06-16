import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  hasNativeCodeScanner,
  scanCodeWithNative,
} from "@/lib/native-mobile-security";
import {
  MobileFinanceButton,
  MobileFinanceSheet,
  mobileFinanceSurface,
} from "../../shared/MobileFinancePrimitives";

type ScannerMode = "pix" | "boleto";

type ScannerState = "idle" | "starting" | "scanning" | "error" | "native";

const formatHints = {
  pix: [BarcodeFormat.QR_CODE],
  boleto: [
    BarcodeFormat.ITF,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ],
} satisfies Record<ScannerMode, BarcodeFormat[]>;

const copy = {
  pix: {
    title: "Ler QR Code Pix",
    description: "Aponte a camera para o QR Code. O Pix sera consultado antes da confirmacao.",
    hint: "Nenhum pagamento e enviado a partir da leitura.",
  },
  boleto: {
    title: "Ler boleto",
    description: "Aponte para o codigo de barras. Os dados serao validados antes do PIN.",
    hint: "A leitura apenas preenche a consulta do boleto.",
  },
} satisfies Record<ScannerMode, { title: string; description: string; hint: string }>;

export function MobileCodeScannerSheet({
  open,
  onOpenChange,
  mode,
  busy = false,
  onDetected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ScannerMode;
  busy?: boolean;
  onDetected: (value: string) => Promise<void> | void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const detectedRef = useRef(false);
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      detectedRef.current = false;
      setState("idle");
      setError(null);
      return;
    }

    let cancelled = false;

    const start = async () => {
      detectedRef.current = false;
      setError(null);

      if (hasNativeCodeScanner()) {
        setState("native");
        try {
          const value = await scanCodeWithNative({ mode });
          if (cancelled || !value) return;
          detectedRef.current = true;
          onOpenChange(false);
          await onDetected(value);
        } catch (cause) {
          if (cancelled) return;
          setError(
            cause instanceof Error
              ? cause.message
              : "Nao foi possivel ler o codigo pela camera.",
          );
          setState("error");
        }
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        setError("Camera indisponivel neste navegador ou contexto.");
        setState("error");
        return;
      }

      setState("starting");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formatHints[mode]);
      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 260,
      });

      try {
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (!result || detectedRef.current) return;
            detectedRef.current = true;
            controlsRef.current?.stop();
            const value = result.getText();
            onOpenChange(false);
            Promise.resolve(onDetected(value)).catch((cause) => {
              toast.error(
                cause instanceof Error
                  ? cause.message
                  : "Codigo lido, mas nao foi possivel validar.",
              );
            });
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setState("scanning");
      } catch (cause) {
        if (cancelled) return;
        setError(cameraErrorMessage(cause));
        setState("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [mode, onDetected, onOpenChange, open, retryKey]);

  const content = copy[mode];
  const isLoading = state === "starting" || state === "native" || busy;

  return (
    <MobileFinanceSheet
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="h-[min(88dvh,42rem)]"
      bodyClassName="pb-[calc(24px+env(safe-area-inset-bottom))]"
    >
      <div className="py-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Camera segura
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {content.title}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {content.description}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar leitor"
            onClick={() => onOpenChange(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-border/40 bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn(mobileFinanceSurface, "mt-6 overflow-hidden p-2")}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[46%] w-[76%] rounded-[22px] border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
            </div>
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/72 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="mt-3 text-xs font-semibold">
                  {state === "native" ? "Abrindo leitor nativo" : "Solicitando camera"}
                </p>
              </div>
            ) : null}
            {state === "error" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/82 p-5 text-center text-white">
                <Camera className="h-7 w-7 opacity-75" />
                <p className="mt-4 text-sm font-semibold">Nao conseguimos iniciar a camera.</p>
                <p className="mt-2 text-xs leading-5 text-white/64">{error}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-[18px] border border-border/40 bg-card p-3 text-[11px] leading-4 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          <span>{content.hint}</span>
        </div>

        {state === "error" ? (
          <Button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-4 h-14 w-full rounded-[20px] text-xs font-semibold uppercase tracking-[0.16em]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        ) : (
          <MobileFinanceButton
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => onOpenChange(false)}
          >
            Inserir codigo manualmente
          </MobileFinanceButton>
        )}
      </div>
    </MobileFinanceSheet>
  );
}

function cameraErrorMessage(cause: unknown) {
  if (cause instanceof DOMException) {
    if (cause.name === "NotAllowedError") {
      return "Permita o acesso a camera nas configuracoes do navegador ou do app.";
    }
    if (cause.name === "NotFoundError") {
      return "Nenhuma camera foi encontrada neste dispositivo.";
    }
    if (cause.name === "NotReadableError") {
      return "A camera esta em uso por outro aplicativo.";
    }
  }

  return cause instanceof Error
    ? cause.message
    : "Verifique a permissao de camera e tente novamente.";
}
