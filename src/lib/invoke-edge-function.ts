import { supabase } from "@/integrations/supabase/client";

async function edgeMessage(error: unknown) {
  const fallback = error instanceof Error ? error.message : undefined;
  const context = typeof error === "object" && error !== null && "context" in error
    ? (error as { context?: unknown }).context
    : undefined;
  if (!context || typeof context !== "object" || !("json" in context)) return fallback;

  try {
    const body = await (context as { json: () => Promise<unknown> }).json();
    if (body && typeof body === "object") {
      const payload = body as Record<string, unknown>;
      return String(payload.error || payload.message || fallback || "");
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export async function invokeEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error((await edgeMessage(error)) || "Não foi possível concluir esta operação.");
  if (data?.error) throw new Error(data.error);
  return data as T;
}
