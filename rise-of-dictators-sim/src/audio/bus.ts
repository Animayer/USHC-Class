type Cue = "click" | "paper" | "dice" | "correct" | "wrong" | "solemn" | "era";

const MUTE_KEY = "rise-dictators-mute";

/** Original synthesis. No samples. Quiet enough for a class period. */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted: boolean;
  private musicTimer = 0;
  private step = 0;
  private unlocked = false;

  constructor() {
    this.muted = false;
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      this.muted = false;
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  unlock(): void {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.16;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.unlocked = true;
    if (!this.muted) this.startMusic();
  }

  toggle(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0");
    } catch {
      /* private mode */
    }
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.muted ? 0 : 0.16, now);
    }
    if (this.muted) this.stopMusic();
    else {
      this.unlock();
      this.startMusic();
    }
    return this.muted;
  }

  play(cue: Cue): void {
    if (this.muted || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const tones: Record<Cue, { freq: number; type: OscillatorType; dur: number }[]> = {
      click: [{ freq: 520, type: "square", dur: 0.08 }],
      paper: [
        { freq: 330, type: "triangle", dur: 0.12 },
        { freq: 494, type: "triangle", dur: 0.16 },
      ],
      dice: [
        { freq: 180, type: "square", dur: 0.07 },
        { freq: 140, type: "square", dur: 0.07 },
      ],
      correct: [
        { freq: 392, type: "triangle", dur: 0.12 },
        { freq: 523, type: "triangle", dur: 0.16 },
      ],
      wrong: [{ freq: 146, type: "triangle", dur: 0.18 }],
      solemn: [{ freq: 110, type: "sine", dur: 0.4 }],
      era: [
        { freq: 196, type: "triangle", dur: 0.14 },
        { freq: 247, type: "triangle", dur: 0.2 },
      ],
    };
    tones[cue].forEach((tone, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = tone.type;
      osc.frequency.value = tone.freq;
      const start = now + index * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(cue === "solemn" ? 0.03 : 0.05, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(start);
      osc.stop(start + tone.dur + 0.02);
    });
  }

  private startMusic(): void {
    if (!this.unlocked || this.musicTimer || this.muted) return;
    this.musicTimer = window.setInterval(() => this.phrase(), 520);
  }

  private stopMusic(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = 0;
  }

  private phrase(): void {
    if (!this.ctx || !this.master || this.muted) return;
    const melody = [220, 262, 294, 262, 196, 220, 247, 175];
    const freq = melody[this.step % melody.length];
    this.step += 1;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.45);
    if (this.step % 4 === 0) {
      const drone = this.ctx.createOscillator();
      const dGain = this.ctx.createGain();
      drone.type = "sine";
      drone.frequency.value = 110;
      dGain.gain.setValueAtTime(0.0001, now);
      dGain.gain.exponentialRampToValueAtTime(0.02, now + 0.08);
      dGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      drone.connect(dGain);
      dGain.connect(this.master);
      drone.start(now);
      drone.stop(now + 1.45);
    }
  }
}
