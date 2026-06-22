type PlaybackCallback = () => void;

const int16ToFloat32 = (buffer: ArrayBuffer) => {
  const view = new DataView(buffer);
  const samples = new Float32Array(Math.floor(buffer.byteLength / 2));
  for (let index = 0; index < samples.length; index += 1) {
    const value = view.getInt16(index * 2, true);
    samples[index] = Math.max(-1, Math.min(1, value / 32768));
  }
  return samples;
};

export class PcmAudioPlayer {
  private context: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private playing = false;

  constructor(
    private readonly sampleRate = 24000,
    private readonly onStart?: PlaybackCallback,
    private readonly onEnd?: PlaybackCallback,
  ) {}

  private ensureContext() {
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext({ sampleRate: this.sampleRate });
      this.nextStartTime = this.context.currentTime;
    }
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }

  enqueue(chunk: ArrayBuffer) {
    if (!chunk.byteLength) return;
    const context = this.ensureContext();
    const samples = int16ToFloat32(chunk);
    if (!samples.length) return;

    const audioBuffer = context.createBuffer(1, samples.length, this.sampleRate);
    audioBuffer.copyToChannel(samples, 0);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);

    if (!this.playing) {
      this.playing = true;
      this.onStart?.();
    }

    const startAt = Math.max(this.nextStartTime, context.currentTime + 0.012);
    source.start(startAt);
    this.nextStartTime = startAt + audioBuffer.duration;
    this.activeSources.add(source);

    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0) {
        this.playing = false;
        this.nextStartTime = context.currentTime;
        this.onEnd?.();
      }
    };
  }

  stop() {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Source may already have ended.
      }
    }
    this.activeSources.clear();
    if (this.context) this.nextStartTime = this.context.currentTime;
    if (this.playing) {
      this.playing = false;
      this.onEnd?.();
    }
  }

  async close() {
    this.stop();
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
  }
}
