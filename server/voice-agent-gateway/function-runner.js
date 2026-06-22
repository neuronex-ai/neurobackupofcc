import { classifyInterruption } from "./intent.js";

const SLOW_FUNCTION_MS = Number(process.env.SYNAPSE_VOICE_SLOW_FUNCTION_MS || "2500");
const FOLLOWUP_FUNCTION_MS = Number(process.env.SYNAPSE_VOICE_FOLLOWUP_FUNCTION_MS || "8000");
const MAX_PROGRESS_MESSAGES = Number(process.env.SYNAPSE_VOICE_MAX_PROGRESS_MESSAGES || "2");

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

function taskLabel(name, args) {
  const patient = clean(args.patient_name || args.patientName, 120);
  if (patient) return `${name.replace(/_/g, " ")} de ${patient}`;
  return name.replace(/_/g, " ");
}

function progressMessage(name, args, count) {
  const patient = clean(args.patient_name || args.patientName, 120);
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

function fillerMessage(args) {
  const task = clean(args.task_label, 160) || "isso";
  const patient = clean(args.patient_name || args.patientName, 120);
  return patient
    ? `So um instante, vou conferir ${task} de ${patient}.`
    : `So um instante, vou conferir ${task}.`;
}

export class VoiceFunctionRunner {
  constructor({ sendDeepgram, sendClient, invokeTool }) {
    this.sendDeepgram = sendDeepgram;
    this.sendClient = sendClient;
    this.invokeTool = invokeTool;
    this.tasks = new Map();
    this.lastInterruptionAt = 0;
  }

  injectAgentMessage(message, behavior = "queue") {
    const text = clean(message, 420);
    if (!text) return;
    this.sendDeepgram({
      type: "InjectAgentMessage",
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

  async handleFunctionCallRequest(event) {
    const functions = Array.isArray(event?.functions) ? event.functions : [];
    await Promise.all(functions.map((fn) => this.runFunction(fn)));
  }

  async runFunction(fn) {
    const id = clean(fn?.id || crypto.randomUUID(), 120);
    const name = clean(fn?.name, 120);
    const args = safeJsonParse(fn?.arguments);
    if (!name) return;

    if (name === "synapse_progress_feedback") {
      const message = fillerMessage(args);
      this.injectAgentMessage(message, "queue");
      this.sendFunctionResponse(id, name, { ok: true, message });
      return;
    }

    const controller = new AbortController();
    const task = {
      id,
      name,
      args,
      controller,
      startedAt: Date.now(),
      progressCount: 0,
      timers: [],
      interrupted: false,
    };
    this.tasks.set(id, task);
    this.sendClient({
      type: "function_status",
      status: "started",
      id,
      name,
      label: taskLabel(name, args),
    });

    const scheduleProgress = (delay) => {
      const timer = setTimeout(() => {
        if (!this.tasks.has(id) || controller.signal.aborted) return;
        if (task.interrupted) return;
        const message = progressMessage(name, args, task.progressCount);
        task.progressCount += 1;
        this.injectAgentMessage(message, "queue");
        this.sendClient({
          type: "function_status",
          status: "progress",
          id,
          name,
          message,
        });
        if (task.progressCount < MAX_PROGRESS_MESSAGES) scheduleProgress(FOLLOWUP_FUNCTION_MS);
      }, delay);
      task.timers.push(timer);
    };

    scheduleProgress(SLOW_FUNCTION_MS);

    try {
      const result = await this.invokeTool({
        id,
        name,
        arguments: args,
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        this.sendFunctionResponse(id, name, {
          ok: false,
          cancelled: true,
          message: "A acao foi cancelada pelo usuario antes de concluir.",
        });
        return;
      }

      if (result?.clientAction) {
        this.sendClient({ type: "client_action", action: result.clientAction });
      }
      this.sendFunctionResponse(id, name, result?.content || {
        ok: true,
        message: "Ferramenta concluida.",
      });
      this.sendClient({
        type: "function_status",
        status: "completed",
        id,
        name,
      });
    } catch (error) {
      const aborted = controller.signal.aborted || error?.name === "AbortError";
      this.sendFunctionResponse(id, name, {
        ok: false,
        cancelled: aborted,
        message: aborted
          ? "A acao foi cancelada pelo usuario antes de concluir."
          : clean(error?.message || "Falha ao executar ferramenta de voz.", 600),
      });
      this.sendClient({
        type: "function_status",
        status: aborted ? "cancelled" : "failed",
        id,
        name,
        error: clean(error?.message || "", 600),
      });
    } finally {
      for (const timer of task.timers) clearTimeout(timer);
      this.tasks.delete(id);
    }
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
      }
      this.sendClient({
        type: "function_status",
        status: "cancelling",
        message: "Cancelando a execucao em andamento.",
      });
      return;
    }

    if (intent === "complement") {
      for (const task of this.tasks.values()) task.interrupted = false;
      this.sendClient({
        type: "function_status",
        status: "complement",
        message: "Complemento recebido; mantendo a execucao ativa.",
      });
      return;
    }

    for (const task of this.tasks.values()) task.interrupted = false;
  }
}
