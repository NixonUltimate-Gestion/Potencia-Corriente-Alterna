export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface SignalParams {
  amplitude: number; // Peak value (Vp or Ip)
  frequency: number; // Hz
  phase: number; // Degrees
  dcOffset: number; // DC Component
  waveform: Waveform;
}

export interface SimulationState {
  voltage: SignalParams;
  current: SignalParams;
  timeWindow: number; // ms to display
  isPlaying: boolean;
}
