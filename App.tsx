
import React, { useState, useCallback, useEffect } from 'react';
import { 
  RotateCcw, 
  ArrowRight, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown,
  Sun,
  Moon,
  Undo2
} from 'lucide-react';
import { GameState, INITIAL_STATE, MAX_BALLS, MAX_STRIKES, MAX_OUTS, MAX_FOULS } from './types';
import { LightIndicator } from './components/LightIndicator';
import { ScoreBox } from './components/ScoreBox';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [history, setHistory] = useState<GameState[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const saveHistory = useCallback(() => {
    setHistory(prev => [gameState, ...prev].slice(0, 20));
  }, [gameState]);

  const undo = () => {
    if (history.length > 0) {
      const prev = history[0];
      setGameState(prev);
      setHistory(prevHistory => prevHistory.slice(1));
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleBall = useCallback(() => {
    saveHistory();
    setGameState(prev => {
      const nextBalls = prev.balls + 1;
      if (nextBalls >= MAX_BALLS) return { ...prev, balls: 0, strikes: 0, fouls: 0 };
      return { ...prev, balls: nextBalls };
    });
  }, [saveHistory]);

  const handleStrike = useCallback(() => {
    saveHistory();
    setGameState(prev => {
      const nextStrikes = prev.strikes + 1;
      if (nextStrikes >= MAX_STRIKES) {
        const nextOuts = prev.outs + 1;
        return { ...prev, balls: 0, strikes: 0, fouls: 0, outs: nextOuts > MAX_OUTS ? 3 : nextOuts };
      }
      return { ...prev, strikes: nextStrikes };
    });
  }, [saveHistory]);

  const handleFoul = useCallback(() => {
    saveHistory();
    setGameState(prev => {
      const nextStrikes = prev.strikes < 2 ? prev.strikes + 1 : prev.strikes;
      const nextFouls = prev.fouls + 1;
      return { 
        ...prev, 
        strikes: nextStrikes, 
        fouls: nextFouls > MAX_FOULS ? 0 : nextFouls 
      };
    });
  }, [saveHistory]);

  const handleOut = useCallback(() => {
    saveHistory();
    setGameState(prev => ({ 
      ...prev, 
      balls: 0, strikes: 0, fouls: 0, 
      outs: (prev.outs + 1) > MAX_OUTS ? 0 : prev.outs + 1 
    }));
  }, [saveHistory]);

  const resetCount = useCallback(() => {
    saveHistory();
    setGameState(prev => ({ ...prev, balls: 0, strikes: 0, fouls: 0 }));
  }, [saveHistory]);

  const switchSides = useCallback(() => {
    saveHistory();
    setGameState(prev => {
      const isNowBottom = !prev.isBottom;
      return {
        ...prev,
        isBottom: isNowBottom,
        inning: isNowBottom ? prev.inning : prev.inning + 1,
        balls: 0, strikes: 0, outs: 0, fouls: 0
      };
    });
  }, [saveHistory]);

  const nextInning = useCallback(() => {
    saveHistory();
    setGameState(prev => ({
      ...prev,
      inning: prev.inning + 1,
      isBottom: false,
      balls: 0, strikes: 0, outs: 0, fouls: 0
    }));
  }, [saveHistory]);

  const renameTeam = (side: 'HOME' | 'AWAY', name: string) => {
    setGameState(prev => ({
      ...prev,
      [side === 'HOME' ? 'homeName' : 'awayName']: name
    }));
  };

  const resetGame = useCallback(() => {
    saveHistory();
    setGameState(INITIAL_STATE);
    setShowResetConfirm(false);
  }, [saveHistory]);

  const adjustScore = (team: 'HOME' | 'AWAY', delta: number) => {
    saveHistory();
    setGameState(prev => ({
      ...prev,
      [team === 'HOME' ? 'homeScore' : 'awayScore']: Math.max(0, (team === 'HOME' ? prev.homeScore : prev.awayScore) + delta)
    }));
  };

  const isThreeOuts = gameState.outs === 3;

  return (
    <div className={`h-screen w-screen flex flex-col font-sans selection:bg-blue-500 overflow-hidden p-3 md:p-6 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F8F9FA] text-slate-900'}`}>
      
      {/* Scoreboard Section: Adjusted mobile height to 20% (4/5 of 25%) */}
      <header className="h-[20%] md:h-[22%] flex-none w-full max-w-6xl mx-auto mb-4">
        <div className="grid grid-cols-3 gap-3 md:gap-6 h-full items-stretch">
          <ScoreBox 
            teamName={gameState.awayName} 
            score={gameState.awayScore} 
            isActive={!gameState.isBottom}
            isDarkMode={isDarkMode}
            onIncrement={() => adjustScore('AWAY', 1)}
            onDecrement={() => adjustScore('AWAY', -1)}
            onRename={(name) => renameTeam('AWAY', name)}
          />

          <div className={`flex flex-col items-center justify-center space-y-1 rounded-[1.5rem] md:rounded-[2rem] border-4 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'}`}>
            <span className={`text-[8px] md:text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Inning</span>
            <div className="flex items-center gap-1 md:gap-6">
               <ChevronUp className={`w-4 h-4 md:w-10 md:h-10 transition-colors ${!gameState.isBottom ? 'text-blue-500' : (isDarkMode ? 'text-slate-800' : 'text-slate-200')}`} strokeWidth={4} />
               <span className="text-4xl md:text-8xl font-mono font-black tabular-nums">{gameState.inning}</span>
               <ChevronDown className={`w-4 h-4 md:w-10 md:h-10 transition-colors ${gameState.isBottom ? 'text-blue-500' : (isDarkMode ? 'text-slate-800' : 'text-slate-200')}`} strokeWidth={4} />
            </div>
          </div>

          <ScoreBox 
            teamName={gameState.homeName} 
            score={gameState.homeScore} 
            isActive={gameState.isBottom}
            isDarkMode={isDarkMode}
            onIncrement={() => adjustScore('HOME', 1)}
            onDecrement={() => adjustScore('HOME', -1)}
            onRename={(name) => renameTeam('HOME', name)}
          />
        </div>
      </header>

      {/* Counts Section */}
      <main className="h-[45%] md:h-[18%] flex-grow w-full max-w-6xl mx-auto flex items-center mb-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 w-full h-full">
          <LightIndicator label="BALL" count={gameState.balls} max={MAX_BALLS} color="green" isDarkMode={isDarkMode} onClick={handleBall} />
          <LightIndicator label="STRIKE" count={gameState.strikes} max={MAX_STRIKES} color="yellow" isDarkMode={isDarkMode} onClick={handleStrike} />
          <LightIndicator label="OUT" count={gameState.outs} max={MAX_OUTS} color="red" isDarkMode={isDarkMode} onClick={handleOut} />
          <LightIndicator label="FOUL" count={gameState.fouls} max={MAX_FOULS} color="orange" isDarkMode={isDarkMode} onClick={handleFoul} />
        </div>
      </main>

      {/* Controls Section */}
      <footer className="h-auto md:h-[20%] flex-none w-full max-w-6xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-3 gap-6 h-full items-stretch">
          <button 
            onClick={switchSides}
            className={`group relative flex flex-col items-center justify-center gap-2 rounded-[2.5rem] transition-all active:scale-95 border-4 overflow-hidden h-full ${
              isThreeOuts 
              ? 'bg-blue-600 border-blue-800 ring-4 ring-blue-500/50 animate-pulse' 
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            } ${isDarkMode && !isThreeOuts ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
          >
            <RefreshCw size={40} className={`transition-colors ${isThreeOuts ? 'text-white' : 'text-blue-500'}`} />
            <span className={`text-2xl font-black transition-colors ${isThreeOuts ? 'text-white' : ''}`}>공격 전환</span>
          </button>

          <button 
            onClick={nextInning}
            className={`flex flex-col items-center justify-center gap-2 bg-emerald-500 border-4 border-emerald-700 text-white rounded-[2.5rem] transition-all shadow-md active:scale-95 h-full ${isDarkMode ? 'bg-emerald-600 border-emerald-800' : 'border-slate-200'}`}
          >
            <ArrowRight size={40} />
            <span className="text-2xl font-black">다음 이닝</span>
          </button>

          <div className="flex flex-col gap-3 h-full">
            <div className="flex gap-3 flex-1">
              <button onClick={resetCount} className={`flex-[2] flex items-center justify-center gap-2 rounded-2xl border-4 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                <RotateCcw size={18} /><span className="font-bold text-lg">타자 리셋</span>
              </button>
              <button onClick={undo} disabled={history.length === 0} className={`flex-1 flex items-center justify-center rounded-2xl border-4 ${history.length === 0 ? 'opacity-30' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                <Undo2 size={22} />
              </button>
              <button onClick={toggleTheme} className={`flex-1 flex items-center justify-center rounded-2xl border-4 ${isDarkMode ? 'bg-amber-400 border-slate-700 text-slate-900' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>
            <div className="flex-1 relative">
              {!showResetConfirm ? (
                <button onClick={() => setShowResetConfirm(true)} className="w-full h-full flex items-center justify-center gap-2 bg-white border-slate-200 text-slate-400 rounded-2xl border-4 hover:bg-rose-50 hover:text-rose-500">
                  <RotateCcw size={18} /><span className="font-bold text-lg">전체 리셋</span>
                </button>
              ) : (
                <div className="flex gap-2 h-full">
                  <button onClick={resetGame} className="flex-1 bg-rose-500 border-rose-700 text-white rounded-2xl font-black border-4">확인</button>
                  <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-100 border-slate-300 text-slate-600 rounded-2xl font-black border-4">취소</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-3">
          {/* Row 1: 공격전환, 다음이닝 */}
          <div className="grid grid-cols-2 gap-3 h-20">
            <button 
              onClick={switchSides}
              className={`flex flex-col items-center justify-center gap-1 rounded-[1.5rem] transition-all border-4 ${
                isThreeOuts 
                ? 'bg-blue-600 border-blue-800 ring-4 ring-blue-500/50 animate-pulse' 
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
              } ${isDarkMode && !isThreeOuts ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            >
              <RefreshCw size={24} className={isThreeOuts ? 'text-white' : 'text-blue-500'} />
              <span className={`text-[11px] font-black ${isThreeOuts ? 'text-white' : ''}`}>공격 전환</span>
            </button>
            <button 
              onClick={nextInning}
              className={`flex flex-col items-center justify-center gap-1 bg-emerald-500 border-4 border-emerald-700 text-white rounded-[1.5rem] transition-all shadow-md active:scale-95 ${isDarkMode ? 'bg-emerald-600 border-emerald-800' : ''}`}
            >
              <ArrowRight size={24} />
              <span className="text-[11px] font-black">다음 이닝</span>
            </button>
          </div>

          {/* Row 2: 보조 기능 1x4 배열 */}
          <div className="grid grid-cols-4 gap-2 h-16">
            <button 
              onClick={resetCount}
              className={`flex flex-col items-center justify-center rounded-xl border-2 ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}
            >
              <RotateCcw size={16} />
              <span className="font-bold text-[10px] mt-1">타자</span>
            </button>

            <button 
              onClick={toggleTheme}
              className={`flex items-center justify-center rounded-xl border-2 ${
                isDarkMode ? 'bg-amber-400 border-slate-700 text-slate-900' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative h-full">
              {!showResetConfirm ? (
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full h-full flex flex-col items-center justify-center bg-white border-slate-200 text-slate-400 rounded-xl border-2"
                >
                  <RotateCcw size={16} />
                  <span className="font-bold text-[10px] mt-1">전체</span>
                </button>
              ) : (
                <div className="flex flex-col gap-1 h-full animate-in fade-in zoom-in duration-200">
                  <button onClick={resetGame} className="flex-1 bg-rose-500 border-rose-700 text-white rounded-lg font-black text-[9px] border">확인</button>
                  <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-100 border-slate-300 text-slate-600 rounded-lg font-black text-[9px] border">취소</button>
                </div>
              )}
            </div>

            <button 
              onClick={undo}
              disabled={history.length === 0}
              className={`flex items-center justify-center rounded-xl border-2 ${
                history.length === 0 ? 'opacity-30' : ''
              } ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}
            >
              <Undo2 size={20} />
            </button>
          </div>
        </div>
      </footer>

      {/* Copyright Footer */}
      <div className="mt-auto py-2 flex justify-center w-full">
        <p className={`text-[10px] md:text-xs font-medium tracking-tight opacity-60 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          ⓒ 2025. Kwon's class. All rights reserved.
        </p>
      </div>
    </div>
  );
}
