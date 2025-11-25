
export enum RealmLevel {
  MORTAL = '凡人',
  WHITE_MIST = '白雾境',
  PURPLE_POLE = '紫极境',
  AZURE_ORIGIN = '青源境',
  GOLD_IMMORTAL = '金仙境'
}

export enum LocationType {
  SECT = '太虚剑派',
  CITY = '天机城',
  RUINS = '归墟遗迹',
  POND = '悟道天池',
  TOWN = '凡人小镇'
}

export interface PlayerStats {
  body: number; // Physical resilience
  spirit: number; // Magical power/Control
  daoHeart: number; // Mental resilience/Epiphany chance
}

export interface DungeonData {
  title: string;
  type: 'Horror' | 'SciFi' | 'Wasteland' | 'Mystery' | 'Historical';
  difficulty: 'S' | 'A' | 'B' | 'C' | 'D';
  scenario: string; // The situation description
  question: string; // The game theory question
  options: string[]; // 4 options
  correctIndex: number; // 0-3
  rewardText: string;
  penaltyText: string;
  rating: 'S' | 'A' | 'B' | 'C' | 'D';
  summary: string;
}

export interface GameState {
  playerName: string;
  realm: RealmLevel;
  currentQi: number;
  maxQi: number;
  stats: PlayerStats;
  location: LocationType;
  inventory: string[];
  history: LogEntry[];
  isMeditating: boolean;
  isThinking: boolean; // For Gemini Loading state
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'narrative' | 'dialogue' | 'system' | 'combat' | 'dungeon';
  timestamp: number;
  imageUrl?: string; // New field for generated pixel art
  dungeonData?: DungeonData; // Structured data for dungeon results
}

export interface GeminiResponse {
  narrative: string;
  qiChange?: number;
  statChanges?: Partial<PlayerStats>;
  itemGained?: string;
  newRealm?: RealmLevel;
  dungeonResult?: DungeonData; // Return structured data from AI
}
