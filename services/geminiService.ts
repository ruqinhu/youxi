
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, RealmLevel, GeminiResponse, LocationType, DungeonData } from '../types';

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey: apiKey });

const MODEL_NAME = 'gemini-2.5-flash';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

// Helper to sanitize JSON string if the model adds markdown blocks
const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// --- Prompt Generators ---

const getCultivationPrompt = (action: string, gameState: GameState) => `
    你是一个修仙游戏《紫极生青》的“天道”（DM）。请使用中文（简体）回复。
    
    当前状态:
    - 核心概念: "紫极生青" (Purple Essence births Azure)。
    - 玩家: ${gameState.playerName}, 境界: ${gameState.realm}, 地点: ${gameState.location}。
    - 属性: 体魄(${gameState.stats.body}), 神魂(${gameState.stats.spirit}), 道心(${gameState.stats.daoHeart})。
    - 玩家行为: 玩家试图 "${action}"。

    任务:
    根据玩家行为生成一段简短、有氛围感的修仙叙事。
    如果是“打坐”，描述灵气的流动。
    如果是“探索”，根据当前地点描述遭遇或发现。
    
    规则:
    - 如果行为是 "Breakthrough" (突破):
      - 从 '白雾境' 到 '紫极境': 需要 100 灵气。中等难度。
      - 从 '紫极境' 到 '青源境': 这是核心的“紫极生青”事件。需要 灵气全满 且 高道心。非常困难。如果失败，描述“反噬”或“心魔”。如果成功，描述莲花由紫转青的异象。
    - 严禁返回 DungeonResult 字段。
    - 请返回符合 Schema 的有效 JSON。
`;

const getInfiniteDungeonPrompt = (gameState: GameState) => `
    你现在是《惊悚乐园》风格的“系统”。你的语气冷漠、机械、带有黑色幽默或嘲讽。
    
    核心任务: 生成一个基于【博弈论】(Game Theory) 的危机选择题。
    
    步骤:
    1. 随机选择一个副本风格: 灵异(Horror)、科幻(SciFi)、废土(Wasteland)、悬疑(Mystery) 或 历史(Historical)。
    2. 构思一个场景 (Scenario)，在该场景中，玩家必须应用博弈论逻辑（如囚徒困境、智猪博弈、纳什均衡、零和博弈、胆小鬼博弈等）来生存。
    3. 提出一个单项选择问题 (Question)，询问玩家最佳策略或结果。
    4. 提供4个选项 (Options)，只有一个是符合博弈论最优解或最理性的。
    
    Schema 字段说明:
    - narrative: 简短的进入副本描述。
    - dungeonResult.scenario: 详细的危机场景描述（100字左右）。
    - dungeonResult.question: 具体的问题。
    - dungeonResult.options: 4个选项的字符串数组。
    - dungeonResult.correctIndex: 正确选项的索引 (0-3)。
    - dungeonResult.rewardText: 成功后的奖励描述（如“获得了高维碎片”）。
    - dungeonResult.penaltyText: 失败后的惩罚描述（如“被精神污染，SAN值狂掉”）。
    - dungeonResult.difficulty: 难度等级 (S/A/B/C/D)。
    - dungeonResult.rating: 综合评级 (S/A/B/C/D)，通常与难度一致。
    - dungeonResult.summary: 一句简短的剧情梗概，用于日志记录。
    
    请确保问题具有逻辑性，不要纯靠运气猜测。
`;

export const generateStoryEvent = async (
  action: string,
  gameState: GameState
): Promise<GeminiResponse> => {
  if (!apiKey) {
    return {
      narrative: "天道渺茫（API Key 缺失），你只能在心中默默冥想。",
      qiChange: 5
    };
  }

  const isDungeon = action === 'Dungeon';
  const prompt = isDungeon ? getInfiniteDungeonPrompt(gameState) : getCultivationPrompt(action, gameState);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            qiChange: { type: Type.INTEGER },
            statChanges: {
              type: Type.OBJECT,
              properties: {
                body: { type: Type.INTEGER },
                spirit: { type: Type.INTEGER },
                daoHeart: { type: Type.INTEGER },
              }
            },
            itemGained: { type: Type.STRING },
            newRealm: { 
              type: Type.STRING, 
              enum: [
                RealmLevel.MORTAL, 
                RealmLevel.WHITE_MIST, 
                RealmLevel.PURPLE_POLE, 
                RealmLevel.AZURE_ORIGIN, 
                RealmLevel.GOLD_IMMORTAL
              ] 
            },
            dungeonResult: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Horror', 'SciFi', 'Wasteland', 'Mystery', 'Historical'] },
                    difficulty: { type: Type.STRING, enum: ['S', 'A', 'B', 'C', 'D'] },
                    rating: { type: Type.STRING, enum: ['S', 'A', 'B', 'C', 'D'] },
                    summary: { type: Type.STRING },
                    scenario: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    rewardText: { type: Type.STRING },
                    penaltyText: { type: Type.STRING }
                }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Dao.");
    
    return JSON.parse(cleanJson(text)) as GeminiResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      narrative: "系统连接中断... 数据丢失。",
      qiChange: 0
    };
  }
};

export const generateSceneVisual = async (narrative: string, dungeonData?: DungeonData): Promise<string | undefined> => {
  if (!apiKey) return undefined;

  let stylePrompt = "Eastern Fantasy (Xianxia), Mystical, Ethereal, Ancient Chinese aesthetics.";
  
  if (dungeonData) {
      switch (dungeonData.type) {
          case 'Horror': stylePrompt = "Horror, Dark, Gritty, Lovecraftian, Red and Black color palette, Spooky."; break;
          case 'SciFi': stylePrompt = "Cyberpunk, Neon, High-tech, Futuristic city, Blue and Pink lights."; break;
          case 'Wasteland': stylePrompt = "Post-apocalyptic, Rusty, Desert, Mad Max style, Desolate."; break;
          case 'Mystery': stylePrompt = "Noir, Rainy, Shadows, Detective, Victorian London vibe."; break;
          case 'Historical': stylePrompt = "Ancient War, Sepia tones, Realistic, Battlefield."; break;
      }
  }

  const prompt = `
    Generate a pixel art style image (16-bit retro RPG video game style) depicting the following scene:
    "${dungeonData ? dungeonData.scenario : narrative}"
    
    Visual Style Requirements:
    - Art Style: High-quality Pixel Art, 16-bit, SNES-era aesthetic.
    - Theme/Genre: ${stylePrompt}
    - View: Side-scrolling or Isometric game view.
    - Content: No text, no UI elements. Just the scene/environment or character action.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME, // gemini-2.5-flash-image
      contents: prompt,
    });

    // Extract image from parts
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return undefined;
  }
};
