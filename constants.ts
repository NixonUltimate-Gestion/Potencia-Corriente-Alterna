
import { SignalParams, SimulationState } from './types';

export const DEFAULT_VOLTAGE: SignalParams = {
  amplitude: 120.00, // Updated to standard mains voltage
  frequency: 60,
  phase: 0,
  dcOffset: 0,
  waveform: 'sine',
};

export const DEFAULT_CURRENT: SignalParams = {
  amplitude: 5.00, // Updated to a reasonable load current
  frequency: 60,
  phase: -30, // Lagging
  dcOffset: 0,
  waveform: 'sine',
};

export const INITIAL_STATE: SimulationState = {
  voltage: DEFAULT_VOLTAGE,
  current: DEFAULT_CURRENT,
  timeWindow: 40, // 2 cycles at 50Hz/60Hz
  isPlaying: true,
};

export const SAMPLE_RATE = 200; // Increased points for better resolution on square waves
