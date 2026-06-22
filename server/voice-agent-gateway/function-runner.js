import { classifyInterruption } from "./intent.js";

const SLOW_FUNCTION_MS = Number(process.env.SYNAPSE_VOICE_SLOW_FUNCTION_MS || "2500");
const FOLLOWUP_FUNCTION_MS = Number(process.env.SYNAPSE_VOICE_FOLLOWUP_FUNCTION_MS || "8000");
const MAX_PROGRESS_MESSAGES = Number(process.env.SYNAPSE_VOICE_MAX_PROGRESS_MESSAGES || "2");
const MAX_TOOL_RETRIES = Number(process.env.SYNAPSE_VOICE_MAX_TOOL_RETRIES || "1");

const clean = (value, max = 5000) => String(value ?? "").trim().slice(0, max);

function safeJsonParse(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function titleize(value) {
  return clean(value, 160)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function patientFromArgs(args) {
  return clean(args.patient_name || args.patientName || args.patient || args.nome_paciente, 120);
}

function taskLabel(name, args = {}) {
  const patient = patientFromArgs(args);
  const label =
    clean(args.task_label || args.taskLabel || args.label || args.intent_label, 140) ||
    titleize(name) ||
    "consulta";
  return patient ? `${label} de ${patient}` : label;
}

function initialMessage(name, args) {
  const patient = patientFromArgs(args);
  if (patient) return `Vou conferir as informacoes de ${patient} no sistema.`;
  return `Vou consultar ${taskLabel(name, args)} no sistema.`;
}

function progressMessage(name, args, count) {
  const patient = patientFromArgs(args);
  const base = taskLabel(name, args);
  if (patient) {
    return count === 0
      ? `Ainda estou buscando as informacoes de ${patient}, so mais um instante.`
      : `Continuo conferindo ${base}; ja volto com o resultado.`;
  }
  return count === 0
    ? `Ainda estou conferindo ${base}, so mais um instante.`
    : `Continuo trabalhando nisso; ja volto com o resultado.`;
}

function retryMessage(name, args) {
  return `A consulta oscilou por aqui. Vou tentar ${taskLabel(name, args)} mais uma vez.`;
}

function makeAbortError(message = "Operacao cancelada.") {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

function wait(ms, signal) {
  if (!ms) return Promise.resolve();
  if (signal?.aborted) return Promise.reject(makeAbortError());

  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(makeAbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isTransientError(value) {
  const text = clean(value?.message || value?.error || value, 1000).toLowerCase();
  if (!text) return false;
  return /timeout|timed out|temporari|temporary|network|socket|fetch|econn|5\d\d|rate limit|too many|indisponivel|instavel|oscila|gateway|service unavailable/.test(text);
}

function normalizePayload(name, result) {
  const parsed = safeJsonParse(result?.content ?? result);
  const explicitOk = parsed.ok;
  const hasError = Boolean(parsed.error || result?.error);
  const ok = explicitOk === undefined ? !hasError : Boolean(explicitOk);
  const spoken =
    clean(parsed.spoken_summary, 1200) ||
    clean(parsed.message, 1200) ||
    clean(parsed.error || result?.error, 1200) ||
    (ok ? "Ferramenta concluida." : "Nao consegui concluir a ferramenta agora.");

  return {
    ok,
    tool: clean(parsed.tool || name, 120),
    spoken_summary: spoken,
    message: spoken,
    retryable: Boolean(parsed.retryable),
    needs_clarification: Boolean(parsed.needs_clarification),
    confirmation_required: Boolean(parsed.confirmation_required ?? parsed.confirmationRequired),
    cancelled: Boolean(parsed.cancelled),
    data: parsed.data ?? null,
    error: ok ? null : clean(parsed.error || spoken, 1200),
    grounded: Boolean(parsed.grounded),
    recordCount: Number(parsed.recordCount || 0),
    structuredData: parsed.structuredData || null,
  };
}

function failurePayload(name, error, aborted) {
  const message = aborted
    ? "A acao foi cancelada antes de concluir."
    : clean(error?.message || "Falha ao executar ferramenta de voz.", 1000);
  return {
    ok: false,
    tool: name,
    cancelled: aborted,
    spoken_summary: message,
    message,
    retryable: !aborted && isTransientError(error),
    needs_clarification: false,
    confirmation_required: false,
    data: null,
    error: aborted ? null : message,
  };
}

function clientTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    name: task.name,
    label: task.label,
    message: task.message || "",
    status: task.status,
    startedAt: task.startedAt,
    elapsedMs: Math.max(0, Date.now() - task.startedAt),
  };
}

export class VoiceFunctionRunner {
  constructor({ sendDeepgram, sendClient, invokeTool }) {
    this.sendDeepgram = sendDeepgram;
    this.sendClient = sendClient;
    this.invokeTool = invokeTool;
    this.tasks = new Map();
    this.lastInterruptionAt = 0;
    this.queue = Promise.resolve();
  }

  injectAgentMessage(message, behavior = "queue") {
    const text = clean(message, 420);
    if (!text) return;
    this.sendDeepgram({
      type: "InjectAgentMessage",
      content: text,
      message: text,
      behavior,
    });
  }

  sendFunctionResponse(id, name, content) {
    this.sendDeepgram({
      type: "FunctionCallResponse",
      id,
      name,
      content: typeof content === "string" ? content : JSON.stringify(content),
    });
  }

  sendStatus(task, status, extra = {}) {
    const message = clean(extra.message ?? task?.message, 800);
    if (task) {
      task.status = status;
      if (message) task.message = message;
    }
    this.sendClient({
      type: "function_status",
      status,
      id: task?.id,
      name: task?.name,
      label: task?.label,
      message,
      elapsedMs: task ? Math.max(0, Date.now() - task.startedAt) : undefined,
      ...extra,
    });
  }

  sendVoiceState(phase, task = null, extra = {}) {
    const activeTool = clientTask(task);
    this.sendClient({
      type: "voice_state",
      phase,
      activeTool,
      activeTools: Array.from(this.tasks.values()).map(clientTask),
      ...extra,
    });
  }

  handleFunctionCallRequest(event) {
    const functions = Array.isArray(event?.functions) ? event.functions : [];
    this.queue = this.queue
      .catch(() => undefined)
      .then(async () => {
        for (const fn of functions) {
          await this.runFunction(fn);
        }
      });
    return this.queue;
  }

  async runFunction(fn) {
    const id = clean(fn?.id || crypto.randomUUID(), 120);
    const name = clean(fn?.name, 120);
    const args = safeJsonParse(fn?.arguments);
    if (!name) return;

    const controller = new AbortController();
    const task = {
      id,
      name,
      args,
      label: taskLabel(name, args),
      controller,
      startedAt: Date.now(),
      progressCount: 0,
      timers: [],
      interrupted: false,
      status: "started",
      message: "",
    };
    this.tasks.set(id, task);

    const firstMessage = initialMessage(name, args);
    task.message = firstMessage;
    this.sendStatus(task, "started", { message: firstMessage });
    this.sendVoiceState("tool_active", task);
    this.injectAgentMessage(firstMessage, "queue");
    this.scheduleProgress(task, SLOW_FUNCTION_MS);

    try {
      const { result, payload } = await this.invokeWithRetry(task);
      if (controller.signal.aborted) throw makeAbortError();

      if (result?.clientAction) {
        this.sendClient({ type: "client_action", action: result.clientAction });
      }

      this.sendFunctionResponse(id, name, payload);
      this.sendStatus(task, payload.ok ? "completed" : "failed", {
        message: payload.spoken_summary,
        error: payload.error || undefined,
        retryable: payload.retryable,
        needs_clarification: payload.needs_clarification,
        confirmation_required: payload.confirmation_required,
      });
      this.sendVoiceState(payload.ok ? "tool_completed" : "tool_failed", task, {
        message: payload.spoken_summary,
      });
    } catch (error) {
      const aborted = controller.signal.aborted || error?.name === "AbortError";
      const payload = failurePayload(name, error, aborted);
      this.sendFunctionResponse(id, name, payload);
      this.sendStatus(task, aborted ? "cancelled" : "failed", {
        message: payload.spoken_summary,
        error: payload.error || undefined,
        retryable: payload.retryable,
      });
      this.sendVoiceState(aborted ? "tool_cancelled" : "tool_failed", task, {
        message: payload.spoken_summary,
      });
    } finally {
      for (const timer of task.timers) clearTimeout(timer);
      this.tasks.delete(id);
      this.sendVoiceState(this.tasks.size ? "tool_active" : "thinking");
    }
  }

  scheduleProgress(task, delay) {
    const timer = setTimeout(() => {
      if (!this.tasks.has(task.id) || task.controller.signal.aborted) return;
      if (task.interrupted) {
        this.scheduleProgress(task, FOLLOWUP_FUNCTION_MS);
        return;
      }

      const message = progressMessage(task.name, task.args, task.progressCount);
      task.progressCount += 1;
      this.injectAgentMessage(message, "queue");
      this.sendStatus(task, "progress", { message });
      this.sendVoiceState("tool_active", task);

      if (task.progressCount < MAX_PROGRESS_MESSAGES) {
        this.scheduleProgress(task, FOLLOWUP_FUNCTION_MS);
      }
    }, delay);
    task.timers.push(timer);
  }

  async invokeWithRetry(task) {
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_TOOL_RETRIES; attempt += 1) {
      if (attempt > 0) {
        const message = retryMessage(task.name, task.args);
        this.injectAgentMessage(message, "queue");
        this.sendStatus(task, "retrying", { message, attempt });
        this.sendVoiceState("tool_retrying", task);
        await wait(650, task.controller.signal);
      }

      try {
        const result = await this.invokeTool({
          id: task.id,
          name: task.name,
          arguments: task.args,
          signal: task.controller.signal,
        });
        const payload = normalizePayload(task.name, result);
        const shouldRetry = !payload.ok && payload.retryable && attempt < MAX_TOOL_RETRIES;
        if (!shouldRetry) return { result, payload };
      } catch (error) {
        lastError = error;
        if (task.controller.signal.aborted || error?.name === "AbortError") throw error;
        if (!isTransientError(error) || attempt >= MAX_TOOL_RETRIES) throw error;
      }
    }

    throw lastError || new Error("Falha ao executar ferramenta de voz.");
  }

  onUserStartedSpeaking() {
    this.lastInterruptionAt = Date.now();
    for (const task of this.tasks.values()) {
      task.interrupted = true;
    }
    this.sendClient({ type: "barge_in" });
  }

  onUserTranscript(text) {
    if (!this.tasks.size) return;
    if (Date.now() - this.lastInterruptionAt > 12_000) return;

    const intent = classifyInterruption(text);
    if (intent === "cancel") {
      for (const task of this.tasks.values()) {
        task.controller.abort("user_cancelled");
        this.sendStatus(task, "cancelling", {
          message: "Cancelando a execucao em andamento.",
        });
        this.sendVoiceState("tool_cancelling", task);
      }
      return;
    }

    if (intent === "complement") {
      for (const task of this.tasks.values()) {
        task.interrupted = false;
        this.sendStatus(task, "complement_received", {
          message: "Complemento recebido; mantendo a execucao ativa.",
        });
        this.sendVoiceState("tool_active", task);
      }
      return;
    }

    for (const task of this.tasks.values()) task.interrupted = false;
  }
}

export const __private__ = {
  normalizePayload,
  progressMessage,
  taskLabel,
  isTransientError,
};
