
import React, { useState } from 'react';
import { DungeonData } from '../types';

interface DungeonModalProps {
  data: DungeonData;
  imageUrl?: string;
  onComplete: (isCorrect: boolean) => void;
}

export const DungeonModal: React.FC<DungeonModalProps> = ({ data, imageUrl, onComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleOptionClick = (index: number) => {
    if (isRevealed) return;
    setSelectedIndex(index);
    setIsRevealed(true);

    const isCorrect = index === data.correctIndex;
    
    // Delay to show the result animation before closing
    setTimeout(() => {
      onComplete(isCorrect);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-mono">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col md:flex-row bg-slate-900 border-2 border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-lg overflow-hidden relative">
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

        {/* Left: Visual & Scenario */}
        <div className="md:w-1/2 p-6 flex flex-col border-b md:border-b-0 md:border-r border-red-900/30 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-red-500 font-bold tracking-widest text-xs border border-red-500 px-2 py-1 bg-red-950/30">
              WARNING: SYSTEM BREACH
            </span>
            <span className="text-slate-500 text-xs">
              TYPE: {data.type} | DIFF: {data.difficulty}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-100 mb-4 font-serif">{data.title}</h2>

          {/* Image */}
          <div className="w-full aspect-video bg-black mb-6 rounded border border-slate-700 overflow-hidden relative group">
             {imageUrl ? (
               <img src={imageUrl} alt="Scenario" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-600 animate-pulse">
                 [IMAGE DATA CORRUPTED]
               </div>
             )}
             {/* Scan line effect */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-2 w-full animate-[scan_2s_linear_infinite] pointer-events-none"></div>
          </div>

          {/* Text */}
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            <span className="text-red-400 font-bold mr-2">[SCENARIO LOG]:</span>
            {data.scenario}
          </div>
        </div>

        {/* Right: Question & Interaction */}
        <div className="md:w-1/2 p-6 flex flex-col justify-center bg-slate-950/50">
           
           <div className="mb-8">
             <h3 className="text-lg text-qi-azure mb-4 font-bold border-l-4 border-qi-azure pl-3">
               DECISION REQUIRED
             </h3>
             <p className="text-slate-200 text-lg font-medium">{data.question}</p>
           </div>

           <div className="space-y-3">
             {data.options.map((opt, idx) => {
               let btnClass = "border-slate-600 hover:bg-slate-800 text-slate-300";
               
               if (isRevealed) {
                 if (idx === data.correctIndex) {
                   btnClass = "border-green-500 bg-green-900/40 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                 } else if (idx === selectedIndex) {
                   btnClass = "border-red-500 bg-red-900/40 text-red-100";
                 } else {
                   btnClass = "border-slate-800 opacity-30 cursor-not-allowed";
                 }
               }

               return (
                 <button
                   key={idx}
                   onClick={() => handleOptionClick(idx)}
                   disabled={isRevealed}
                   className={`w-full text-left p-4 rounded border transition-all duration-300 relative overflow-hidden group ${btnClass}`}
                 >
                   <div className="relative z-10 flex items-center">
                     <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs mr-3 opacity-70">
                       {String.fromCharCode(65 + idx)}
                     </span>
                     <span>{opt}</span>
                   </div>
                 </button>
               );
             })}
           </div>

           {isRevealed && (
             <div className="mt-6 text-center animate-bounce">
               {selectedIndex === data.correctIndex ? (
                 <span className="text-green-400 font-bold tracking-widest text-xl">
                   /// LOGIC VERIFIED ///
                 </span>
               ) : (
                 <span className="text-red-500 font-bold tracking-widest text-xl">
                   /// FATAL ERROR ///
                 </span>
               )}
             </div>
           )}

        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};
