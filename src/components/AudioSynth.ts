// Beautiful procedural ambient piano synthesizer using the Web Audio API
export class AmbientAudioSynth {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying = false;
  private intervalId: any = null;
  private currentStep = 0;

  // Romantic chord progression in C Major / A Minor:
  // Fmaj9 -> G6 -> Am9 -> Em7
  private chords = [
    [41.20, 130.81, 174.61, 220.00, 329.63, 349.23], // Fmaj9 (F1, C3, F3, A3, E4, G4)
    [48.99, 146.83, 196.00, 246.94, 293.66, 392.00], // G6 (G1, D3, G3, B3, D4, G4)
    [55.00, 164.81, 220.00, 261.63, 329.63, 440.00], // Am9 (A1, E3, A3, C4, E4, A4)
    [41.20, 130.81, 164.81, 261.63, 329.63, 392.00]  // Cmaj7 (F1 -> Cmaj7 root G)
  ];

  private melodyNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // Pentatonic melody (C4-E5)

  init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      // Master Gain
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.18, this.ctx.currentTime);

      // Low Pass Filter for warm, cozy sound
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime); // Felt piano vibes
      this.filterNode.Q.setValueAtTime(1, this.ctx.currentTime);

      // Delay/Reverb Simulation
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.45, this.ctx.currentTime);

      this.feedbackNode = this.ctx.createGain();
      this.feedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);

      // Connect Delay loop
      this.delayNode.connect(this.feedbackNode);
      this.feedbackNode.connect(this.delayNode);

      // Connect overall routing:
      // Oscillators -> Filter -> MasterVolume -> Destination
      // Oscillators -> Filter -> Delay -> MasterVolume -> Destination
      this.filterNode.connect(this.masterVolume);
      this.filterNode.connect(this.delayNode);
      this.delayNode.connect(this.masterVolume);

      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser environment.", e);
    }
  }

  playNote(frequency: number, startTime: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.filterNode) return;

    // Create custom soft envelope
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Triangle + Sine for a soft glass-like felt piano timbre
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, startTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, startTime); // Harmonic overtone

    // Setup felt-like volume envelope: very quick rise, gentle release
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.4, startTime + 0.08); // Slow piano attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Long, soft ringing tail

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.filterNode);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // Plays a beautiful, soft ambient arpeggio chord + occasional melody note
  private tick() {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const chordIndex = Math.floor(this.currentStep / 4) % this.chords.length;
    const noteIndex = this.currentStep % 4;
    const chord = this.chords[chordIndex];
    const now = this.ctx.currentTime;

    // Play bass / root note
    if (noteIndex === 0) {
      this.playNote(chord[0], now, 5.0, 0.7); // Deep warm base
      setTimeout(() => {
        if (this.isPlaying) this.playNote(chord[1], now + 0.1, 4.0, 0.4);
      }, 100);
    }

    // Play harmony note
    const midNoteIndex = 2 + (this.currentStep % (chord.length - 2));
    const midNote = chord[midNoteIndex];
    this.playNote(midNote, now + (noteIndex * 0.4), 3.0, 0.3);

    // Random cinematic melody high pluck
    if (Math.random() > 0.4) {
      const melodyIndex = Math.floor(Math.random() * this.melodyNotes.length);
      const highNote = this.melodyNotes[melodyIndex];
      // Play 1 octave higher for a beautiful celestial sparkle
      this.playNote(highNote * 2, now + 1.2, 2.5, 0.25);
    }

    this.currentStep++;
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.currentStep = 0;
    
    // Immediate first beat
    this.tick();
    
    // Tick every 1.5 seconds to build overlapping loops
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1500);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setVolume(vol: number) {
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  isPlayingStatus() {
    return this.isPlaying;
  }
}
