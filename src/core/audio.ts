/**
 * Efeitos sonoros e música 100% sintetizados com Web Audio — sem arquivos.
 * O AudioContext só é criado após o primeiro clique/tecla (regra dos navegadores).
 */
type Wave = OscillatorType;

interface ToneOpts {
  wave?: Wave;
  vol?: number;
  delay?: number;
  /** Multiplicador da frequência ao final (glissando). */
  slide?: number;
  bus?: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: number | null = null;
  musicOn = true;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(master);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.2;
    this.musicBus.connect(master);
    this.ctx = ctx;
  }

  private tone(freq: number, dur: number, opts: ToneOpts = {}): void {
    const ctx = this.ctx;
    const bus = opts.bus ?? this.sfxBus;
    if (!ctx || !bus) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.wave ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * opts.slide), t0 + dur);
    const vol = opts.vol ?? 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(bus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol: number, filterFreq: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start();
  }

  pickup(): void {
    this.tone(520, 0.09, { wave: 'triangle', vol: 0.25, slide: 1.6 });
  }
  drop(): void {
    this.tone(380, 0.1, { wave: 'triangle', vol: 0.22, slide: 0.6 });
  }
  chop(): void {
    this.noise(0.06, 0.5, 2400);
    this.tone(180, 0.05, { wave: 'square', vol: 0.05 });
  }
  splash(): void {
    this.noise(0.18, 0.35, 900);
  }
  done(): void {
    this.tone(880, 0.12, { vol: 0.25 });
    this.tone(1320, 0.18, { vol: 0.2, delay: 0.08 });
  }
  order(): void {
    this.tone(660, 0.1, { wave: 'triangle', vol: 0.25 });
    this.tone(990, 0.14, { wave: 'triangle', vol: 0.22, delay: 0.09 });
  }
  serve(): void {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, { vol: 0.2, delay: i * 0.06 }));
  }
  coin(): void {
    this.tone(1320, 0.07, { wave: 'square', vol: 0.07 });
    this.tone(1760, 0.16, { wave: 'square', vol: 0.07, delay: 0.06 });
  }
  banquet(): void {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.3, { wave: 'triangle', vol: 0.18, delay: i * 0.07 }));
  }
  angry(): void {
    this.tone(220, 0.25, { wave: 'sawtooth', vol: 0.1, slide: 0.7 });
    this.tone(180, 0.3, { wave: 'sawtooth', vol: 0.08, delay: 0.15, slide: 0.7 });
  }
  arrive(): void {
    this.tone(1046, 0.25, { vol: 0.15 });
    this.tone(1318, 0.35, { vol: 0.12, delay: 0.12 });
  }
  tick(): void {
    this.tone(1400, 0.04, { wave: 'square', vol: 0.05 });
  }
  deny(): void {
    this.tone(200, 0.12, { wave: 'square', vol: 0.07 });
  }
  click(): void {
    this.tone(700, 0.06, { wave: 'triangle', vol: 0.2 });
  }
  whistle(): void {
    this.tone(1200, 0.5, { vol: 0.2, slide: 1.3 });
    this.tone(1500, 0.7, { vol: 0.18, delay: 0.5, slide: 0.8 });
  }
  swap(): void {
    this.tone(600, 0.08, { wave: 'triangle', vol: 0.18, slide: 1.4 });
  }

  /** Música de dia: arpejos pentatônicos alegres, gerados em loop. */
  startDayMusic(): void {
    this.stopMusic();
    if (!this.ctx || !this.musicOn) return;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const chords = [0, -3, 5, -5];
    const base = 392;
    const stepDur = 60 / 112 / 2;
    let step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const chord = chords[Math.floor(step / 16) % chords.length]!;
      const hz = (s: number) => base * Math.pow(2, (s + chord) / 12);
      if (step % 4 === 0) this.tone(hz(-12), stepDur * 3.5, { wave: 'triangle', vol: 0.35, bus: this.musicBus! });
      if (step % 8 === 4) this.tone(hz(-5), stepDur * 2, { wave: 'triangle', vol: 0.2, bus: this.musicBus! });
      if (Math.random() < 0.72) {
        const note = scale[(step * 3 + Math.floor(step / 8)) % scale.length]!;
        this.tone(hz(note), stepDur * 1.6, { vol: 0.2, bus: this.musicBus! });
      }
      step++;
    }, stepDur * 1000);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  toggleMusic(): boolean {
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.startDayMusic();
    else this.stopMusic();
    return this.musicOn;
  }
}

export const audio = new AudioEngine();
