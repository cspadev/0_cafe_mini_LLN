export type ToastSound = "drop" | "splat" | "student" | "chef" | "truck" | "hose";

/** Gesture-unlocked, synthesised cartoon sounds; no network or audio files. */
export class ToastAudio {
  private context: AudioContext | null = null;
  private lastSplat = 0;
  enabled = true;

  unlock() {
    if (!this.context) this.context = new AudioContext();
    void this.context.resume();
  }

  play(sound: ToastSound) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;
    if (sound === "splat" && now - this.lastSplat < 0.085) return;
    if (sound === "splat") this.lastSplat = now;
    const notes: Record<ToastSound, number[]> = {
      drop: [620, 180], splat: [150, 45], student: [420, 800, 330],
      chef: [760, 590, 880, 230], truck: [160, 200, 160], hose: [1200, 700, 350],
    };
    notes[sound].forEach((frequency, i, sequence) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.075;
      osc.type = sound === "truck" ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(frequency, start);
      osc.frequency.exponentialRampToValueAtTime(sequence[i + 1] ?? frequency / 2, start + 0.13);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(sound === "truck" ? 0.035 : 0.09, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.16);
    });
  }

  close() { void this.context?.close(); this.context = null; }
}