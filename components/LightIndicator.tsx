
import React from 'react';

interface LightIndicatorProps {
  label: string;
  count: number;
  max: number;
  color: 'green' | 'yellow' | 'red' | 'orange';
  isDarkMode: boolean;
  onClick?: () => void;
}

export const LightIndicator: React.FC<LightIndicatorProps> = ({
  label,
  count,
  max,
  color,
  isDarkMode,
  onClick
}) => {
  const colorStyles = {
    green: { active: 'bg-led-green shadow-[0_0_15px_#00ff41]', inactive: isDarkMode ? 'bg-slate-900' : 'bg-slate-100', accent: 'border-emerald-500' },
    yellow: { active: 'bg-led-yellow shadow-[0_0_15px_#ffe600]', inactive: isDarkMode ? 'bg-slate-900' : 'bg-slate-100', accent: 'border-amber-500' },
    red: { active: 'bg-led-red shadow-[0_0_15px_#ff0000]', inactive: isDarkMode ? 'bg-slate-900' : 'bg-slate-100', accent: 'border-rose-500' },
    orange: { active: 'bg-led-orange shadow-[0_0_15px_#ff8000]', inactive: isDarkMode ? 'bg-slate-900' : 'bg-slate-100', accent: 'border-orange-500' },
  };

  const style = colorStyles[color];

  return (
    <div 
      className={`group flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 p-4 md:p-2 rounded-[1.5rem] border-4 cursor-pointer active:scale-[0.98] transition-all duration-300 h-full w-full select-none ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
          : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <span className={`text-xl md:text-3xl font-black tracking-widest transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </span>
      <div className="flex gap-2 sm:gap-4 md:gap-3">
        {Array.from({ length: max }).map((_, i) => {
          const isActive = i < count;
          return (
            <div
              key={i}
              className={`w-10 h-10 sm:w-14 sm:h-14 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all duration-300 ${
                isActive 
                  ? `${style.active} border-transparent` 
                  : `${style.inactive} ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
