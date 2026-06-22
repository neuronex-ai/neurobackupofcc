import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { VoiceFunctionRunner } from "./function-runner.js";
import { isAssistantRole, isUserRole } from "./intent.js";

const PORT = Number(process.env.SYNAPSE_VOICE_GATEWAY_PORT || process.env.PORT || "8789");
const PATHNAME = process.env.SYNAPSE_VOICE_GATEWAY_PATH || "/v1/synapse/voice";
const DEFAULT_DEEPGRAM_URL = "wss://agent.deepgram.com/v1/agent/converse";

const clean = (value, max = 5000) => String(value ?? "").trim().slice(0, max);

function jsonResponse(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
}

function getFunctionsUrl() {
  return process.env.SUPABASE_FUNCTIONS_URL || `${getSupabaseUrl().replace(/\/$/, "")}/functions/v1`;
}

function getGatewaySecret() {
  return process.env.SYNAPSE_VOICE_GATEWAY_SECRET || "";
}

function parseJson(data) {
  try {
    return JSON.parse(data.toString("utf8"));
  } catch {
    return null;
  }
}

function isOpen(ws) {
  return ws && ws.readyState === WebSocket.OPEN;
}

function conversationText(event) {
  const role = clean(event?.role || event?.speaker || event?.channel?.role, 40);
  const content = clean(event?.content || event?.text || event?.transcript || event?.message, 20000);
  if (!content) return null;
  return { role, content };
}

class SynapseVoiceSession {
  constructor(client) {
    this.client = client;
    this.deepgram = null;
    this.deepgramReady = false;
    this.settingsApplied = false;
    this.started = false;
    this.closed = false;
    this.sessionId = "";
    this.authorization = "";
    this.keepAliveTimer = null;
    this.persistQueue = Promise.resolve();
    this.runner = new VoiceFunctionRunner({
      sendDeepgram: (payload) => this.sendDeepgram(payload),
      sendClient: (payload) => this.sendClient(payload),
      invokeTool: (call) => this.invokeTool(call),
    });
  }

  sendClient(payload, binary = false) {
    if (!isOpen(this.client)) return;
    if (binary) {
      this.client.send(payload, { binary: true });
      return;
    }
    this.client.send(JSON.stringify(payload));
  }

  sendDeepgram(payload, binary = false) {
    if (!isOpen(this.deepgram)) return;
    if (binary) {
      this.deepgram.send(payload, { binary: true });
      return;
    }
    this.deepgram.send(JSON.stringify(payload));
  }

  async start(payload) {
    if (this.started) return;
    this.started = true;
    this.authorization = clean(payload.authorization || payload.token, 4000);
    if (this.authorization && !this.authorization.startsWith("Bearer ")) {
      this.authorization = `Bearer ${this.authorization}`;
    }
    if (!this.authorization) throw new Error("Sessao ausente para iniciar voz.");

    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramKey) throw new Error("DEEPGRAM_API_KEY nao configurada no gateway.");
    if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
      throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY nao configurados no gateway.");
    }
    if (!getGatewaySecret()) {
      throw new Error("SYNAPSE_VOICE_GATEWAY_SECRET nao configurado no gateway e no Supabase.");
    }

    const sessionConfig = await this.fetchSessionConfig(payload);
    const settings = sessionConfig.agentSettings;
    if (!settings) throw new Error("Settings Deepgram ausentes na resposta segura do Supabase.");

    this.sessionId = clean(sessionConfig.sessionId || payload.sessionId, 120);
    this.sendClient({
      type: "gateway_status",
      status: "connecting_deepgram",
      sessionId: this.sessionId,
      provider: "deepgram-agent",
      model: sessionConfig.model,
      voiceName: sessionConfig.voiceName,
      outputSampleRate: sessionConfig.outputSampleRate,
    });

    await this.connectDeepgram(sessionConfig.deepgramUrl || DEFAULT_DEEPGRAM_URL, settings);
  }

  async fetchSessionConfig(payload) {
    const response = await fetch(`${getFunctionsUrl()}/synapse-voice-agent-session`, {
      method: "POST",
      headers: {
        Authorization: this.authorization,
        apikey: getSupabaseAnonKey(),
        "Content-Type": "application/json",
        "x-synapse-gateway-secret": getGatewaySecret(),
      },
      body: JSON.stringify({
        includeSettings: true,
        sessionId: clean(payload.sessionId, 120),
        systemInstruction: clean(payload.systemInstruction, 1600),
        context: payload.context && typeof payload.context === "object" ? payload.context : {},
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.error) {
      throw new Error(data?.error || `Falha ao criar sessao de voz (${response.status}).`);
    }
    return data;
  }

  connectDeepgram(url, settings) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
      });
      this.deepgram = ws;

      const failTimer = setTimeout(() => {
        reject(new Error("Timeout ao conectar na Deepgram."));
        this.closeDeepgram();
      }, 12000);

      ws.on("open", () => {
        this.sendClient({ type: "gateway_status", status: "waiting_welcome" });
      });

      ws.on("message", (data, isBinary) => {
        if (isBinary) {
          this.sendClient(data, true);
          return;
        }

        const event = parseJson(data);
        if (!event) return;
        this.handleDeepgramEvent(event, settings);

        if (event.type === "SettingsApplied" && !this.settingsApplied) {
          this.settingsApplied = true;
          clearTimeout(failTimer);
          this.startKeepAlive();
          resolve();
        }
      });

      ws.on("close", (code, reason) => {
        clearTimeout(failTimer);
        this.deepgramReady = false;
        this.settingsApplied = false;
        this.sendClient({
          type: "gateway_status",
          status: "deepgram_closed",
          code,
          reason: reason?.toString?.() || "",
        });
      });

      ws.on("error", (error) => {
        clearTimeout(failTimer);
        this.sendClient({
          type: "gateway_error",
          error: clean(error?.message || "Erro no WebSocket da Deepgram.", 800),
        });
        reject(error);
      });
    });
  }

  handleDeepgramEvent(event, settings) {
    this.sendClient({ type: "deepgram_event", event });

    switch (event.type) {
      case "Welcome":
        this.deepgramReady = true;
        this.sendDeepgram(settings);
        this.sendClient({ type: "gateway_status", status: "settings_sent" });
        break;
      case "SettingsApplied":
        this.settingsApplied = true;
        this.sendClient({
          type: "gateway_status",
          status: "ready",
          sessionId: this.sessionId,
        });
        break;
      case "FunctionCallRequest":
        void this.runner.handleFunctionCallRequest(event);
        break;
      case "UserStartedSpeaking":
      case "AgentAudioInterrupted":
        this.runner.onUserStartedSpeaking();
        break;
      case "ConversationText": {
        const text = conversationText(event);
        if (!text) break;
        if (isUserRole(text.role)) this.runner.onUserTranscript(text.content);
        if (isUserRole(text.role) || isAssistantRole(text.role)) {
          void this.persistMessage(text.role, text.content);
        }
        break;
      }
      case "Error":
      case "Warning":
        this.sendClient({
          type: event.type === "Error" ? "gateway_error" : "gateway_warning",
          error: clean(event.description || event.message || event.error, 1000),
          event,
        });
        break;
      default:
        break;
    }
  }

  async invokeTool({ id, name, arguments: args, signal }) {
    const response = await fetch(`${getFunctionsUrl()}/synapse-voice-tool`, {
      method: "POST",
      headers: {
        Authorization: this.authorization,
        apikey: getSupabaseAnonKey(),
        "Content-Type": "application/json",
        "x-synapse-gateway-secret": getGatewaySecret(),
      },
      signal,
      body: JSON.stringify({
        action: "execute_tool",
        callId: id,
        sessionId: this.sessionId,
        name,
        arguments: args,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.error) {
      throw new Error(data?.error || `Falha na ferramenta ${name} (${response.status}).`);
    }
    return data;
  }

  persistMessage(role, content) {
    const normalizedRole = isUserRole(role) ? "user" : isAssistantRole(role) ? "assistant" : "";
    const text = clean(content, 20000);
    if (!normalizedRole || !text || !this.sessionId) return Promise.resolve();

    this.persistQueue = this.persistQueue.catch(() => undefined).then(async () => {
      const response = await fetch(`${getFunctionsUrl()}/synapse-voice-tool`, {
        method: "POST",
        headers: {
          Authorization: this.authorization,
          apikey: getSupabaseAnonKey(),
          "Content-Type": "application/json",
          "x-synapse-gateway-secret": getGatewaySecret(),
        },
        body: JSON.stringify({
          action: "persist_message",
          sessionId: this.sessionId,
          role: normalizedRole,
          content: text,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn("[voice-agent-gateway] persist failed", data?.error || response.status);
      }
    });
    return this.persistQueue;
  }

  injectUserMessage(message) {
    const text = clean(message, 2000);
    if (!text) return;
    this.sendDeepgram({ type: "InjectUserMessage", message: text });
  }

  startKeepAlive() {
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => {
      this.sendDeepgram({ type: "AgentKeepAlive" });
    }, 8000);
  }

  handleClientMessage(data, isBinary) {
    if (isBinary) {
      if (this.settingsApplied) this.sendDeepgram(data, true);
      return;
    }

    const payload = parseJson(data);
    if (!payload) return;

    if (payload.type === "start") {
      this.start(payload).catch((error) => {
        this.sendClient({
          type: "gateway_error",
          error: clean(error?.message || "Nao foi possivel iniciar voz.", 1000),
        });
        this.close();
      });
      return;
    }

    if (payload.type === "inject_user_message") {
      this.injectUserMessage(payload.message);
      return;
    }

    if (payload.type === "update_speak" && payload.speak) {
      this.sendDeepgram({ type: "UpdateSpeak", speak: payload.speak });
      return;
    }

    if (payload.type === "update_think" && payload.think) {
      this.sendDeepgram({ type: "UpdateThink", think: payload.think });
      return;
    }

    if (payload.type === "stop") {
      this.close();
    }
  }

  closeDeepgram() {
    if (isOpen(this.deepgram)) this.deepgram.close(1000, "client_closed");
    this.deepgram = null;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.keepAliveTimer);
    this.closeDeepgram();
    if (isOpen(this.client)) this.client.close(1000, "session_closed");
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === `${PATHNAME}/health`) {
    jsonResponse(res, 200, {
      ok: true,
      service: "synapse-voice-agent-gateway",
      deepgramConfigured: Boolean(process.env.DEEPGRAM_API_KEY),
      supabaseConfigured: Boolean(getSupabaseUrl() && getSupabaseAnonKey()),
      gatewaySecretConfigured: Boolean(getGatewaySecret()),
    });
    return;
  }
  jsonResponse(res, 404, { error: "Not found" });
});

const wss = new WebSocketServer({ server, path: PATHNAME });

wss.on("connection", (client) => {
  const session = new SynapseVoiceSession(client);
  client.on("message", (data, isBinary) => session.handleClientMessage(data, isBinary));
  client.on("close", () => session.close());
  client.on("error", () => session.close());
});

server.listen(PORT, () => {
  console.log(`[voice-agent-gateway] listening on ws://localhost:${PORT}${PATHNAME}`);
});
