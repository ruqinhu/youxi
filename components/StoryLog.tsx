import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface StoryLogProps {
  history: LogEntry[];
  isThinking: boolean;
}

export const StoryLog: React.FC<StoryLogProps> = ({ history, isThinking }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isThinking]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-6 flex flex-col gap-4 bg-mystic-dark bg-opacity-95 relative">
      <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-mystic-dark to-transparent pointer-events-none z-10"></div>
      
      <div className="pt-4 flex flex-col gap-6">
        {history.map((entry) => (
          <div 
            key={entry.id} 
            className={`
              rounded-lg shadow-lg backdrop-blur-sm animate-fade-in overflow-hidden
              ${entry.type === 'dungeon' ? 'border-2 border-green-500/50 bg-black' : ''}
              ${entry.type === 'system' ? 'p-4 border-l-4 border-slate-500 bg-slate-900/40 text-slate-400 text-sm font-mono' : ''}
              ${entry.type === 'combat' ? 'p-4 border-l-4 border-red-500 bg-red-900/10 text-red-100' : ''}
              ${entry.type === 'narrative' ? 'p-4 border-l-4 border-qi-purple bg-slate-800/40 text-slate-200 font-serif leading-relaxed' : ''}
            `}
          >
            {/* Standard Image Rendering */}
            {entry.imageUrl && (
                <div className={`w-full h-48 md:h-64 overflow-hidden border-b border-slate-700 bg-black/50 ${entry.type === 'dungeon' ? 'border-green-900' : ''}`}>
                    <img 
                        src={entry.imageUrl} 
                        alt="Scene Visualization" 
                        className="w-full h-full object-cover object-center animate-fade-in hover:scale-105 transition-transform duration-700"
                    />
                </div>
            )}

            {/* Special Dungeon Result Layout */}
            {entry.type === 'dungeon' && entry.dungeonData ? (
                <div className="p-4 font-mono text-green-400">
                    <div className="flex justify-between items-start border-b border-green-800 pb-2 mb-2">
                        <div>
                            <span className="bg-green-900 text-green-100 text-xs px-2 py-1 rounded mr-2">{entry.dungeonData.type}</span>
                            <h3 className="text-lg font-bold inline">{entry.dungeonData.title}</h3>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-green-600 uppercase">Rating</div>
                             <div className={`text-2xl font-bold ${
                                 entry.dungeonData.rating === 'S' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 
                                 entry.dungeonData.rating === 'A' ? 'text-purple-400' : 
                                 'text-green-400'
                             }`}>
                                 {entry.dungeonData.rating}
                             </div>
                        </div>
                    </div>
                    
                    <div className="mb-3 text-sm text-green-300/80 leading-relaxed italic">
                        "{entry.dungeonData.summary}"
                    </div>
                    
                    <div className="bg-green-900/20 p-2 rounded border border-green-900/50 text-xs">
                         <span className="text-green-600 mr-2">[SYSTEM LOG]</span>
                         {entry.text}
                    </div>
                </div>
            ) : (
                /* Standard Text Rendering (if not dungeon or simple dungeon log) */
                 entry.type !== 'dungeon' && <p>{entry.text}</p>
            )}
            
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center justify-center p-4 text-qi-purple animate-pulse">
            <span className="mr-2 text-lg">✦</span> 天道推演中...
          </div>
        )}
      </div>
      
      <div ref={bottomRef} className="pb-4"></div>
    </div>
  );
};