
import React, { useState, useEffect, useMemo } from 'react';
import { KnobControl } from './components/KnobControl';
import { Oscilloscope } from './components/Oscilloscope';
import { PhasorDiagram } from './components/PhasorDiagram';
import { PowerTriangleDiagram } from './components/PowerTriangleDiagram';
import { INITIAL_STATE } from './constants';
import { SimulationState, SignalParams, Waveform } from './types';

// Waveform Icon Helper
const WaveformIcon = ({ type, selected }: { type: Waveform; selected: boolean }) => {
  const color = selected ? "stroke-white" : "stroke-gray-500";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={selected ? "opacity-100" : "opacity-60"}>
      {type === 'sine' && <path d="M2 12C2 12 5 4 9 4C13 4 15 20 19 20C23 20 22 12 22 12" strokeWidth="2" strokeLinecap="round" className={color} />}
      {type === 'square' && <path d="M3 12V6H9V18H15V6H21V12" strokeWidth="2" strokeLinecap="round" className={color} />}
      {type === 'triangle' && <path d="M3 12L7 4L11 20L15 4L19 20L21 12" strokeWidth="2" strokeLinecap="round" className={color} />}
      {type === 'sawtooth' && <path d="M3 20L9 4V20L15 4V20L21 4" strokeWidth="2" strokeLinecap="round" className={color} />}
    </svg>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [timeOffset, setTimeOffset] = useState(0);
  const [simSpeed, setSimSpeed] = useState(20); // Default to a slow speed (approx 0.05 factor)
  
  // Animation loop for "real-time" feel
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (state.isPlaying && simSpeed > 0) {
        const deltaTime = (time - lastTime) / 1000; // seconds
        lastTime = time;
        
        // Map slider 0-100 to a speed factor.
        // 0 = paused
        // 20 = 0.05 (Slow motion for 60Hz)
        // 100 = 0.5 (Fast)
        const speedFactor = (simSpeed / 400); 
        
        setTimeOffset(prev => prev + deltaTime * speedFactor);
      } else {
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [state.isPlaying, simSpeed]);

  const updateVoltage = (updates: Partial<SignalParams>) => {
    setState(prev => ({ ...prev, voltage: { ...prev.voltage, ...updates } }));
  };

  const updateCurrent = (updates: Partial<SignalParams>) => {
    setState(prev => ({ ...prev, current: { ...prev.current, ...updates } }));
  };

  const updateFrequency = (freq: number) => {
    setState(prev => ({
      ...prev,
      voltage: { ...prev.voltage, frequency: freq },
      current: { ...prev.current, frequency: freq }
    }));
  };

  const resetSimulation = () => {
    setState(INITIAL_STATE);
    setTimeOffset(0);
    setSimSpeed(20);
  };

  // Power Calculations (Assuming Sinusoidal Steady State for standard Phasor definitions)
  const powerStats = useMemo(() => {
    // Input amplitude is now treated as RMS (Valor Eficaz)
    const Vrms = state.voltage.amplitude;
    const Irms = state.current.amplitude;
    
    let phaseDiffDeg = state.voltage.phase - state.current.phase;
    
    // Normalize to -180 to 180 range to correctly identify Lead/Lag
    while (phaseDiffDeg <= -180) phaseDiffDeg += 360;
    while (phaseDiffDeg > 180) phaseDiffDeg -= 360;

    const phaseDiffRad = (phaseDiffDeg * Math.PI) / 180;

    // Power Triangle
    const S = Vrms * Irms; // Apparent Power (VA)
    const P = S * Math.cos(phaseDiffRad); // Active Power (W)
    const Q = S * Math.sin(phaseDiffRad); // Reactive Power (VAR)
    const PF = Math.cos(phaseDiffRad);

    // Determine Status Text
    let statusType = "";
    let statusLag = "";
    const absPhase = Math.abs(phaseDiffDeg);
    
    if (absPhase < 0.1) {
        statusType = "Resistivo";
        statusLag = "En fase";
    } else if (phaseDiffDeg > 0) {
        statusType = "Inductivo";
        statusLag = "En atraso";
    } else {
        statusType = "Capacitivo";
        statusLag = "En adelanto";
    }

    return {
      S: S.toFixed(2),
      P: P.toFixed(2),
      Q: Q.toFixed(2),
      PF: Math.abs(PF).toFixed(3),
      phaseDiff: phaseDiffDeg.toFixed(1),
      statusType,
      statusLag
    };
  }, [state.voltage, state.current]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-cyan-500 selection:text-black pb-20">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-cyan-500 rounded-md flex items-center justify-center font-bold text-black text-xl">
              ⚡
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              AC/DC <span className="text-gray-500 font-light">Laboratorio de Señales</span>
            </h1>
          </div>
          
          {/* Speed Control */}
          <div className="flex items-center gap-4 flex-1 justify-center max-w-md mx-4">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Velocidad</span>
             <input 
                type="range" 
                min="0" 
                max="100" 
                value={simSpeed} 
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
             />
          </div>

          <div className="flex gap-2">
             <button 
              onClick={() => setState(s => ({...s, isPlaying: !s.isPlaying}))}
              className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${state.isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
            >
              {state.isPlaying ? "Detener" : "Reanudar"}
            </button>
            <button 
              onClick={resetSimulation}
              className="px-4 py-1 rounded-md text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Reiniciar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
        
        {/* Left Column: Controls */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Voltage Controls */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-yellow-500 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> FUENTE DE TENSIÓN
              </h2>
              <div className="p-1.5 bg-gray-800 rounded text-yellow-500">
                  <WaveformIcon type="sine" selected={true} />
              </div>
            </div>
            
            <div className="space-y-3">
              <KnobControl label="Valor Eficaz (RMS)" value={state.voltage.amplitude} min={0} max={200} unit="V" colorClass="text-yellow-500" onChange={(v) => updateVoltage({ amplitude: v })} />
              <KnobControl label="Fase" value={state.voltage.phase} min={-180} max={180} step={1} unit="°" colorClass="text-yellow-500" onChange={(v) => updateVoltage({ phase: v })} />
            </div>
          </div>

          {/* Current Controls */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-cyan-500 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span> CORRIENTE DE CARGA
              </h2>
              <div className="p-1.5 bg-gray-800 rounded text-cyan-500">
                  <WaveformIcon type="sine" selected={true} />
              </div>
            </div>
            
            <div className="space-y-3">
              <KnobControl label="Valor Eficaz (RMS)" value={state.current.amplitude} min={0} max={200} unit="A" colorClass="text-cyan-500" onChange={(v) => updateCurrent({ amplitude: v })} />
              <KnobControl label="Fase" value={state.current.phase} min={-180} max={180} step={1} unit="°" colorClass="text-cyan-500" onChange={(v) => updateCurrent({ phase: v })} />
            </div>
          </div>

          {/* Global System Controls (Frequency) */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white"></span> PARÁMETROS GLOBALES
              </h2>
            </div>
            <div className="space-y-3">
              <KnobControl 
                label="Frecuencia" 
                value={state.voltage.frequency} 
                min={1} 
                max={200} 
                unit="Hz" 
                colorClass="text-white" 
                onChange={updateFrequency} 
              />
            </div>
          </div>

        </div>

        {/* Right Column: Visualization & Analysis */}
        <div className="xl:col-span-9 space-y-6">
          
          {/* Row 1: Oscilloscope */}
          <Oscilloscope state={state} timeOffset={timeOffset} />

          {/* Row 2: Vector & Power Analysis (3 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[350px]">
             
             {/* 1. Phasor Diagram */}
             <PhasorDiagram voltage={state.voltage} current={state.current} />
             
             {/* 2. Power Statistics (Replaces Complex Plane) */}
             <div className="grid grid-cols-2 gap-4 h-full">
                
                {/* Active Power */}
                <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden shadow-inner shadow-black/50 group hover:border-green-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-bl-full group-hover:bg-green-500/20 transition-colors"></div>
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Potencia Activa</div>
                  <div className="text-xl lg:text-2xl font-mono text-green-400 truncate">
                    {powerStats.P} <span className="text-xs text-gray-500">W</span>
                  </div>
                  <div className="text-[9px] text-gray-600 mt-1">Trabajo Útil</div>
                </div>
                
                {/* Reactive Power */}
                <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden shadow-inner shadow-black/50 group hover:border-purple-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-bl-full group-hover:bg-purple-500/20 transition-colors"></div>
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Potencia Reactiva</div>
                  <div className="text-xl lg:text-2xl font-mono text-purple-400 truncate">
                    {powerStats.Q} <span className="text-xs text-gray-500">VAR</span>
                  </div>
                   <div className="text-[9px] text-gray-600 mt-1">Campo Almacenado</div>
                </div>

                {/* Apparent Power */}
                <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden shadow-inner shadow-black/50 group hover:border-blue-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-full group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Potencia Aparente</div>
                  <div className="font-mono text-blue-400 flex flex-col">
                    <div className="text-xl lg:text-2xl flex items-baseline gap-1">
                        <span>{powerStats.S}</span>
                        <span className="text-xs text-gray-500">VA</span>
                    </div>
                    <div className="text-lg lg:text-xl mt-0.5">
                        ∠ {powerStats.phaseDiff}°
                    </div>
                  </div>
                   <div className="text-[9px] text-gray-600 mt-1">Capacidad Total</div>
                </div>

                {/* Power Factor */}
                <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden shadow-inner shadow-black/50 group hover:border-yellow-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/10 rounded-bl-full group-hover:bg-yellow-500/20 transition-colors"></div>
                  <div className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Factor de Potencia</div>
                  <div className="text-xl lg:text-2xl font-mono text-yellow-400 truncate">
                    {powerStats.PF}
                  </div>
                   <div className="flex flex-col mt-1">
                       <div className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                           {powerStats.statusLag}
                       </div>
                       <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none">
                           {powerStats.statusType}
                       </div>
                   </div>
                </div>
             </div>

             {/* 3. Power Triangle */}
             <PowerTriangleDiagram voltage={state.voltage} current={state.current} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
