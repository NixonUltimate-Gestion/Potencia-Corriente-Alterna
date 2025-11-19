import React, { useState, useEffect } from 'react';

interface KnobControlProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  colorClass: string;
}

export const KnobControl: React.FC<KnobControlProps> = ({
  label,
  value = 0, // Default value to prevent undefined
  onChange,
  min,
  max,
  step = 1,
  unit,
  colorClass
}) => {
  // Initialize with safe value
  const [inputValue, setInputValue] = useState((value || 0).toFixed(2));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Update input text when prop changes, but only if not editing
    if (!isEditing) {
        setInputValue((value || 0).toFixed(2));
    }
  }, [value, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          commitValue();
          (e.target as HTMLInputElement).blur();
      }
  }

  const commitValue = () => {
      let num = parseFloat(inputValue);
      // If NaN, revert to current prop value
      if (isNaN(num)) {
        num = value;
      }
      // Clamp
      num = Math.max(min, Math.min(max, num));
      
      onChange(num);
      setInputValue(num.toFixed(2));
      setIsEditing(false);
  }

  // Map colorClass to hex for accent-color style
  const getAccentColor = () => {
      if (!colorClass) return '#ffffff';
      if (colorClass.includes('yellow')) return '#eab308';
      if (colorClass.includes('cyan')) return '#06b6d4';
      if (colorClass.includes('red')) return '#ef4444';
      if (colorClass.includes('green')) return '#22c55e';
      return '#ffffff';
  };

  return (
    <div className="flex flex-col space-y-2 p-3 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{label}</span>
        <div className="relative group">
             <div className="flex items-baseline space-x-1 bg-gray-900/50 px-2 py-1 rounded border border-transparent hover:border-gray-600 transition-colors">
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditing(true)}
                    onBlur={commitValue}
                    onKeyDown={handleKeyDown}
                    className="w-16 bg-transparent text-right text-sm font-mono text-white focus:outline-none"
                />
                <span className="text-xs font-mono text-gray-500 select-none">{unit}</span>
             </div>
        </div>
      </div>
      
      <div className="relative w-full h-6 flex items-center">
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ accentColor: getAccentColor() }}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 font-mono px-1 select-none">
        <span 
            onClick={() => onChange(min)} 
            className="cursor-pointer hover:text-gray-300 transition-colors"
            title="Min"
        >
            {min}
        </span>
        
        {/* Zero marker if within range (helpful for Phase) */}
        {min < 0 && max > 0 && (
             <div 
                onClick={() => onChange(0)} 
                className="cursor-pointer text-gray-600 hover:text-white font-bold transition-colors flex flex-col items-center -mt-1 z-10"
                title="Reset to 0"
            >
                <span className="text-[8px] mb-px">▲</span>
                0
            </div>
        )}

        <span 
            onClick={() => onChange(max)} 
            className="cursor-pointer hover:text-gray-300 transition-colors"
            title="Max"
        >
            {max}
        </span>
      </div>
    </div>
  );
};