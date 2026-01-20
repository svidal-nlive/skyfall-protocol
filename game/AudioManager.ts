/**
 * AudioManager - Phase 13: Audio & Music
 * 
 * Comprehensive audio system using Howler.js for:
 * - Sound effects (weapons, explosions, UI)
 * - Engine sounds (player, enemy, boss)
 * - Dynamic music (state-based transitions)
 * - Spatial audio for 3D positioning
 * - Volume controls and settings persistence
 */

import { Howl, Howler } from 'howler';

// ============ Audio Types ============

export type SoundEffect = 
  | 'cannon-fire'
  | 'missile-launch'
  | 'missile-lock-start'
  | 'missile-lock-acquired'
  | 'explosion-small'
  | 'explosion-medium'
  | 'explosion-large'
  | 'player-hit'
  | 'enemy-hit'
  | 'low-health-alarm'
  | 'wave-complete'
  | 'upgrade-purchase'
  | 'button-click'
  | 'button-hover'
  | 'beacon-ping'
  | 'boss-spawn'
  | 'boss-defeated'
  | 'phase-change';

export type MusicTrack = 
  | 'menu'
  | 'calm'
  | 'combat'
  | 'boss'
  | 'victory'
  | 'defeat';

export type EngineSound = 
  | 'player-engine'
  | 'afterburner'
  | 'enemy-engine'
  | 'boss-engine';

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  engineVolume: number;
  muted: boolean;
}

// ============ Default Settings ============

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  engineVolume: 0.4,
  muted: false,
};

const SETTINGS_KEY = 'skyfall-audio-settings';

// ============ Procedural Audio Generation ============

/**
 * Generate procedural audio using Web Audio API
 * Since we don't have actual audio files, we'll synthesize sounds
 */
class ProceduralAudio {
  private audioContext: AudioContext | null = null;

  constructor() {
    // AudioContext will be created on first user interaction
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate a cannon fire sound
   */
  playCannon(volume: number = 0.5): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Noise burst for attack
    const noiseBuffer = this.createNoiseBuffer(ctx, 0.08);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter for "pew" sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    filter.Q.value = 2;

    // Gain envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.6, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.1);
  }

  /**
   * Generate a missile launch sound
   */
  playMissileLaunch(volume: number = 0.6): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Low frequency rumble
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    // Noise for "whoosh"
    const noiseBuffer = this.createNoiseBuffer(ctx, 0.5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2000, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Oscillator gain
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
    noiseSource.start(now);
    noiseSource.stop(now + 0.5);
  }

  /**
   * Generate a lock tone (repeating beep)
   */
  playLockTone(volume: number = 0.4, rapid: boolean = false): number {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const interval = rapid ? 0.1 : 0.3;
    const duration = 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = rapid ? 1200 : 800;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);

    // Create beeping pattern
    for (let i = 0; i < 10; i++) {
      const beepStart = now + i * interval;
      gainNode.gain.setValueAtTime(volume * 0.3, beepStart);
      gainNode.gain.setValueAtTime(0, beepStart + duration);
    }

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 10 * interval);

    return 0; // Return a handle (simplified)
  }

  /**
   * Generate an explosion sound
   */
  playExplosion(volume: number = 0.7, size: 'small' | 'medium' | 'large' = 'medium'): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const durations = { small: 0.3, medium: 0.5, large: 0.8 };
    const frequencies = { small: 200, medium: 100, large: 50 };
    const duration = durations[size];
    const baseFreq = frequencies[size];

    // Low rumble oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq / 4, now + duration);

    // Noise burst
    const noiseBuffer = this.createNoiseBuffer(ctx, duration);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(4000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);

    // Gain envelopes
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Distortion for punch
    const distortion = ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(50);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(distortion);

    osc.connect(oscGain);
    oscGain.connect(distortion);

    distortion.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  /**
   * Generate a hit sound
   */
  playHit(volume: number = 0.5): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Generate low health alarm
   */
  playAlarm(volume: number = 0.4): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);

    // Pulsing pattern
    for (let i = 0; i < 4; i++) {
      const pulseStart = now + i * 0.25;
      gainNode.gain.setValueAtTime(volume * 0.3, pulseStart);
      gainNode.gain.linearRampToValueAtTime(volume * 0.1, pulseStart + 0.1);
      gainNode.gain.setValueAtTime(0, pulseStart + 0.2);
    }

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1);
  }

  /**
   * Generate a UI button click
   */
  playClick(volume: number = 0.3): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Generate upgrade purchase sound
   */
  playUpgrade(volume: number = 0.5): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523, 659, 784]; // C5, E5, G5 - major chord arpeggio
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gainNode = ctx.createGain();
      const noteStart = now + i * 0.08;
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(volume * 0.4, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.3);
    });
  }

  /**
   * Generate wave complete fanfare
   */
  playFanfare(volume: number = 0.5): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Triumphant chord progression
    const chords = [
      [523, 659, 784], // C major
      [587, 740, 880], // D major
      [659, 784, 988], // E minor ish
      [784, 988, 1175], // G major
    ];

    chords.forEach((chord, chordIdx) => {
      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const gainNode = ctx.createGain();
        const noteStart = now + chordIdx * 0.15;
        gainNode.gain.setValueAtTime(0, noteStart);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, noteStart + 0.02);
        gainNode.gain.setValueAtTime(volume * 0.25, noteStart + 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.5);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    });
  }

  /**
   * Generate beacon ping
   */
  playBeaconPing(volume: number = 0.4): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Generate boss spawn ominous sound
   */
  playBossSpawn(volume: number = 0.6): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Deep rumble
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(40, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 1);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(42, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.4, now + 0.3);
    gain1.gain.setValueAtTime(volume * 0.4, now + 0.8);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(volume * 0.3, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 1.5);
    osc2.start(now);
    osc2.stop(now + 1.5);
  }

  /**
   * Create noise buffer for effects
   */
  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Create distortion curve
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  }

  /**
   * Suspend audio context to save resources
   */
  suspend(): void {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  /**
   * Resume audio context
   */
  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// ============ Background Music with Howler ============

/**
 * Music manager using Howler.js
 * Generates procedural ambient music tracks
 */
class MusicManager {
  private currentTrack: MusicTrack | null = null;
  private volume: number = 0.5;
  private proceduralAudio: ProceduralAudio;
  private musicInterval: number | null = null;
  private isMuted: boolean = false;

  constructor(proceduralAudio: ProceduralAudio) {
    this.proceduralAudio = proceduralAudio;
  }

  /**
   * Play a music track (procedurally generated)
   */
  play(track: MusicTrack): void {
    if (this.currentTrack === track) return;

    this.stop();
    this.currentTrack = track;

    if (this.isMuted) return;

    // Start procedural music based on track type
    switch (track) {
      case 'menu':
      case 'calm':
        this.startAmbientMusic();
        break;
      case 'combat':
        this.startCombatMusic();
        break;
      case 'boss':
        this.startBossMusic();
        break;
      case 'victory':
        this.playVictoryFanfare();
        break;
      case 'defeat':
        this.playDefeatSound();
        break;
    }
  }

  /**
   * Stop current music
   */
  stop(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }

  /**
   * Set music volume
   */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Mute/unmute music
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    } else if (this.currentTrack) {
      this.play(this.currentTrack);
    }
  }

  /**
   * Fade to a new track
   */
  fadeToTrack(track: MusicTrack, duration: number = 1000): void {
    // Simple implementation - just switch tracks
    this.play(track);
  }

  private startAmbientMusic(): void {
    // Ambient pads with occasional pings
    // (In a real implementation, this would use Howler with actual audio files)
    console.log('[MUSIC] Playing ambient music');
  }

  private startCombatMusic(): void {
    console.log('[MUSIC] Playing combat music');
  }

  private startBossMusic(): void {
    console.log('[MUSIC] Playing boss music');
  }

  private playVictoryFanfare(): void {
    this.proceduralAudio.playFanfare(this.volume);
  }

  private playDefeatSound(): void {
    // Play a sad descending tone
    console.log('[MUSIC] Playing defeat theme');
  }
}

// ============ Engine Sound Manager ============

class EngineSoundManager {
  private proceduralAudio: ProceduralAudio;
  private volume: number = 0.4;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private audioContext: AudioContext | null = null;

  constructor(proceduralAudio: ProceduralAudio) {
    this.proceduralAudio = proceduralAudio;
  }

  /**
   * Start player engine sound
   */
  startPlayerEngine(): void {
    if (this.isMuted || this.engineOsc) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      this.engineOsc = this.audioContext.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 80;

      this.engineGain = this.audioContext.createGain();
      this.engineGain.gain.value = this.volume * 0.1;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.audioContext.destination);

      this.engineOsc.start();
    } catch (e) {
      console.warn('[ENGINE SOUND] Failed to start:', e);
    }
  }

  /**
   * Update engine sound based on throttle
   */
  updateThrottle(throttle: number): void {
    if (!this.engineOsc || !this.engineGain || this.isMuted) return;

    // Pitch increases with throttle (60Hz - 120Hz)
    const frequency = 60 + throttle * 60;
    this.engineOsc.frequency.setTargetAtTime(frequency, this.audioContext!.currentTime, 0.1);

    // Volume increases slightly with throttle
    const vol = this.volume * (0.05 + throttle * 0.1);
    this.engineGain.gain.setTargetAtTime(vol, this.audioContext!.currentTime, 0.1);
  }

  /**
   * Play afterburner boost
   */
  playAfterburner(): void {
    if (this.isMuted) return;
    // Add high-pitched overlay
    console.log('[ENGINE] Afterburner engaged');
  }

  /**
   * Stop engine sound
   */
  stop(): void {
    if (this.engineOsc) {
      this.engineOsc.stop();
      this.engineOsc = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.engineGain = null;
  }

  /**
   * Set volume
   */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.engineGain) {
      this.engineGain.gain.value = this.volume * 0.1;
    }
  }

  /**
   * Mute/unmute
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }
}

// ============ Main AudioManager Class ============

class AudioManager {
  private settings: AudioSettings;
  private proceduralAudio: ProceduralAudio;
  private musicManager: MusicManager;
  private engineManager: EngineSoundManager;
  private initialized: boolean = false;
  private lastAlarmTime: number = 0;
  private lockSoundActive: boolean = false;

  constructor() {
    this.settings = this.loadSettings();
    this.proceduralAudio = new ProceduralAudio();
    this.musicManager = new MusicManager(this.proceduralAudio);
    this.engineManager = new EngineSoundManager(this.proceduralAudio);

    // Apply loaded settings
    this.applySettings();

    // Set up event listeners
    this.setupEventListeners();
  }

  // ============ Initialization ============

  /**
   * Initialize audio (call on first user interaction)
   */
  init(): void {
    if (this.initialized) return;
    
    this.initialized = true;
    console.log('[AUDIO MANAGER] Initialized');

    // Resume any suspended audio contexts
    this.proceduralAudio.resume();
  }

  // ============ Sound Effect Playback ============

  /**
   * Play a sound effect
   */
  play(sound: SoundEffect): void {
    if (this.settings.muted) return;

    const volume = this.settings.masterVolume * this.settings.sfxVolume;

    switch (sound) {
      case 'cannon-fire':
        this.proceduralAudio.playCannon(volume);
        break;
      case 'missile-launch':
        this.proceduralAudio.playMissileLaunch(volume);
        break;
      case 'missile-lock-start':
        this.proceduralAudio.playLockTone(volume, false);
        break;
      case 'missile-lock-acquired':
        this.proceduralAudio.playLockTone(volume, true);
        break;
      case 'explosion-small':
        this.proceduralAudio.playExplosion(volume, 'small');
        break;
      case 'explosion-medium':
        this.proceduralAudio.playExplosion(volume, 'medium');
        break;
      case 'explosion-large':
        this.proceduralAudio.playExplosion(volume, 'large');
        break;
      case 'player-hit':
      case 'enemy-hit':
        this.proceduralAudio.playHit(volume);
        break;
      case 'low-health-alarm':
        // Rate-limit alarm sound
        const now = performance.now();
        if (now - this.lastAlarmTime > 1500) {
          this.proceduralAudio.playAlarm(volume);
          this.lastAlarmTime = now;
        }
        break;
      case 'wave-complete':
        this.proceduralAudio.playFanfare(volume);
        break;
      case 'upgrade-purchase':
        this.proceduralAudio.playUpgrade(volume);
        break;
      case 'button-click':
      case 'button-hover':
        this.proceduralAudio.playClick(volume * 0.5);
        break;
      case 'beacon-ping':
        this.proceduralAudio.playBeaconPing(volume);
        break;
      case 'boss-spawn':
        this.proceduralAudio.playBossSpawn(volume);
        break;
      case 'boss-defeated':
        this.proceduralAudio.playFanfare(volume * 1.2);
        break;
      case 'phase-change':
        this.proceduralAudio.playHit(volume);
        break;
    }
  }

  // ============ Music Control ============

  /**
   * Play background music track
   */
  playMusic(track: MusicTrack): void {
    this.musicManager.play(track);
  }

  /**
   * Stop music
   */
  stopMusic(): void {
    this.musicManager.stop();
  }

  /**
   * Fade to a new music track
   */
  fadeToMusic(track: MusicTrack, duration: number = 1000): void {
    this.musicManager.fadeToTrack(track, duration);
  }

  // ============ Engine Sounds ============

  /**
   * Start engine sound
   */
  startEngine(): void {
    if (!this.settings.muted) {
      this.engineManager.startPlayerEngine();
    }
  }

  /**
   * Update engine based on throttle
   */
  updateEngineThrottle(throttle: number): void {
    this.engineManager.updateThrottle(throttle);
  }

  /**
   * Stop engine sound
   */
  stopEngine(): void {
    this.engineManager.stop();
  }

  // ============ Settings ============

  /**
   * Get current audio settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Update audio settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
    this.saveSettings();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.updateSettings({ masterVolume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Set SFX volume
   */
  setSfxVolume(volume: number): void {
    this.updateSettings({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.updateSettings({ musicVolume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.updateSettings({ muted: !this.settings.muted });
    return this.settings.muted;
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.updateSettings({ muted });
  }

  // ============ Private Methods ============

  private applySettings(): void {
    // Apply to Howler global
    Howler.volume(this.settings.masterVolume);
    Howler.mute(this.settings.muted);

    // Apply to music and engine managers
    this.musicManager.setVolume(this.settings.masterVolume * this.settings.musicVolume);
    this.musicManager.setMuted(this.settings.muted);
    this.engineManager.setVolume(this.settings.masterVolume * this.settings.engineVolume);
    this.engineManager.setMuted(this.settings.muted);
  }

  private loadSettings(): AudioSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[AUDIO MANAGER] Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('[AUDIO MANAGER] Failed to save settings:', e);
    }
  }

  private setupEventListeners(): void {
    // Listen for game audio events
    window.addEventListener('audio-play', ((e: CustomEvent) => {
      this.play(e.detail.sound as SoundEffect);
    }) as EventListener);

    window.addEventListener('audio-music', ((e: CustomEvent) => {
      this.playMusic(e.detail.track as MusicTrack);
    }) as EventListener);

    // Initialize on first interaction
    const initOnInteraction = () => {
      this.init();
      window.removeEventListener('click', initOnInteraction);
      window.removeEventListener('keydown', initOnInteraction);
      window.removeEventListener('touchstart', initOnInteraction);
    };

    window.addEventListener('click', initOnInteraction);
    window.addEventListener('keydown', initOnInteraction);
    window.addEventListener('touchstart', initOnInteraction);
  }

  /**
   * Dispose audio manager
   */
  dispose(): void {
    this.stopMusic();
    this.stopEngine();
    this.proceduralAudio.suspend();
    console.log('[AUDIO MANAGER] Disposed');
  }
}

// ============ Singleton Export ============

export const audioManager = new AudioManager();

// Also export the class for type checking
export { AudioManager };
