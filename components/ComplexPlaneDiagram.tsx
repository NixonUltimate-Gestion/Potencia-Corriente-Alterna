
import React from 'react';
import { SignalParams } from '../types';

interface ComplexPlaneDiagramProps {
  voltage: SignalParams;
  current: SignalParams;
}

export const ComplexPlaneDiagram: React.FC<ComplexPlaneDiagramProps> = ({ voltage, current }) => {
  // Center point and size
  const CX = 150;
  const CY = 150;
  
  // Fixed display radii
  const V_DISPLAY_R = 110;
  const I_DISPLAY_R = 80;
  
  // Arc for angle display
  const ARC_RADIUS = 40;

  // Arrow dimensions matching PhasorDiagram
  const ARROW_LEN = 14; 
  const ARROW_WIDTH = 12;
  const ARROW_INSET = 2;
  const LINE_OFFSET = ARROW_LEN - ARROW_INSET;

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  // Helper to get SVG coordinates (Y is inverted relative to math axes)
  const getCoords = (r: number, deg: number) => {
    const rad = degToRad(deg);
    return {
      x: CX + r * Math.cos(rad),
      y: CY - r * Math.sin(rad) 
    };
  };

  // Full coordinates for dashed projections (reference lines)
  const vCoordsFull = getCoords(V_DISPLAY_R, voltage.phase);
  const cCoordsFull = getCoords(I_DISPLAY_R, current.phase);

  // Shortened coordinates for the solid vector lines so the arrow tip lands exactly on the radius
  const vCoordsArrow = getCoords(V_DISPLAY_R - LINE_OFFSET, voltage.phase);
  const cCoordsArrow = getCoords(I_DISPLAY_R - LINE_OFFSET, current.phase);

  // Calculate Real and Imaginary components (RMS)
  const vRe = voltage.amplitude * Math.cos(degToRad(voltage.phase));
  const vIm = voltage.amplitude * Math.sin(degToRad(voltage.phase));
  const iRe = current.amplitude * Math.cos(degToRad(current.phase));
  const iIm = current.amplitude * Math.sin(degToRad(current.phase));

  // --- Angle Display Logic ---
  let delta = current.phase - voltage.phase;
  while (delta <= -180) delta += 360;
  while (delta > 180) delta -= 360;
  
  const absDelta = Math.abs(delta);
  
  // Signed display angle (V - I)
  let displayAngle = voltage.phase - current.phase;
  while (displayAngle <= -180) displayAngle += 360;
  while (displayAngle > 180) displayAngle -= 360;

  // Sweep Flag for Arc
  const sweepFlag = delta > 0 ? 0 : 1;
  const largeArcFlag = absDelta > 180 ? 1 : 0;

  const arcStart = getCoords(ARC_RADIUS, voltage.phase);
  const arcEnd = getCoords(ARC_RADIUS, current.phase);
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${largeArcFlag} ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`;

  // Label Position
  const midAngle = voltage.phase + (delta / 2);
  const labelPos = getCoords(ARC_RADIUS + 20, midAngle);

  return (
    <div className="w-full h-full min-h-[350px] bg-gray-900 rounded-xl border border-gray-700 p-4 flex flex-col items-center justify-center relative shadow-inner shadow-black/50">
        {/* Top Header with Math Values */}
        <div className="absolute top-3 left-0 w-full px-4 flex justify-between items-start z-10">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plano Complejo</h3>
            <span className="text-[10px] text-gray-600 font-mono">Coordenadas Rectangulares</span>
          </div>
          <div className="flex flex-col items-end text-[10px] font-mono">
             <div className="text-yellow-500">
                <span className="opacity-70">V = </span> 
                {vRe.toFixed(1)} {vIm >= 0 ? '+' : '-'} j{Math.abs(vIm).toFixed(1)} V
             </div>
             <div className="text-cyan-500">
                <span className="opacity-70">I = </span>
                {iRe.toFixed(1)} {iIm >= 0 ? '+' : '-'} j{Math.abs(iIm).toFixed(1)} A
             </div>
          </div>
        </div>
        
        <svg viewBox="0 0 300 300" className="w-full h-full max-w-[350px] mt-6">
            <defs>
                <marker 
                    id="arrow-v-rect" 
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
                    id="arrow-c-rect" 
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

            {/* Grid Background */}
            {/* Vertical Dashed Lines */}
            {[50, 100, 200, 250].map(x => (
              <line key={`v-${x}`} x1={x} y1="20" x2={x} y2="280" stroke="#374151" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            ))}
            {/* Horizontal Dashed Lines */}
             {[50, 100, 200, 250].map(y => (
              <line key={`h-${y}`} x1="20" y1={y} x2="280" y2={y} stroke="#374151" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            ))}

            {/* Main Axes */}
            <line x1="20" y1="150" x2="280" y2="150" stroke="#6B7280" strokeWidth="1.5" /> {/* Real Axis */}
            <line x1="150" y1="20" x2="150" y2="280" stroke="#6B7280" strokeWidth="1.5" /> {/* Imag Axis */}

            {/* Axis Labels */}
            <text x="290" y="150" fill="#9CA3AF" fontSize="10" textAnchor="end" alignmentBaseline="middle">+Re</text>
            <text x="10" y="150" fill="#9CA3AF" fontSize="10" textAnchor="start" alignmentBaseline="middle">-Re</text>
            <text x="150" y="10" fill="#9CA3AF" fontSize="10" textAnchor="middle">+Im (j)</text>
            <text x="150" y="290" fill="#9CA3AF" fontSize="10" textAnchor="middle">-Im</text>

            {/* Angle Arc & Label */}
            {absDelta > 0.1 && (
              <g>
                <path 
                  d={arcPath} 
                  stroke="#FACC15" 
                  strokeWidth="1.5" 
                  fill="none" 
                  strokeLinecap="round"
                  opacity="0.8"
                  strokeDasharray="2 2"
                />
                <text 
                  x={labelPos.x} 
                  y={labelPos.y} 
                  fill="#FACC15" 
                  fontSize="12" 
                  fontWeight="bold"
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  style={{ textShadow: '0px 2px 2px rgba(0,0,0,0.8)' }}
                >
                  {displayAngle.toFixed(1)}°
                </text>
              </g>
            )}

            {/* Vector Projections (using full coords to touch the axes) */}
            <line x1={vCoordsFull.x} y1={vCoordsFull.y} x2={vCoordsFull.x} y2="150" stroke="#EAB308" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            <line x1={vCoordsFull.x} y1={vCoordsFull.y} x2="150" y2={vCoordsFull.y} stroke="#EAB308" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />

            {/* Voltage Vector (using arrow coords for proper tip placement) */}
            <line 
              x1="150" y1="150" x2={vCoordsArrow.x} y2={vCoordsArrow.y} 
              stroke="#EAB308" strokeWidth="3" markerEnd="url(#arrow-v-rect)" 
            />
            
            {/* Current Vector */}
            <line 
              x1="150" y1="150" x2={cCoordsArrow.x} y2={cCoordsArrow.y} 
              stroke="#22D3EE" strokeWidth="3" markerEnd="url(#arrow-c-rect)" 
            />

            {/* Center Point */}
            <circle cx="150" cy="150" r="3" fill="#FFFFFF" />
        </svg>
    </div>
  );
};
