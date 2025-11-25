import React from 'react';
import { GameState, RealmLevel } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CharacterPanelProps {
  gameState: GameState;
}

const getRealmColor = (realm: RealmLevel) => {
  switch (realm) {
    case RealmLevel.MORTAL: return 'text-slate-400 border-slate-400 shadow-slate-900';
    case RealmLevel.WHITE_MIST: return 'text-qi-white border-qi-white shadow-white/20';
    case RealmLevel.PURPLE_POLE: return 'text-qi-purple border-qi-purple shadow-purple-500/50';
    case RealmLevel.AZURE_ORIGIN: return 'text-qi-azure border-qi-azure shadow-cyan-400/60 animate-glow';
    case RealmLevel.GOLD_IMMORTAL: return 'text-qi-gold border-qi-gold shadow-yellow-400/70 animate-pulse-slow';
    default: return 'text-slate-400';
  }
};

const getRealmBg = (realm: RealmLevel) => {
   switch (realm) {
    case RealmLevel.AZURE_ORIGIN: return 'bg-cyan-900/20';
    case RealmLevel.PURPLE_POLE: return 'bg-purple-900/20';
    default: return 'bg-slate-800/50';
  }
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ gameState }) => {
  const { realm, currentQi, maxQi, stats } = gameState;
  const qiPercent = Math.min((currentQi / maxQi) * 100, 100);
  const realmColorClass = getRealmColor(realm);
  const realmBgClass = getRealmBg(realm);

  const chartData = [
    { subject: '体魄', A: stats.body, fullMark: 100 },
    { subject: '神魂', A: stats.spirit, fullMark: 100 },
    { subject: '道心', A: stats.daoHeart, fullMark: 100 },
  ];

  return (
    <div className={`h-full w-full flex flex-col p-4 border-r border-slate-700 ${realmBgClass} transition-colors duration-1000`}>
      {/* Avatar / Realm Indicator */}
      <div className="flex flex-col items-center mb-6">
        <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-4 transition-all duration-700 ${realmColorClass} bg-black`}>
          <span className="text-4xl font-serif font-bold">
            {realm === RealmLevel.AZURE_ORIGIN ? '青' : 
             realm === RealmLevel.PURPLE_POLE ? '紫' : 
             realm === RealmLevel.GOLD_IMMORTAL ? '金' : '道'}
          </span>
        </div>
        <h2 className={`text-xl font-bold ${realmColorClass}`}>{gameState.playerName}</h2>
        <p className="text-sm text-slate-400 italic">{realm}</p>
      </div>

      {/* Qi Bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs mb-1 text-slate-300">
          <span>灵气 (Qi)</span>
          <span>{currentQi} / {maxQi}</span>
        </div>
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              realm === RealmLevel.AZURE_ORIGIN ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
              realm === RealmLevel.PURPLE_POLE ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
              'bg-slate-200'
            }`}
            style={{ width: `${qiPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Radar */}
      <div className="flex-grow min-h-[200px]">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 text-center">人物属性</h3>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Radar
              name="Stats"
              dataKey="A"
              stroke={
                realm === RealmLevel.AZURE_ORIGIN ? '#06b6d4' :
                realm === RealmLevel.PURPLE_POLE ? '#a855f7' : '#e2e8f0'
              }
              fill={
                realm === RealmLevel.AZURE_ORIGIN ? '#06b6d4' :
                realm === RealmLevel.PURPLE_POLE ? '#a855f7' : '#e2e8f0'
              }
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Inventory Mini-list */}
      <div className="mt-4 border-t border-slate-700 pt-4">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">储物袋</h3>
        <div className="flex flex-wrap gap-2">
            {gameState.inventory.length === 0 && <span className="text-xs text-slate-600">空无一物</span>}
            {gameState.inventory.map((item, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-300">
                    {item}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};