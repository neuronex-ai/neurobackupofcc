// src/lib/gemini-live-client.ts

export type GeminiLiveStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ToolCallHandler = (name: string, params: unknown) => Promise<unknown> | unknown;

type GeminiFunctionCall = {
    id?: string;
    name: string;
    args?: unknown;
};

type GeminiLivePart = {
    inlineData?: {
        mimeType?: string;
        data: string;
    };
    functionCall?: GeminiFunctionCall;
};

type GeminiLiveMessage = {
    setupComplete?: boolean;
    serverContent?: {
        modelTurn?: {
            parts?: GeminiLivePart[];
        };
        turnComplete?: boolean;
        interrupted?: boolean;
    };
    error?: {
        message?: string;
    };
};

type GeminiSetupMessage = {
    setup: {
        model: string;
        generationConfig: {
            responseModalities: string[];
            temperature: number;
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: string;
                    };
                };
            };
        };
        systemInstruction?: {
            parts: Array<{ text: string }>;
        };
        tools?: Array<{ functionDeclarations: unknown[] }>;
    };
};

export interface GeminiClientOptions {
    token: string;
    model?: string;
    systemInstruction?: string;
    tools?: unknown[];
    onStatusChange?: (status: GeminiLiveStatus) => void;
    onSpeechStatusChange?: (isSpeaking: boolean) => void;
    onVolumeChange?: (volume: number) => void;
    onToolCall?: ToolCallHandler;
    onError?: (error: Error) => void;
}

const AudioWorkletRawCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      // Post float32 data
      this.port.postMessage(channelData);
    }
    return true;
  }
}
registerProcessor('recorder-worklet', RecorderProcessor);
`;

export class GeminiLiveClient {
    private ws: WebSocket | null = null;
    private options: GeminiClientOptions;
    private audioContext: AudioContext | null = null;
    private microphoneStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private analyser: AnalyserNode | null = null;

    private activeAudioSources: AudioBufferSourceNode[] = [];
    private nextPlayTime = 0;
    private isSpeaking = false;
    private setupCompleted = false;

    constructor(options: GeminiClientOptions) {
        this.options = options;
    }

    public async connect() {
        if (this.ws) return;
        this.setupCompleted = false;
        this.options.onStatusChange?.('connecting');

        try {
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(this.options.token)}`;
            this.ws = new WebSocket(url);

            this.ws.onopen = this.handleSocketOpen.bind(this);
            this.ws.onmessage = this.handleSocketMessage.bind(this);
            this.ws.onclose = this.handleSocketClose.bind(this);
            this.ws.onerror = this.handleSocketError.bind(this);

            await this.initMicrophone();

            // Set up volume polling
            this.pollVolume();
        } catch (e: unknown) {
            this.handleSocketError(e);
        }
    }

    public disconnect() {
        this.setupCompleted = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(t => t.stop());
            this.microphoneStream = null;
        }
        this.options.onStatusChange?.('disconnected');
        this.setIsSpeaking(false);
    }

    public getStatus(): GeminiLiveStatus {
        if (!this.ws) return 'disconnected';
        if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
        if (this.ws.readyState === WebSocket.OPEN && this.setupCompleted) return 'connected';
        if (this.ws.readyState === WebSocket.OPEN) return 'connecting';
        return 'disconnected';
    }

    private setIsSpeaking(val: boolean) {
        if (this.isSpeaking !== val) {
            this.isSpeaking = val;
            this.options.onSpeechStatusChange?.(val);
        }
    }

    private handleSocketOpen() {
        // Do NOT set connected yet — must wait for setupComplete from server
        // Send Initial Setup
        const msg: GeminiSetupMessage = {
            setup: {
                model: `models/${this.options.model || 'gemini-3.1-flash-live-preview'}`,
                generationConfig: {
                    responseModalities: ['AUDIO'],
                    temperature: 0.5,
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Puck"
                            }
                        }
                    }
                }
            }
        };

        if (this.options.systemInstruction) {
            msg.setup.systemInstruction = {
                parts: [{ text: this.options.systemInstruction }]
            };
        }

        if (this.options.tools && this.options.tools.length > 0) {
            msg.setup.tools = [{
                functionDeclarations: this.options.tools
            }];
        }

        this.ws?.send(JSON.stringify(msg));
        // Do NOT send audio here — wait for setupComplete
    }

    private handleSocketMessage(evt: MessageEvent) {
        let msg: GeminiLiveMessage;
        if (typeof evt.data === 'string') {
            msg = JSON.parse(evt.data) as GeminiLiveMessage;
        } else {
            // It might be a Blob if we set binaryType, but Gemini uses stringified JSON or base64 JSON
            const reader = new FileReader();
            reader.onload = () => {
                this.handleSocketMessage(new MessageEvent('message', { data: reader.result }));
            };
            reader.readAsText(evt.data);
            return;
        }

        // Handle setupComplete — this is the critical handshake step
        if (msg.setupComplete) {
            this.setupCompleted = true;
            this.options.onStatusChange?.('connected');
            // Now we can start sending audio
            this.sendAudioChunk(new Int16Array(0));
            return;
        }

        if (msg.serverContent?.modelTurn) {
            const parts = msg.serverContent.modelTurn.parts || [];
            for (const part of parts) {
                if (part.inlineData?.mimeType.startsWith('audio/pcm')) {
                    this.playReceivedAudio(part.inlineData.data);
                } else if (part.functionCall) {
                    this.executeTool(part.functionCall);
                }
            }
        }

        // Turn complete signal
        if (msg.serverContent?.turnComplete) {
            return;
        }

        // Interrupt signal from server
        if (msg.serverContent?.interrupted) {
            this.activeAudioSources.forEach(s => s.stop());
            this.activeAudioSources = [];
            this.nextPlayTime = 0;
            this.setIsSpeaking(false);
        }

        // Error handling
        if (msg.error) {
            this.options.onError?.(new Error(msg.error.message || "Erro no Live API"));
        }
    }

    private async executeTool(functionCall: GeminiFunctionCall) {
        // Stop playing audio while executing tools
        if (this.options.onToolCall) {
            try {
                const params = functionCall.args || {};
                const name = functionCall.name;
                const result = await this.options.onToolCall(name, params);

                // Return result to Gemini
                this.ws?.send(JSON.stringify({
                    toolResponse: {
                        functionResponses: [{
                            id: functionCall.id,
                            name: functionCall.name,
                            response: { result: typeof result === 'string' ? JSON.parse(result) : result }
                        }]
                    }
                }));
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Tool execution failed";
                this.ws?.send(JSON.stringify({
                    toolResponse: {
                        functionResponses: [{
                            id: functionCall.id,
                            name: functionCall.name,
                            response: { error: message }
                        }]
                    }
                }));
            }
        }
    }

    private handleSocketClose() {
        this.options.onStatusChange?.('disconnected');
        this.disconnect();
    }

    private handleSocketError(_err: unknown) {
        this.options.onError?.(new Error("Conexão falhou com a IA de áudio"));
        this.options.onStatusChange?.('error');
    }

    // Audio Input processing
    private async initMicrophone() {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000,
                channelCount: 1,
            }
        });

        this.audioContext = new AudioContext({ sampleRate: 16000 });

        // Prepare analyser for UI visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        // Worklet for capturing
        const blob = new Blob([AudioWorkletRawCode], { type: 'application/javascript' });
        const objectUrl = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(objectUrl);
        URL.revokeObjectURL(objectUrl);

        this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-worklet');
        const source = this.audioContext.createMediaStreamSource(this.microphoneStream);

        source.connect(this.analyser);
        this.analyser.connect(this.workletNode);
        this.workletNode.connect(this.audioContext.destination);

        this.workletNode.port.onmessage = this.processLocalAudio.bind(this);
    }

    private processLocalAudio(e: MessageEvent) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.setupCompleted) return;

        const floatData = e.data as Float32Array;
        // Gemini expects 16kHz PCM Int16
        const pcm16 = new Int16Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
            const s = Math.max(-1, Math.min(1, floatData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        this.sendAudioChunk(pcm16);
    }

    private sendAudioChunk(pcm16: Int16Array) {
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        const b64 = btoa(binary);

        this.ws?.send(JSON.stringify({
            realtimeInput: {
                mediaChunks: [{
                    mimeType: "audio/pcm;rate=16000",
                    data: b64
                }]
            }
        }));
    }

    // Audio Output processing
    private playReceivedAudio(b64Data: string) {
        if (!this.audioContext) return;
        this.setIsSpeaking(true);

        const binary = atob(b64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000); // Gemini responses are standard 24kHz natively.
        audioBuffer.getChannelData(0).set(float32);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        // Schedule playback linearly
        const currentTime = this.audioContext.currentTime;
        if (this.nextPlayTime < currentTime) {
            this.nextPlayTime = currentTime;
        }
        source.start(this.nextPlayTime);
        this.nextPlayTime += audioBuffer.duration;

        source.onended = () => {
            // Request array cleanup
            this.activeAudioSources = this.activeAudioSources.filter(s => s !== source);

            // If this is the last chunk, we stop speaking
            if (this.audioContext && this.audioContext.currentTime >= this.nextPlayTime - 0.1) {
                this.setIsSpeaking(false);
            }
        };

        this.activeAudioSources.push(source);
    }

    private pollVolume() {
        if (!this.analyser) return;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkVolume = () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.analyser?.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const vol = sum / dataArray.length;
                this.options.onVolumeChange?.(Math.min(1, vol / 50)); // Normalize 0..1

                requestAnimationFrame(checkVolume);
            }
        };
        checkVolume();
    }
}
