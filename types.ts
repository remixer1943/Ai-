
export enum AgeGroup {
  AUTO_DETECT = '由AI自动判断',
  THREE_TO_FOUR = '3-4岁',
  FOUR_TO_FIVE = '4-5岁',
  FIVE_TO_SIX = '5-6岁',
}

export interface QueryPayload {
  observation_text: string;
  age_group: AgeGroup;
}

export interface Prediction {
  value: string;
  confidence: number;
}

export interface MatchedTarget {
  id: string;
  title: string;
  source: string;
  evidence: string;
  reasoning: string;
  confidence: number;
  suggested_observations: string[];
  educationalSuggestions?: string[];
}

export interface QueryResult {
  queryId: string;
  inputText: string;
  selectedAgeGroup: AgeGroup;
  domainPrediction: Prediction;
  agePrediction: Prediction;
  matchedTargets: MatchedTarget[];
}

export enum FeedbackType {
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
}

export interface FeedbackPayload {
  queryId: string;
  targetId: string;
  feedbackType: FeedbackType;
}

export interface CalibrationLog {
  id: string;
  timestamp: string;
  originalText: string;
  aiInitialEvidence: string[];
  calibratedEvidence: string[];
  images?: { mimeType: string; data: string; }[];
  video?: { mimeType: string; data: string; };
  // New fields for advanced metrics
  domain?: string;
  confidence?: number;
}

// --- Gamification & Stats Types ---

export interface RadarMetric {
  label: string;
  value: number; // 0 to 100
  fullMark: number;
}

export interface UserLevel {
  currentLevel: number;
  currentTitle: string;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface UserStats {
  level: UserLevel;
  radarData: RadarMetric[];
  totalObservations: number;
  totalCalibrations: number;
  streakDays: number;
}

// --- AI Evolution Types ---

export interface MindSyncPoint {
  index: number;
  score: number; // 0-100 similarity score
  timestamp: string;
}

export interface DomainMastery {
  domain: string;
  level: number; // 0-100 proficiency
  count: number; // Number of samples
}

export interface AIEvolutionStats {
  mindSyncTrend: MindSyncPoint[];
  domainMastery: DomainMastery[];
  activeContextCount: number; // How many logs are effectively used for few-shot
  averageSyncScore: number;
}

// --- RAG Service Types ---

export interface RAGChunk {
  id: string;
  text: string;
  source: string;
  score: number;
}

export interface RAGResponse {
  chunks: RAGChunk[];
}
