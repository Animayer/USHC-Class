type Cue = "click" | "card" | "bad" | "event" | "buyout" | "end";

const MUTE_KEY = "oil-baron-mute";

/**
 * Original square-wave cues and a slow drone. No samples.
 * Music stays quiet so a 20-minute class can leave it on.
 */
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
      this.master.gain.value = this.muted ? 0 : 0.18;
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
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.18;
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
    const tones: Record<Cue, number[]> = {
      click: [520],
      card: [392, 523],
      bad: [196, 155],
      event: [330, 392, 494],
      buyout: [220, 174, 130],
      end: [392, 494, 587],
    };
    tones[cue].forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16 + index * 0.08);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(now + index * 0.07);
      osc.stop(now + 0.28 + index * 0.08);
    });
  }

  private startMusic(): void {
    if (!this.unlocked || this.musicTimer || this.muted) return;
    this.musicTimer = window.setInterval(() => this.drone(), 1400);
  }

  private stopMusic(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = 0;
  }

  private drone(): void {
    if (!this.ctx || !this.master || this.muted) return;
    const notes = [196, 220, 247, 220, 175, 196];
    const freq = notes[this.step % notes.length];
    this.step += 1;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 1.15);
  }
}
