import React, { useState, useEffect, useRef, useCallback } from 'react';

interface EnlightenmentGameProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

interface Platform {
  id: number;
  left: number; // Percentage 0-100
  width: number; // Percentage
}

export const EnlightenmentGame: React.FC<EnlightenmentGameProps> = ({ onClose, onComplete }) => {
  const [gameState, setGameState] = useState<'waiting' | 'charging' | 'jumping' | 'landed' | 'failed' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [power, setPower] = useState(0);
  
  // Game World State (in Percentages)
  const [playerLeft, setPlayerLeft] = useState(15); // Player horizontal position
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 1, left: 5, width: 20 },
    { id: 2, left: 40, width: 20 }
  ]);

  const requestRef = useRef<number>(0);
  const powerDirection = useRef<1 | -1>(1);

  // Constants
  const JUMP_DURATION = 500; // ms
  const MAX_JUMP_DISTANCE = 60; // Max percentage screen width coverable
  
  // Initialize
  useEffect(() => {
    // Reset if needed
  }, []);

  // Charging Loop
  const chargeTick = useCallback(() => {
    setPower(prev => {
      let next = prev + 1.5 * powerDirection.current;
      if (next >= 100) {
        next = 100;
        powerDirection.current = -1; // Ping pong effect for difficulty
      } else if (next <= 0) {
        next = 0;
        powerDirection.current = 1;
      }
      return next;
    });
    requestRef.current = requestAnimationFrame(chargeTick);
  }, []);

  const startCharging = () => {
    if (gameState !== 'waiting' && gameState !== 'landed') return;
    setGameState('charging');
    setPower(0);
    powerDirection.current = 1;
    requestRef.current = requestAnimationFrame(chargeTick);
  };

  const stopCharging = () => {
    if (gameState !== 'charging') return;
    cancelAnimationFrame(requestRef.current);
    setGameState('jumping');

    // Calculate Jump
    const jumpDist = (power / 100) * MAX_JUMP_DISTANCE;
    const targetLeft = playerLeft + jumpDist;

    // Perform Animation logic
    // We update state immediately for the target position, but CSS transition handles the visual
    setPlayerLeft(targetLeft);

    // Check Collision after jump duration
    setTimeout(() => {
        checkLanding(targetLeft);
    }, JUMP_DURATION);
  };

  const checkLanding = (landingPos: number) => {
    // Find if we landed on the second platform (target)
    // The player width is roughly 4% (w-4 is 1rem usually ~16px, lets assume 4% for calculation logic)
    // We use the center point for simpler calculation
    const playerCenter = landingPos + 2; 
    
    // Check against the TARGET platform (index 1)
    const targetPlat = platforms[1];
    
    // Hit detection with some leniency
    if (playerCenter >= targetPlat.left && playerCenter <= targetPlat.left + targetPlat.width) {
      // Success
      handleSuccess();
    } else {
      // Check if we stayed on the first platform (failed to jump far enough)
      const currentPlat = platforms[0];
      if (playerCenter >= currentPlat.left && playerCenter <= currentPlat.left + currentPlat.width) {
         // Landed back on same platform, no score, just reset state
         setGameState('landed');
      } else {
         // Fell
         setGameState('failed');
      }
    }
  };

  const handleSuccess = () => {
    const newScore = score + 1;
    setScore(newScore);
    
    // Move Camera / Generate World
    // Instead of moving camera complexly, we shift platforms array
    // Old target becomes current platform. New target is generated.
    // Player position is relative to screen, so we need to shift everything back to left.
    
    // Current player position (e.g. 60%) needs to move back to ~15% (start pos)
    // So we subtract (playerLeft - 15) from everything.
    const shift = playerLeft - 15;
    
    // Generate next platform
    // Random distance: 20% to 50% gap
    // Random width: 15% to 25%
    const minGap = 15;
    const maxGap = 40;
    const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
    const nextWidth = Math.floor(Math.random() * 10) + 15; // 15-25% width
    
    const oldTarget = platforms[1];
    const newCurrent: Platform = {
        ...oldTarget,
        left: oldTarget.left - shift
    };

    const newTarget: Platform = {
        id: Date.now(),
        left: newCurrent.left + newCurrent.width + gap,
        width: nextWidth
    };

    setGameState('landed');
    setPlayerLeft(15); // Visual reset happens instantly or we animate it? 
    // To make it look like scrolling, we should animate the "Camera"
    // For simplicity in this v1, we just snap the world. 
    // Or we can animate the platforms moving left.
    setPlatforms([newCurrent, newTarget]);
  };

  const finishGame = () => {
      onComplete(score);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl h-[400px] bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="absolute top-4 left-4 z-10 text-qi-white font-serif text-xl font-bold drop-shadow-md">
            神魂渡劫
        </div>
        <div className="absolute top-4 right-4 z-10 text-qi-gold font-mono text-2xl font-bold drop-shadow-md">
            连击: {score}
        </div>

        {/* Game Area */}
        <div 
            className="flex-grow relative bg-gradient-to-b from-slate-900 to-slate-800 cursor-pointer overflow-hidden select-none"
            onMouseDown={startCharging}
            onMouseUp={stopCharging}
            onTouchStart={startCharging}
            onTouchEnd={stopCharging}
        >
            {/* Background Decoration */}
            <div className="absolute top-10 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>

            {/* Platforms */}
            {platforms.map(p => (
                <div 
                    key={p.id}
                    className="absolute bottom-10 h-32 bg-slate-700 rounded-t-sm border-t-4 border-slate-500 transition-all duration-500"
                    style={{ 
                        left: `${p.left}%`, 
                        width: `${p.width}%` 
                    }}
                >
                    {/* Platform Detail */}
                    <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
                </div>
            ))}

            {/* Player Character (Pixel Art) */}
            <div 
                className={`absolute bottom-[calc(2.5rem+8rem)] w-12 h-12 -ml-6 z-20 flex items-center justify-center transition-all 
                    ${gameState === 'jumping' ? 'ease-linear duration-[500ms]' : 'duration-0'}
                    ${gameState === 'failed' ? 'translate-y-64 opacity-0 duration-700 ease-in' : ''}
                `}
                style={{ 
                    left: `${playerLeft}%`,
                    animation: gameState === 'jumping' ? 'jumpArc 500ms ease-in-out forwards' : 'float 3s ease-in-out infinite'
                }}
            >
               {/* 8-bit Cultivator SVG */}
               <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" shapeRendering="crispEdges">
                  {/* Hair (Bun) */}
                  <path d="M10 2h4v2h-4z M9 4h6v2h-6z M9 6h1v1h-1z M14 6h1v1h-1z" fill="#0f172a" />
                  
                  {/* Face */}
                  <path d="M10 6h4v3h-4z M11 9h2v1h-2z" fill="#fcd34d" />
                  
                  {/* Robe (Body) */}
                  <path d="M9 10h6v8h-6z" fill="#e2e8f0" />
                  
                  {/* Robe (Blue Sash/Detail) */}
                  <path d="M11 10h2v8h-2z" fill="#06b6d4" />
                  
                  {/* Sleeves */}
                  <path d="M7 11h2v5h-2z M15 11h2v5h-2z" fill="#cbd5e1" />
                  
                  {/* Legs/Bottom */}
                  <path d="M9 18h2v2h-2z M13 18h2v2h-2z" fill="#1e293b" />
               </svg>
            </div>

            {/* Instructions / Status */}
            {gameState === 'waiting' && score === 0 && (
                <div className="absolute bottom-20 w-full text-center text-slate-400 text-sm animate-pulse">
                    按住鼠标/屏幕蓄力，松开跳跃
                </div>
            )}
            
            {gameState === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
                    <h2 className="text-3xl text-red-500 font-bold mb-2">坠入红尘</h2>
                    <p className="text-slate-300 mb-6">本次渡劫中止，心境受到历练。</p>
                    <button 
                        onClick={finishGame}
                        className="px-6 py-2 bg-qi-purple hover:bg-purple-600 text-white rounded shadow-lg transition-colors"
                    >
                        结束冥想 (领取灵气)
                    </button>
                </div>
            )}

            {/* Power Bar */}
            <div className={`absolute bottom-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 transition-all duration-75 ease-linear`}
                 style={{ width: `${power}%`, opacity: gameState === 'charging' ? 1 : 0 }}
            ></div>
        </div>
        
        {/* CSS for Jump Arc */}
        <style>{`
          @keyframes jumpArc {
            0% { transform: translateY(0); }
            50% { transform: translateY(-80px); }
            100% { transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
      
      {/* Close Button (if stuck) */}
      <button 
        onClick={() => onComplete(0)} 
        className="absolute top-4 right-4 text-white/50 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};