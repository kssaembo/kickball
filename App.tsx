
import React, { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  RotateCcw, 
  ArrowRight, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown,
  Sun,
  Moon,
  Undo2,
  FileDown,
  CheckCircle2
} from 'lucide-react';
import { GameState, GameEvent, INITIAL_STATE, MAX_BALLS, MAX_STRIKES, MAX_OUTS, MAX_FOULS } from './types';
import { LightIndicator } from './components/LightIndicator';
import { ScoreBox } from './components/ScoreBox';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [history, setHistory] = useState<GameState[]>([]);
  const [eventLog, setEventLog] = useState<GameEvent[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEndSummary, setShowEndSummary] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const logEvent = useCallback((action: string, details: string, state: GameState) => {
    setEventLog(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        inning: state.inning,
        isBottom: state.isBottom,
        action,
        details,
        score: `${state.awayScore} : ${state.homeScore}`
      }
    ]);
  }, []);

  const saveHistory = useCallback(() => {
    setHistory(prev => [gameState, ...prev].slice(0, 20));
  }, [gameState]);

  const undo = () => {
    if (history.length > 0) {
      const prev = history[0];
      setGameState(prev);
      setHistory(prevHistory => prevHistory.slice(1));
      setEventLog(prevLog => prevLog.slice(0, -1));
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleBall = useCallback(() => {
    saveHistory();
    logEvent('BALL', '+1 Ball', gameState);
    setGameState(prev => {
      const nextBalls = prev.balls + 1;
      if (nextBalls >= MAX_BALLS) return { ...prev, balls: 0, strikes: 0, fouls: 0 };
      return { ...prev, balls: nextBalls };
    });
  }, [saveHistory, logEvent, gameState]);

  const handleStrike = useCallback(() => {
    saveHistory();
    logEvent('STRIKE', '+1 Strike', gameState);
    setGameState(prev => {
      const nextStrikes = prev.strikes + 1;
      if (nextStrikes >= MAX_STRIKES) {
        const nextOuts = prev.outs + 1;
        return { ...prev, balls: 0, strikes: 0, fouls: 0, outs: nextOuts > MAX_OUTS ? 3 : nextOuts };
      }
      return { ...prev, strikes: nextStrikes };
    });
  }, [saveHistory, logEvent, gameState]);

  const handleFoul = useCallback(() => {
    saveHistory();
    logEvent('FOUL', '+1 Foul', gameState);
    setGameState(prev => {
      const nextStrikes = prev.strikes < 2 ? prev.strikes + 1 : prev.strikes;
      const nextFouls = prev.fouls + 1;
      return { 
        ...prev, 
        strikes: nextStrikes, 
        fouls: nextFouls > MAX_FOULS ? 0 : nextFouls 
      };
    });
  }, [saveHistory, logEvent, gameState]);

  const handleOut = useCallback(() => {
    saveHistory();
    logEvent('OUT', '+1 Out', gameState);
    setGameState(prev => ({ 
      ...prev, 
      balls: 0, strikes: 0, fouls: 0, 
      outs: (prev.outs + 1) > MAX_OUTS ? 0 : prev.outs + 1 
    }));
  }, [saveHistory, logEvent, gameState]);

  const resetCount = useCallback(() => {
    saveHistory();
    logEvent('RESET', 'Count Reset', gameState);
    setGameState(prev => ({ ...prev, balls: 0, strikes: 0, fouls: 0 }));
  }, [saveHistory, logEvent, gameState]);

  const switchSides = useCallback(() => {
    saveHistory();
    logEvent('HALF_INNING', 'Side Switched', gameState);
    setGameState(prev => {
      const isNowBottom = !prev.isBottom;
      return {
        ...prev,
        isBottom: isNowBottom,
        inning: isNowBottom ? prev.inning : prev.inning + 1,
        balls: 0, strikes: 0, outs: 0, fouls: 0
      };
    });
  }, [saveHistory, logEvent, gameState]);

  const nextInning = useCallback(() => {
    saveHistory();
    logEvent('INNING_CHANGE', 'Next Inning', gameState);
    setGameState(prev => ({
      ...prev,
      inning: prev.inning + 1,
      isBottom: false,
      balls: 0, strikes: 0, outs: 0, fouls: 0
    }));
  }, [saveHistory, logEvent, gameState]);

  const renameTeam = (side: 'HOME' | 'AWAY', name: string) => {
    setGameState(prev => ({
      ...prev,
      [side === 'HOME' ? 'homeName' : 'awayName']: name
    }));
  };

  const confirmEndGame = useCallback(() => {
    setShowResetConfirm(false);
    setShowEndSummary(true);
    logEvent('END_GAME', 'Game Session Ended', gameState);
  }, [logEvent, gameState]);

  const downloadPDF = useCallback(() => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("KICKBALL GAME REPORT", 105, 20, { align: 'center' });
    
    doc.setDrawColor(203, 213, 225);
    doc.line(20, 25, 190, 25);

    // Final Outcome Section
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text("Game Outcome", 20, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [['Team', 'Score', 'Status']],
      body: [
        [gameState.awayName, gameState.awayScore, !gameState.isBottom ? 'Attacking' : 'Defending'],
        [gameState.homeName, gameState.homeScore, gameState.isBottom ? 'Attacking' : 'Defending'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Event Log Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text("Detailed Event Log", 20, finalY);

    const tableData = eventLog.map((event, index) => [
      index + 1,
      `${event.inning}${event.isBottom ? 'B' : 'T'}`,
      event.action,
      event.details,
      event.score
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['#', 'Inning', 'Action', 'Details', 'Score']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        4: { cellWidth: 30 },
      }
    });

    // Save
    doc.save(`kickball_report_${new Date().getTime()}.pdf`);
  }, [gameState, eventLog]);

  const startNewGame = useCallback(() => {
    setGameState(INITIAL_STATE);
    setHistory([]);
    setEventLog([]);
    setShowEndSummary(false);
  }, []);

  const adjustScore = (team: 'HOME' | 'AWAY', delta: number) => {
    saveHistory();
    logEvent('SCORE', `${delta > 0 ? '+' : ''}${delta} Points for ${team === 'HOME' ? gameState.homeName : gameState.awayName}`, gameState);
    setGameState(prev => ({
      ...prev,
      [team === 'HOME' ? 'homeScore' : 'awayScore']: Math.max(0, (team === 'HOME' ? prev.homeScore : prev.awayScore) + delta)
    }));
  };

  const isThreeOuts = gameState.outs === 3;

  return (
    <div className={`h-screen w-screen flex flex-col font-sans selection:bg-blue-500 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F8F9FA] text-slate-900'}`}>
      
      {/* Mobile Landscape Warning */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-6 text-center sm:hidden [orientation:landscape]:flex hidden">
        <RotateCcw className="mb-4 h-16 w-16 animate-spin text-blue-500" />
        <h2 className="mb-2 text-2xl font-bold text-white">모바일 세로 모드 권장</h2>
        <p className="text-slate-400">본 서비스는 모바일 세로 화면에서만 지원됩니다.<br />화면을 세로로 돌려주세요.</p>
      </div>

      <div className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden">
        {/* Modals */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={`w-full max-w-sm rounded-[2rem] border-4 p-8 shadow-2xl transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-rose-100 rounded-full text-rose-500">
                  <RotateCcw size={48} />
                </div>
                <h2 className="text-2xl font-black">경기를 종료하시겠습니까?</h2>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={confirmEndGame}
                    className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xl hover:bg-rose-600 active:scale-95 transition-all"
                  >
                    확인
                  </button>
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className={`flex-1 py-4 rounded-2xl font-black text-xl active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEndSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={`w-full max-w-sm rounded-[2rem] border-4 p-8 shadow-2xl transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-emerald-100 rounded-full text-emerald-500">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">경기를 종료하였습니다.</h2>
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>수고하셨습니다!</p>
                </div>

                <div className={`w-full p-4 rounded-2xl border-2 flex flex-col gap-2 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center font-bold">
                    <span>{gameState.awayName}</span>
                    <span className="text-2xl text-blue-500">{gameState.awayScore}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>{gameState.homeName}</span>
                    <span className="text-2xl text-blue-500">{gameState.homeScore}</span>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={downloadPDF}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-2xl font-black text-xl hover:bg-blue-600 active:scale-95 transition-all"
                  >
                    <FileDown size={24} /> PDF
                  </button>
                  <button 
                    onClick={startNewGame}
                    className={`w-full py-4 rounded-2xl font-black text-xl active:scale-95 transition-all ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'}`}
                  >
                    새 게임
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scoreboard Section */}
        <header className="flex-none w-full max-w-6xl mx-auto mb-4">
          <div className="grid grid-cols-3 gap-3 md:gap-6 items-stretch">
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
        <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex items-center mb-4 md:mb-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 w-full h-full">
            <LightIndicator label="BALL" count={gameState.balls} max={MAX_BALLS} color="green" isDarkMode={isDarkMode} onClick={handleBall} />
            <LightIndicator label="STRIKE" count={gameState.strikes} max={MAX_STRIKES} color="yellow" isDarkMode={isDarkMode} onClick={handleStrike} />
            <LightIndicator label="OUT" count={gameState.outs} max={MAX_OUTS} color="red" isDarkMode={isDarkMode} onClick={handleOut} />
            <LightIndicator label="FOUL" count={gameState.fouls} max={MAX_FOULS} color="orange" isDarkMode={isDarkMode} onClick={handleFoul} />
          </div>
        </main>

        {/* Controls Section */}
        <footer className="flex-none w-full max-w-6xl mx-auto">
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
                <RotateCcw size={18} /><span className="font-bold text-lg md:hidden lg:inline">타자 리셋</span>
              </button>
              <button onClick={undo} disabled={history.length === 0} className={`flex-1 flex items-center justify-center rounded-2xl border-4 ${history.length === 0 ? 'opacity-30' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                <Undo2 size={22} />
              </button>
              <button onClick={toggleTheme} className={`flex-1 flex items-center justify-center rounded-2xl border-4 ${isDarkMode ? 'bg-amber-400 border-slate-700 text-slate-900' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>
            <div className="flex-1 relative">
              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="w-full h-full flex items-center justify-center gap-2 bg-white border-slate-200 text-slate-400 rounded-2xl border-4 hover:bg-rose-50 hover:text-rose-500"
              >
                <RotateCcw size={18} /><span className="font-bold text-lg">전체 리셋</span>
              </button>
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
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full h-full flex flex-col items-center justify-center bg-white border-slate-200 text-slate-400 rounded-xl border-2"
              >
                <RotateCcw size={16} />
                <span className="font-bold text-[10px] mt-1">전체</span>
              </button>
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
    </div>
  );
}
