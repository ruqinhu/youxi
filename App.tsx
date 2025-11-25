
import React, { useState, useEffect, useCallback } from 'react';
import { CharacterPanel } from './components/CharacterPanel';
import { StoryLog } from './components/StoryLog';
import { ActionPanel } from './components/ActionPanel';
import { EnlightenmentGame } from './components/EnlightenmentGame';
import { DungeonModal } from './components/DungeonModal';
import { GameState, RealmLevel, LocationType, LogEntry, DungeonData } from './types';
import { generateStoryEvent, generateSceneVisual } from './services/geminiService';

// Initial State
const INITIAL_STATE: GameState = {
  playerName: "流浪修士",
  realm: RealmLevel.WHITE_MIST,
  currentQi: 10,
  maxQi: 100,
  stats: {
    body: 10,
    spirit: 10,
    daoHeart: 5
  },
  location: LocationType.TOWN,
  inventory: ["生锈铁剑", "干粮"],
  history: [{
    id: 'init',
    text: "你苏醒在凡尘之中。四周灵气稀薄，但通往九霄的大道就在前方。你目前的修为是：白雾境。",
    type: 'system',
    timestamp: Date.now()
  }],
  isMeditating: false,
  isThinking: false
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [activeDungeon, setActiveDungeon] = useState<{data: DungeonData, img?: string} | null>(null);

  // Helper to add logs
  const addLog = (text: string, type: LogEntry['type'] = 'narrative', imageUrl?: string, dungeonData?: DungeonData) => {
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, {
        id: Date.now().toString() + Math.random(),
        text,
        type,
        timestamp: Date.now(),
        imageUrl,
        dungeonData
      }]
    }));
  };

  // Handle Location Change
  const handleLocationChange = (newLocation: LocationType) => {
    setGameState(prev => ({
      ...prev,
      location: newLocation,
      history: [...prev.history, {
        id: Date.now().toString(),
        text: `你前往了 ${newLocation}。`,
        type: 'system',
        timestamp: Date.now()
      }]
    }));
  };

  // Main Action Handler
  const handleAction = async (action: string) => {
    if (gameState.isThinking) return;

    setGameState(prev => ({ ...prev, isThinking: true }));

    // Pre-calculate logic for limits
    if (action === 'Meditate' && gameState.currentQi >= gameState.maxQi) {
       addLog("你的丹田已满，在突破瓶颈前无法吸纳更多灵气。", 'system');
       setGameState(prev => ({ ...prev, isThinking: false }));
       return;
    }

    try {
      // Call Gemini for narrative and effects
      const response = await generateStoryEvent(action, gameState);
      
      // Generate Image based on the narrative
      let generatedImageUrl: string | undefined = undefined;
      // Only generate images for non-system errors and interesting events
      const imagePromptText = response.dungeonResult ? response.dungeonResult.scenario : response.narrative;
      
      if (imagePromptText && !imagePromptText.includes("Error")) {
          generatedImageUrl = await generateSceneVisual(imagePromptText, response.dungeonResult);
      }

      // If it is a dungeon result, STOP HERE and open the modal. Do not apply rewards yet.
      if (response.dungeonResult) {
         setGameState(prev => ({ ...prev, isThinking: false }));
         setActiveDungeon({ data: response.dungeonResult!, img: generatedImageUrl });
         return; 
      }

      // Standard Apply effects (for non-dungeon actions)
      setGameState(prev => {
        let newQi = prev.currentQi + (response.qiChange || 0);
        
        // Handle Limits
        if (newQi > prev.maxQi) newQi = prev.maxQi;
        if (newQi < 0) newQi = 0;

        let newMaxQi = prev.maxQi;
        let newRealm = prev.realm;
        
        // Handle Realm Breakthrough Success
        if (response.newRealm && response.newRealm !== prev.realm) {
            newRealm = response.newRealm;
            if (newRealm === RealmLevel.PURPLE_POLE) newMaxQi = 500;
            if (newRealm === RealmLevel.AZURE_ORIGIN) newMaxQi = 2000;
            if (newRealm === RealmLevel.GOLD_IMMORTAL) newMaxQi = 10000;
            newQi = Math.floor(newMaxQi * 0.2); 
        }

        const newInventory = response.itemGained 
            ? [...prev.inventory, response.itemGained] 
            : prev.inventory;

        return {
          ...prev,
          currentQi: newQi,
          maxQi: newMaxQi,
          realm: newRealm,
          inventory: newInventory,
          stats: {
            body: prev.stats.body + (response.statChanges?.body || 0),
            spirit: prev.stats.spirit + (response.statChanges?.spirit || 0),
            daoHeart: prev.stats.daoHeart + (response.statChanges?.daoHeart || 0),
          },
          isThinking: false
        };
      });

      addLog(response.narrative, 'narrative', generatedImageUrl);

      if (response.newRealm) {
          addLog(`境界突破成功！你已迈入 ${response.newRealm} ！`, 'system');
      }

    } catch (e) {
      console.error(e);
      addLog("天道无声（操作处理错误）。", 'system');
      setGameState(prev => ({ ...prev, isThinking: false }));
    }
  };

  // Mini Game Handlers
  const startMiniGame = () => {
      setShowMiniGame(true);
  };

  const finishMiniGame = (score: number) => {
      setShowMiniGame(false);
      if (score > 0) {
          const qiReward = score * 5; // 5 Qi per jump
          const spiritReward = Math.floor(score / 3);
          
          setGameState(prev => {
              const newQi = Math.min(prev.currentQi + qiReward, prev.maxQi);
              return {
                  ...prev,
                  currentQi: newQi,
                  stats: {
                      ...prev.stats,
                      spirit: prev.stats.spirit + spiritReward
                  }
              };
          });
          
          let comment = "你的心境略有起伏。";
          if (score > 5) comment = "你进入了物我两忘的境界。";
          if (score > 10) comment = "神魂如游龙般穿梭于灵台之间，令人惊叹！";

          addLog(`【神魂渡劫】你成功在灵台间跳跃了 ${score} 次。${comment} 获得灵气 +${qiReward}，神魂 +${spiritReward}。`, 'system');
      } else {
          addLog(`【神魂渡劫】心有杂念，刚一起步便坠入红尘。`, 'system');
      }
  };

  // Dungeon Handler
  const finishDungeon = (isCorrect: boolean) => {
    if (!activeDungeon) return;
    
    const { data, img } = activeDungeon;
    
    setGameState(prev => {
        let updates = { ...prev };
        let resultLog = "";
        
        if (isCorrect) {
            // Reward Logic
            const rewardQi = 50;
            const rewardDao = 5;
            
            updates.currentQi = Math.min(prev.currentQi + rewardQi, prev.maxQi);
            updates.stats = {
                ...prev.stats,
                daoHeart: prev.stats.daoHeart + rewardDao,
                spirit: prev.stats.spirit + 2
            };
            // Add a random generic item if not provided by generic API, simulating loop
            if (Math.random() > 0.5) {
                updates.inventory = [...prev.inventory, "未知维度碎片"];
            }

            resultLog = `【系统结算】判定通过。你在博弈中占据了上风。\n奖励: ${data.rewardText}\n(灵气 +${rewardQi}, 道心 +${rewardDao})`;
        } else {
            // Penalty Logic
            const penQi = 30;
            const penSpirit = 5;
            
            updates.currentQi = Math.max(prev.currentQi - penQi, 0);
            updates.stats = {
                ...prev.stats,
                spirit: Math.max(prev.stats.spirit - penSpirit, 0)
            };
            
            resultLog = `【系统结算】判定失败。你的策略导致了糟糕的后果。\n惩罚: ${data.penaltyText}\n(灵气 -${penQi}, 神魂 -${penSpirit})`;
        }

        // Add the log
        const newHistory = [...updates.history, {
            id: Date.now().toString(),
            text: resultLog,
            type: 'dungeon' as const, // Cast strictly
            timestamp: Date.now(),
            imageUrl: img,
            dungeonData: data
        }];

        return { ...updates, history: newHistory };
    });

    setActiveDungeon(null);
  };

  // Initial greeting
  useEffect(() => {
    // Check if API key is present roughly
    if (!process.env.API_KEY) {
        addLog("警告: 环境变量中未检测到 API_KEY。天道演化（AI叙事）可能无法正常工作。", 'system');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen bg-mystic-dark text-slate-200 overflow-hidden font-sans">
      
      {/* Mini Game Overlay */}
      {showMiniGame && (
          <EnlightenmentGame 
            onClose={() => setShowMiniGame(false)} 
            onComplete={finishMiniGame} 
          />
      )}

      {/* Dungeon Overlay */}
      {activeDungeon && (
          <DungeonModal 
            data={activeDungeon.data}
            imageUrl={activeDungeon.img}
            onComplete={finishDungeon}
          />
      )}

      {/* Left Panel: Character */}
      <div className="w-80 flex-shrink-0 hidden md:block h-full shadow-2xl z-20">
        <CharacterPanel gameState={gameState} />
      </div>

      {/* Center Panel: Story */}
      <div className="flex-grow flex flex-col h-full relative z-10">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-700 bg-mystic-dark">
            <h1 className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-bold tracking-widest">
                紫极生青：九霄
            </h1>
            <div className="md:hidden text-xs text-slate-500">
                {gameState.realm} | 灵气: {gameState.currentQi}
            </div>
        </header>
        <div className="flex-grow overflow-hidden relative">
             {/* Background Art Placeholder */}
             <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <StoryLog history={gameState.history} isThinking={gameState.isThinking} />
        </div>
      </div>

      {/* Right Panel: Actions */}
      <div className="w-72 flex-shrink-0 h-full shadow-2xl z-20 border-l border-slate-800">
        <ActionPanel 
            gameState={gameState} 
            onAction={handleAction} 
            onLocationChange={handleLocationChange} 
            onStartMiniGame={startMiniGame}
        />
      </div>
      
    </div>
  );
};

export default App;
