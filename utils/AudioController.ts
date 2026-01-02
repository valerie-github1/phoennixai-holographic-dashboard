import { DriveMode } from '../types';
import { MAX_SPEED } from '../constants';

export class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Layer 1: Sub Bass (Foundation - Sine)
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  
  // Layer 2: Engine Texture (Character - Filtered Sawtooth)
  private textureOsc: OscillatorNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;
  private textureGain: GainNode | null = null;

  // Layer 3: LFO (Modulator for the texture to create a sci-fi 'pulse')
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Layer 4: Turbine (High Speed Whine - Triangle)
  private turbineOsc: OscillatorNode | null = null;
  private turbineGain: GainNode | null = null;

  // Layer 5: Wind/Atmosphere (Filtered Pink Noise)
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;

  private isInitialized: boolean = false;
  private isMuted: boolean = true;

  constructor() {}

  public async init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.6; // Base Master Vol

    const now = this.ctx.currentTime;

    // --- 1. Sub Bass (The "Weight") ---
    this.subOsc = this.ctx.createOscillator();
    this.subGain = this.ctx.createGain();
    
    this.subOsc.type = 'sine';
    this.subOsc.frequency.value = 50; 
    
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.masterGain);
    this.subGain.gain.value = 0;
    this.subOsc.start(now);

    // --- 2. Texture Drone (The "Motor") ---
    this.textureOsc = this.ctx.createOscillator();
    this.textureFilter = this.ctx.createBiquadFilter();
    this.textureGain = this.ctx.createGain();
    
    this.textureOsc.type = 'sawtooth'; // Rich harmonics
    this.textureOsc.frequency.value = 60;
    
    this.textureFilter.type = 'lowpass';
    this.textureFilter.frequency.value = 100; // Start muffled
    this.textureFilter.Q.value = 1;

    this.textureOsc.connect(this.textureFilter);
    this.textureFilter.connect(this.textureGain);
    this.textureGain.connect(this.masterGain);
    this.textureGain.gain.value = 0;
    this.textureOsc.start(now);

    // --- 3. LFO (Pulsing Effect) ---
    // Modulates the volume of the texture layer
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    
    this.lfoOsc.type = 'sine';
    this.lfoOsc.frequency.value = 4; // 4Hz pulse at idle
    
    this.lfoGain.gain.value = 0.2; // Modulation depth +/- 0.2
    
    this.lfoOsc.connect(this.lfoGain);
    this.lfoGain.connect(this.textureGain.gain); // Audio Rate Modulation
    this.lfoOsc.start(now);

    // --- 4. Turbine (High Pitch Whine) ---
    this.turbineOsc = this.ctx.createOscillator();
    this.turbineGain = this.ctx.createGain();
    
    this.turbineOsc.type = 'triangle'; // Softer than saw, sharper than sine
    this.turbineOsc.frequency.value = 200;
    
    this.turbineOsc.connect(this.turbineGain);
    this.turbineGain.connect(this.masterGain);
    this.turbineGain.gain.value = 0;
    this.turbineOsc.start(now);

    // --- 5. Wind Noise (Procedural Pink Noise) ---
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Pink Noise Generator
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // Normalize roughly
        b6 = white * 0.115926;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.value = 400;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseSource.start(now);

    this.isInitialized = true;
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (muted) this.ctx.suspend();
      else this.ctx.resume();
    }
  }

  public update(speed: number, mode: DriveMode) {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const normSpeed = Math.min(speed / MAX_SPEED, 1);
    const ramp = 0.1; // Smooth transitions

    const isSport = mode === DriveMode.SPORT;
    const isHyper = mode === DriveMode.HYPER;
    
    // --- 1. Sub Bass ---
    // Frequency rises slightly with speed
    const subFreq = 40 + (normSpeed * 50); 
    this.subOsc?.frequency.setTargetAtTime(subFreq, t, ramp);
    
    let subVol = 0.2 + (normSpeed * 0.1); 
    if (isHyper) subVol += 0.1;
    this.subGain?.gain.setTargetAtTime(subVol, t, ramp);

    // --- 2. Texture Drone ---
    // Pitch rises with speed
    let textureBase = 55;
    if (isSport) textureBase = 70;
    if (isHyper) textureBase = 85;

    const textureFreq = textureBase + (normSpeed * 250);
    this.textureOsc?.frequency.setTargetAtTime(textureFreq, t, ramp);

    // Filter opens exponentially with speed (The "Roar")
    const cutoff = 100 + (Math.pow(normSpeed, 1.5) * 4000); 
    this.textureFilter?.frequency.setTargetAtTime(cutoff, t, ramp);

    // Volume
    let textureVol = 0.15 + (normSpeed * 0.35);
    if (isSport) textureVol += 0.1;
    if (isHyper) textureVol += 0.2;
    this.textureGain?.gain.setTargetAtTime(textureVol, t, ramp);

    // --- 3. LFO (Pulse) ---
    // Speed increases with car speed (Throb becomes a buzz)
    const lfoRate = 4 + (normSpeed * 20);
    this.lfoOsc?.frequency.setTargetAtTime(lfoRate, t, ramp);


    // --- 4. Turbine ---
    // High pitch whine
    const turbineFreq = 200 + (normSpeed * 5000);
    this.turbineOsc?.frequency.setTargetAtTime(turbineFreq, t, ramp);
    
    let turbineVol = Math.pow(normSpeed, 1.5) * 0.2;
    if (isSport) turbineVol *= 1.2;
    if (isHyper) turbineVol *= 1.5;
    this.turbineGain?.gain.setTargetAtTime(turbineVol, t, ramp);


    // --- 5. Wind Noise ---
    // Filter opens to let air rushing sound in
    const noiseCutoff = 300 + (Math.pow(normSpeed, 2.2) * 8000);
    this.noiseFilter?.frequency.setTargetAtTime(noiseCutoff, t, 0.3); // Slower reaction for air

    const noiseVol = Math.pow(normSpeed, 1.8) * 0.4;
    this.noiseGain?.gain.setTargetAtTime(noiseVol, t, 0.3);
  }
}
