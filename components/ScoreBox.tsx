
import React, { useState, useRef, useEffect } from 'react';
import { Minus, Edit2 } from 'lucide-react';

interface ScoreBoxProps {
  teamName: string;
  score: number;
  isActive: boolean;
  isDarkMode: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRename: (newName: string) => void;
}

export const ScoreBox: React.FC<ScoreBoxProps> = ({ 
  teamName, 
  score, 
  isActive, 
  isDarkMode,
  onIncrement, 
  onDecrement,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const accentColor = teamName.toLowerCase().includes('away') ? 'rose' : 'sky';
  
  const cardBase = isDarkMode 
    ? (isActive ? `bg-slate-800 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/10` : `bg-slate-900 border border-slate-700`)
    : (isActive ? `bg-white border-2 border-${accentColor}-400 shadow-xl` : `bg-white/80 border border-slate-200 shadow-sm`);

  const textColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const labelColor = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center p-2 md:p-4 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 h-full w-full select-none ${cardBase}`}
      onClick={(e) => {
        if (!isEditing) onIncrement();
      }}
    >
      <div className="flex items-center gap-1 group cursor-text" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        {isEditing ? (
          <input
            ref={inputRef}
            className={`bg-transparent border-b-2 border-${accentColor}-500 outline-none text-center font-bold uppercase tracking-widest text-[8px] md:text-sm ${textColor}`}
            value={teamName}
            onChange={(e) => onRename(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
          />
        ) : (
          <h2 className={`text-[8px] md:text-xs font-semibold uppercase tracking-[0.1em] md:tracking-[0.2em] transition-colors ${labelColor} group-hover:text-blue-500`}>
            {teamName}
          </h2>
        )}
      </div>
      
      <div className={`font-mono text-5xl md:text-9xl font-black tabular-nums leading-none transition-colors mt-1 ${textColor}`}>
        {score}
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onDecrement(); }}
        className={`absolute bottom-2 right-2 md:bottom-3 md:right-3 p-1 md:p-2 rounded-xl md:rounded-2xl transition-all border-2 ${
          isDarkMode 
            ? 'bg-slate-700 hover:bg-red-600 text-white border-slate-600' 
            : 'bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 border-slate-200'
        }`}
      >
        <Minus size={14} className="md:w-[18px] md:h-[18px]" />
      </button>

      {isActive && (
        <div className={`absolute top-3 left-3 md:top-4 md:left-4 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse bg-${isDarkMode ? 'yellow-500' : accentColor + '-500'}`} />
      )}
    </div>
  );
};
