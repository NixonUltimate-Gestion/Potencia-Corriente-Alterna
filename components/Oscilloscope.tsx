
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';
import { SimulationState, Waveform } from '../types';
import { SAMPLE_RATE } from '../constants';

interface OscilloscopeProps {
  state: SimulationState;
  timeOffset?: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ state, timeOffset = 0 }) => {
  
  const getPeakAmplitude = (rms: number, waveform: Waveform) => {
     // Calculates Peak from RMS based on waveform physics
     switch (waveform) {
        case 'square': 
           // For a square wave centered at 0, Peak = RMS
           return rms;
        case 'triangle':
        case 'sawtooth':
           // For Triangle/Sawtooth, Peak = RMS * sqrt(3)
           return rms * Math.sqrt(3);
        case 'sine':
        default: 
           // Standard Sine: Peak = RMS * sqrt(2)
           return rms * Math.SQRT2;
     }
  };

  const calculateSignal = (
    t_sec: number,
    peakAmp: number, // This must be the PEAK value, not RMS
    freq: number,
    phaseDeg: number,
    dc: number,
    waveform: Waveform
  ) => {
    const phaseRad = (phaseDeg * Math.PI) / 180;
    const omega = 2 * Math.PI * freq;
    const t = t_sec;
    const argument = omega * t + phaseRad;

    let acValue = 0;

    switch (waveform) {
      case 'sine':
        acValue = Math.sin(argument);
        break;
      case 'square':
        acValue = Math.sign(Math.sin(argument));
        break;
      case 'triangle':
        // arcsin(sin(x)) creates a triangle wave normalized to -PI/2 to PI/2
        acValue = (2 / Math.PI) * Math.asin(Math.sin(argument));
        break;
      case 'sawtooth':
        // Normalize argument to 0-1 range for calculation
        const period = 1 / freq;
        const shiftedT = t + (phaseDeg / 360) * period;
        acValue = 2 * ((shiftedT * freq) - Math.floor(shiftedT * freq + 0.5));
        break;
      default:
        acValue = Math.sin(argument);
    }

    return (peakAmp * acValue) + dc;
  };

  const data = useMemo(() => {
    const points = [];
    const { voltage, current, timeWindow } = state;
    const totalPoints = SAMPLE_RATE;
    const timeStep = timeWindow / totalPoints; // in ms

    // Convert RMS state inputs to Peak for graphing
    const vPeak = getPeakAmplitude(voltage.amplitude, voltage.waveform);
    const iPeak = getPeakAmplitude(current.amplitude, current.waveform);

    for (let i = 0; i <= totalPoints; i++) {
      const t_ms = i * timeStep;
      const t_sec = t_ms / 1000;
      // Add timeOffset to create the travelling wave effect
      const effectiveTime = t_sec + timeOffset;

      const vInst = calculateSignal(
        effectiveTime, 
        vPeak, 
        voltage.frequency, 
        voltage.phase, 
        voltage.dcOffset, 
        voltage.waveform
      );
      
      const iInst = calculateSignal(
        effectiveTime, 
        iPeak, 
        current.frequency, 
        current.phase, 
        current.dcOffset, 
        current.waveform
      );

      points.push({
        time: t_ms.toFixed(1),
        voltage: vInst,
        current: iInst
      });
    }
    return points;
  }, [state, timeOffset]);

  // Calculate symmetric domains to ensure 0 is always in the center.
  // Note: We must use PEAK values here for axis scaling, otherwise the wave will clip.
  const vPeakForScale = getPeakAmplitude(state.voltage.amplitude, state.voltage.waveform);
  const iPeakForScale = getPeakAmplitude(state.current.amplitude, state.current.waveform);
  
  const maxVoltage = Math.max(10, (vPeakForScale + Math.abs(state.voltage.dcOffset)) * 1.1);
  const maxCurrent = Math.max(1, (iPeakForScale + Math.abs(state.current.dcOffset)) * 1.1);

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-xl border border-gray-700 p-4 shadow-inner shadow-black/50 relative overflow-hidden">
      <div className="absolute top-2 left-4 z-10 flex items-center space-x-4">
         <span className={`text-xs font-mono animate-pulse ${state.isPlaying ? "text-cyan-500" : "text-yellow-500"}`}>
            {state.isPlaying ? "● CAPTURA EN VIVO" : "○ PAUSADO"}
         </span>
         <span className="text-xs text-gray-500 font-mono">VENTANA: {state.timeWindow}ms</span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          
          {/* Zero Reference Line - Visual Anchor */}
          <ReferenceLine y={0} yAxisId="left" stroke="#6B7280" strokeWidth={1} opacity={0.8} />

          <XAxis 
            dataKey="time" 
            hide={false} 
            stroke="#6B7280" 
            tick={{fontSize: 10}} 
            label={{ value: 'Tiempo (ms)', position: 'insideBottomRight', offset: -10, fill: '#6B7280', fontSize: 10 }}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#EAB308" 
            tick={{fontSize: 10, fill: '#EAB308'}}
            domain={[-maxVoltage, maxVoltage]}
            tickCount={9}
            allowDataOverflow={false}
            tickFormatter={(value) => Math.abs(value) < 0.01 ? "0" : value.toFixed(2)}
            label={{ value: 'Tensión (V)', angle: -90, position: 'insideLeft', fill: '#EAB308', fontSize: 10 }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#22D3EE" 
            tick={{fontSize: 10, fill: '#22D3EE'}}
            domain={[-maxCurrent, maxCurrent]}
            tickCount={9}
            allowDataOverflow={false}
            tickFormatter={(value) => Math.abs(value) < 0.01 ? "0" : value.toFixed(2)}
            label={{ value: 'Corriente (A)', angle: 90, position: 'insideRight', fill: '#22D3EE', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }}
            itemStyle={{ padding: 0 }}
            formatter={(value: number) => value.toFixed(2)}
            labelFormatter={(label) => `t: ${label} ms`}
          />
          <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ top: -5 }} />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="voltage" 
            stroke="#EAB308" 
            strokeWidth={2} 
            dot={false} 
            name="Tensión (V)"
            isAnimationActive={false}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="current" 
            stroke="#22D3EE" 
            strokeWidth={2} 
            dot={false} 
            name="Corriente (A)"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
