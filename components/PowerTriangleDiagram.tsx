
import React from 'react';
import { SignalParams } from '../types';

interface PowerTriangleDiagramProps {
  voltage: SignalParams;
  current: SignalParams;
}

export const PowerTriangleDiagram: React.FC<PowerTriangleDiagramProps> = ({ voltage, current }) => {
  const CX = 150;
  const CY = 150;
  const MAX_R = 120; // Max radius for drawing

  // Arrow dimensions matching PhasorDiagram
  const ARROW_LEN = 14; 
  const ARROW_WIDTH = 12;
  const ARROW_INSET = 2;
  const LINE_OFFSET = ARROW_LEN - ARROW_INSET;

  // Calculate Power Values
  const vRms = voltage.amplitude;
  const iRms = current.amplitude;
  
  // Phase Difference (theta = vPhase - iPhase)
  let theta = voltage.phase - current.phase;
  
  // Normalize theta to -180 to 180
  while (theta <= -180) theta += 360;
  while (theta > 180) theta -= 360;

  const thetaRad = (theta * Math.PI) / 180;

  const S_mag = vRms * iRms;
  const P_mag = S_mag * Math.cos(thetaRad);
  const Q_mag = S_mag * Math.sin(thetaRad);

  // Auto-scaling logic
  const scale = S_mag > 0 ? MAX_R / S_mag : 1;

  // Vector lengths in pixels
  const pLen = P_mag * scale;
  const qLen = Q_mag * scale;
  // sLen (Apparent power vector length in pixels)
  const sLen = Math.sqrt(pLen*pLen + qLen*qLen);

  // Mathematical Coordinates for the vertices
  // Origin: (CX, CY)
  // P Tip: (CX + pLen, CY)
  // S Tip: (CX + pLen, CY - qLen)  (Y is down in SVG, so subtract qLen)
  const pTip = { x: CX + pLen, y: CY };
  const sTip = { x: CX + pLen, y: CY - qLen };

  // --- Visual Adjustments for Arrowheads ---
  // We shorten the lines so the arrow tip lands exactly on the vertex coordinate
  
  // 1. P Vector (Active Power) - Horizontal
  // From CX to pTip
  const pLenAbs = Math.abs(pLen);
  const pRatio = pLenAbs > LINE_OFFSET ? (pLenAbs - LINE_OFFSET) / pLenAbs : 0;
  const pLineEnd = {
      x: CX + pLen * pRatio,
      y: CY
  };

  // 2. Q Vector (Reactive Power) - Vertical
  // From pTip to sTip
  const qLenAbs = Math.abs(qLen);
  const qRatio = qLenAbs > LINE_OFFSET ? (qLenAbs - LINE_OFFSET) / qLenAbs : 0;
  const qLineEnd = {
      x: pTip.x,
      y: CY - (qLen * qRatio) // Calculate relative to CY (baseline) but positioned at pTip.x
  };

  // 3. S Vector (Apparent Power) - Hypotenuse
  // From CX to sTip
  const sRatio = sLen > LINE_OFFSET ? (sLen - LINE_OFFSET) / sLen : 0;
  const sLineEnd = {
      x: CX + (sTip.x - CX) * sRatio,
      y: CY + (sTip.y - CY) * sRatio
  };


  return (
    <div className="w-full h-full min-h-[350px] bg-gray-900 rounded-xl border border-gray-700 p-4 flex flex-col items-center justify-center relative shadow-inner shadow-black/50">
       {/* Header / Values at Top */}
       <div className="absolute top-3 left-0 w-full px-4 flex justify-between items-start z-10">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Triángulo de Potencia</h3>
            <span className="text-[10px] text-gray-600 font-mono">Plano de Potencia Compleja</span>
          </div>
          <div className="text-right font-mono text-[10px]">
             <div className="text-green-400">P: {P_mag.toFixed(1)} W</div>
             <div className="text-purple-400">Q: {Q_mag.toFixed(1)} VAR</div>
             <div className="text-blue-400">S: {S_mag.toFixed(1)} VA</div>
          </div>
       </div>

        <svg viewBox="0 0 300 300" className="w-full h-full max-w-[350px] mt-6">
            <defs>
                <marker 
                    id="arrow-p" 
                    markerWidth={ARROW_LEN} 
                    markerHeight={ARROW_WIDTH} 
                    refX={ARROW_INSET} 
                    refY={ARROW_WIDTH/2} 
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <path d={`M0,0 L${ARROW_LEN},${ARROW_WIDTH/2} L0,${ARROW_WIDTH} z`} fill="#4ADE80" />
                </marker>
                <marker 
                    id="arrow-q" 
                    markerWidth={ARROW_LEN} 
                    markerHeight={ARROW_WIDTH} 
                    refX={ARROW_INSET} 
                    refY={ARROW_WIDTH/2} 
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <path d={`M0,0 L${ARROW_LEN},${ARROW_WIDTH/2} L0,${ARROW_WIDTH} z`} fill="#C084FC" />
                </marker>
                 <marker 
                    id="arrow-s" 
                    markerWidth={ARROW_LEN} 
                    markerHeight={ARROW_WIDTH} 
                    refX={ARROW_INSET} 
                    refY={ARROW_WIDTH/2} 
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <path d={`M0,0 L${ARROW_LEN},${ARROW_WIDTH/2} L0,${ARROW_WIDTH} z`} fill="#60A5FA" />
                </marker>
            </defs>

            {/* Grid & Axes */}
            <line x1="20" y1={CY} x2="280" y2={CY} stroke="#374151" strokeWidth="1" /> {/* Real Axis */}
            <line x1={CX} y1="20" x2={CX} y2="280" stroke="#374151" strokeWidth="1" /> {/* Imag Axis */}
            <text x="280" y={CY + 12} fill="#6B7280" fontSize="9" textAnchor="end">Activa (W)</text>
            <text x={CX + 5} y="20" fill="#6B7280" fontSize="9" textAnchor="start">Reactiva (j)</text>

            {/* P Vector (Active Power) - Green */}
            <line 
                x1={CX} y1={CY} 
                x2={pLineEnd.x} y2={pLineEnd.y} 
                stroke="#4ADE80" 
                strokeWidth="3" 
                markerEnd="url(#arrow-p)"
                opacity="0.9"
            />

            {/* Q Vector (Reactive Power) - Purple */}
            {/* Drawn from tip of P to tip of S */}
            <line 
                x1={pTip.x} y1={pTip.y} 
                x2={qLineEnd.x} y2={qLineEnd.y} 
                stroke="#C084FC" 
                strokeWidth="3" 
                strokeDasharray="4 2"
                markerEnd="url(#arrow-q)"
                opacity="0.9"
            />

            {/* S Vector (Apparent Power) - Blue */}
            <line 
                x1={CX} y1={CY} 
                x2={sLineEnd.x} y2={sLineEnd.y} 
                stroke="#60A5FA" 
                strokeWidth="3" 
                markerEnd="url(#arrow-s)"
                opacity="1"
            />
            
            {/* Angle Indicator (Power Factor Angle) */}
            {S_mag > 0 && (
              <path 
                d={`M ${CX + 20} ${CY} A 20 20 0 0 ${Q_mag > 0 ? 0 : 1} ${CX + 20 * Math.cos(thetaRad)} ${CY - 20 * Math.sin(thetaRad)}`}
                stroke="#FACC15"
                fill="none"
                strokeWidth="1.5"
              />
            )}
            <text 
                x={CX + 35} 
                y={CY - (Q_mag > 0 ? 10 : -20)} 
                fill="#FACC15" 
                fontSize="10" 
                textAnchor="start"
            >
               {theta.toFixed(1)}°
            </text>

            {/* Center Point */}
            <circle cx={CX} cy={CY} r={3} fill="#9CA3AF" />
        </svg>
    </div>
  );
};
