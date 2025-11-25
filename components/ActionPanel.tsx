import React from 'react';
import { GameState, LocationType, RealmLevel } from '../types';

interface ActionPanelProps {
  gameState: GameState;
  onAction: (actionType: string) => void;
  onLocationChange: (loc: LocationType) => void;
  onStartMiniGame: () => void; // New prop
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ gameState, onAction, onLocationChange, onStartMiniGame }) => {
  const isMaxQi = gameState.currentQi >= gameState.maxQi;
  const canBreakthrough = isMaxQi && !gameState.isThinking;

  const locations = Object.values(LocationType);

  return (
    <div className="h-full flex flex-col p-4 border-l border-slate-700 bg-mystic-panel">
      
      {/* Location Selector */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-widest text-qi-azure mb-3 font-bold">云游 (Travel)</h3>
        <div className="space-y-2">
            {locations.map((loc) => (
                <button
                    key={loc}
                    onClick={() => onLocationChange(loc)}
                    disabled={gameState.isThinking || gameState.location === loc}
                    className={`w-full text-left px-3 py-2 rounded transition-all text-sm
                        ${gameState.location === loc 
                            ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white border-l-2 border-qi-azure' 
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}
                    `}
                >
                    {loc}
                </button>
            ))}
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex-grow">
        <h3 className="text-xs uppercase tracking-widest text-qi-purple mb-3 font-bold">修炼 (Cultivation)</h3>
        <div className="grid grid-cols-1 gap-3">
            <button
                onClick={() => onAction('Meditate')}
                disabled={gameState.isThinking}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-200 font-serif transition-colors"
            >
                打坐纳气 (Gather Qi)
            </button>
            
            <button
                onClick={() => onAction('Explore')}
                disabled={gameState.isThinking}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-200 font-serif transition-colors"
            >
                探索环境 (Explore)
            </button>

            <button
                onClick={onStartMiniGame}
                disabled={gameState.isThinking}
                className="w-full py-3 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-500/30 rounded text-indigo-200 font-serif transition-colors flex items-center justify-center gap-2 group"
            >
               <span>神魂渡劫 (小游戏)</span>
               <span className="text-xs px-1 bg-indigo-500 rounded text-white group-hover:scale-110 transition-transform">HOT</span>
            </button>

            {/* Infinite Dungeon Button */}
            <button
                onClick={() => onAction('Dungeon')}
                disabled={gameState.isThinking}
                className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded text-red-400 font-mono tracking-tighter transition-colors flex items-center justify-center gap-2 mt-2 group relative overflow-hidden"
            >
               <span className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></span>
               <span className="text-lg">⛩</span> 
               <span>诸天投影 (副本)</span>
            </button>
        </div>
      </div>

      {/* Breakthrough Button */}
      <div className="mt-auto pt-6 border-t border-slate-700">
         <button
            onClick={() => onAction('Breakthrough')}
            disabled={!canBreakthrough}
            className={`w-full py-4 rounded font-bold text-lg tracking-wider transition-all duration-500 shadow-lg
                ${canBreakthrough 
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white shadow-purple-900/50 transform hover:-translate-y-1' 
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'}
            `}
        >
            {gameState.realm === RealmLevel.PURPLE_POLE ? '冲击：紫极生青' : '尝试突破 (Breakthrough)'}
        </button>
        {isMaxQi && gameState.realm === RealmLevel.PURPLE_POLE && (
            <p className="text-xs text-center mt-2 text-qi-azure animate-pulse">
                紫气东来，青云直上。时机已到！
            </p>
        )}
      </div>

    </div>
  );
};