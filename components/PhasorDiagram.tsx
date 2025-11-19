
import React from 'react';
import { SignalParams } from '../types';

interface PhasorDiagramProps {
  voltage: SignalParams;
  current: SignalParams;
}

export const PhasorDiagram: React.FC<PhasorDiagramProps> = ({ voltage, current }) => {
  // SVG dimensions
  const CX = 150;
  const CY = 150;
  const VIEW_SIZE = 300;

  // Radii for visualization
  const V_RADIUS = 70;
  const I_RADIUS = 50;
  
  // Arrow dimensions for sharp tips
  const ARROW_LEN = 14; 
  const ARROW_WIDTH = 12;
  const ARROW_INSET = 2; // Line overlaps into arrow base by 2px to prevent gaps
  const LINE_OFFSET = ARROW_LEN - ARROW_INSET; // Shorten line so tip lands exactly at Radius

  // Angle arc needs to be outside the longest vector to avoid being hidden
  const ARC_RADIUS = 90; 

  // Helper: Polar to SVG Cartesian
  // Re-implementing getCoords safely
  const getCoordsSafe = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
        x: CX + r * Math.cos(rad),
        y: CY - r * Math.sin(rad)
    };
  }

  // Calculate line endpoints - shortened so the arrow tip lands exactly on the radius
  const vLineEnd = getCoordsSafe(V_RADIUS - LINE_OFFSET, voltage.phase);
  const cLineEnd = getCoordsSafe(I_RADIUS - LINE_OFFSET, current.phase);

  // --- Phase Difference Arc Logic ---
  // delta is used for geometry (visual arc sweep)
  let delta = current.phase - voltage.phase;
  while (delta <= -180) delta += 360;
  while (delta > 180) delta -= 360;
  
  const absDelta = Math.abs(delta);
  
  // displayAngle is used for text (signed value as requested)
  // "Si la corriente adelanta la tension ponle un signo Negativo" -> Implies V - I
  let displayAngle = voltage.phase - current.phase;
  while (displayAngle <= -180) displayAngle += 360;
  while (displayAngle > 180) displayAngle -= 360;
  
  // Draw arc from Voltage to Current or vice versa
  const arcStart = getCoordsSafe(ARC_RADIUS, voltage.phase);
  const arcEnd = getCoordsSafe(ARC_RADIUS, current.phase);
  
  // Sweep Flag logic: 
  // In SVG Y-down: Positive math angle = Negative SVG angle (CW visually if starting from +X)
  const sweepFlag = delta > 0 ? 0 : 1;
  const largeArcFlag = absDelta > 180 ? 1 : 0;
  
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${largeArcFlag} ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`;

  // --- Label Position ---
  // Place label radially outside the arc
  const midAngle = voltage.phase + (delta / 2);
  // Ensure label is far enough
  const labelRadius = ARC_RADIUS + 25; 
  const labelPos = getCoordsSafe(labelRadius, midAngle);

  return (
    <div className="w-full h-full min-h-[350px] bg-gray-900 rounded-xl border border-gray-700 p-4 flex flex-col items-center justify-center relative shadow-inner shadow-black/50">
        
        {/* Top Header with Values */}
        <div className="absolute top-3 left-0 w-full px-4 flex justify-between items-start z-10">
             <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Diagrama Fasorial</h3>
                <span className="text-[10px] text-gray-600 font-mono">Coordenadas Polares</span>
             </div>
             <div className="text-right font-mono text-[10px]">
                <div className="flex items-center gap-2 justify-end">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> 
                    Tensión: {voltage.amplitude.toFixed(1)}V ∠ {voltage.phase.toFixed(1)}°
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span> 
                    Corriente: {current.amplitude.toFixed(1)}A ∠ {current.phase.toFixed(1)}°
                </div>
             </div>
        </div>
        
        <svg viewBox="0 0 300 300" className="w-full h-full max-w-[350px] mt-6">
            <defs>
                {/* Sharp Arrowheads using userSpaceOnUse for consistent, crisp rendering */}
                <marker 
                    id="arrow-v" 
                    markerWidth={ARROW_LEN} 
                    markerHeight={ARROW_WIDTH} 
                    refX={ARROW_INSET} 
                    refY={ARROW_WIDTH/2} 
                    orient="auto" 
                    markerUnits="userSpaceOnUse"
                >
                    <path d={`M0,0 L${ARROW_LEN},${ARROW_WIDTH/2} L0,${ARROW_WIDTH} z`} fill="#EAB308" />
                </marker>
                <marker 
                    id="arrow-c" 
                    markerWidth={ARROW_LEN} 
                    markerHeight={ARROW_WIDTH} 
                    refX={ARROW_INSET} 
                    refY={ARROW_WIDTH/2} 
                    orient="auto" 
                    markerUnits="userSpaceOnUse"
                >
                    <path d={`M0,0 L${ARROW_LEN},${ARROW_WIDTH/2} L0,${ARROW_WIDTH} z`} fill="#22D3EE" />
                </marker>
            </defs>

            {/* Polar Grid */}
            <circle cx={CX} cy={CY} r={VIEW_SIZE * 0.15} fill="none" stroke="#374151" strokeDasharray="3 3" opacity="0.5"/>
            <circle cx={CX} cy={CY} r={VIEW_SIZE * 0.30} fill="none" stroke="#374151" strokeDasharray="3 3" opacity="0.5"/>
            <circle cx={CX} cy={CY} r={ARC_RADIUS} fill="none" stroke="#4B5563" strokeDasharray="2 2" opacity="0.3"/>

            {/* Crosshairs */}
            <line x1="20" y1={CY} x2="280" y2={CY} stroke="#4B5563" strokeWidth="1" />
            <line x1={CX} y1="20" x2={CX} y2="280" stroke="#4B5563" strokeWidth="1" />

            {/* Angle Labels */}
            <text x="290" y={CY} fill="#6B7280" fontSize="10" textAnchor="end" alignmentBaseline="middle">0°</text>
            <text x={CX} y="15" fill="#6B7280" fontSize="10" textAnchor="middle">90°</text>
            <text x="10" y={CY} fill="#6B7280" fontSize="10" textAnchor="start" alignmentBaseline="middle">180°</text>
            <text x={CX} y="290" fill="#6B7280" fontSize="10" textAnchor="middle">-90°</text>

             {/* Phase Difference Arc & Label (OUTSIDE the vectors) */}
             {absDelta > 0.1 && (
              <g>
                <path 
                  d={arcPath} 
                  stroke="#FACC15" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round"
                  opacity="0.8"
                  strokeDasharray="4 2"
                />
                <text 
                  x={labelPos.x} 
                  y={labelPos.y} 
                  fill="#FACC15" 
                  fontSize="14" 
                  fontWeight="bold"
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  style={{ textShadow: '0px 2px 4px rgba(0,0,0,1)' }}
                >
                  Δφ: {displayAngle.toFixed(1)}°
                </text>
              </g>
            )}

            {/* Vectors */}
            <g className="transition-all duration-300 ease-out">
              {/* Voltage Vector */}
              <line 
                  x1={CX} y1={CY} 
                  x2={vLineEnd.x} y2={vLineEnd.y} 
                  stroke="#EAB308" 
                  strokeWidth="4" 
                  markerEnd="url(#arrow-v)"
                  opacity="1"
              />
               {/* Current Vector */}
              <line 
                  x1={CX} y1={CY} 
                  x2={cLineEnd.x} y2={cLineEnd.y} 
                  stroke="#22D3EE" 
                  strokeWidth="4" 
                  markerEnd="url(#arrow-c)"
                  opacity="1"
              />
            </g>
            
            {/* Center Point */}
            <circle cx={CX} cy={CY} r={4} fill="#D1D5DB" />
        </svg>
    </div>
  );
};
