import {
  CalibrationLog,
  RadarMetric,
  UserLevel,
  UserStats,
  AIEvolutionStats,
  MindSyncPoint,
  DomainMastery,
} from '../types';

type ScoreAccessor = (score: LogScore) => number;

interface LogScore {
  evidence: number;
  breadth: number;
  depth: number;
  appropriateness: number;
  reflection: number;
  composite: number;
  accumulationEligible: boolean;
  domainHits: number;
}

interface ScoredLog {
  log: CalibrationLog;
  score: LogScore;
}

// Level thresholds aligned with一个标准教研周期（约 3-4 个月可升至 Lv3）
const LEVEL_THRESHOLDS = [0, 300, 900, 1800, 3200, 5000];
const LEVEL_TITLES = [
  '见习观察员',
  '初级分析师',
  '资深研习者',
  '评价素养专家',
  '儿童解读大师',
  '首席教研员',
];

// Increased decay factor to make history matter more (less volatile)
const DECAY_FACTOR = 0.95;
const QUALITY_THRESHOLD = 75; // Harder to get "quality" tag
const TARGET_HIGH_QUALITY_LOGS = 50; // Need more logs for full accumulation
const XP_CONFIG = {
  baseMultiplier: 0.5, // Slower XP gain
  reflectionBonus: 10,
  multiDomainBonus: 10,
  masteryBonus: 15,
};

const CONNECTIVE_KEYWORDS = [
  '因为',
  '因此',
  '所以',
  '于是',
  '然后',
  '接着',
  '最后',
  '先',
  '再',
  '同时',
];
const STRATEGY_KEYWORDS = [
  '引导',
  '鼓励',
  '支持',
  '提供',
  '安排',
  '示范',
  '共创',
  '计划',
  '调整',
  '合作',
  '策略',
  '反馈',
];
const OBSERVATION_KEYWORDS = ['观察', '记录', '追问', '倾听', '讨论', '反思', '分析'];

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  健康: ['跑', '跳', '力量', '平衡', '动作', '卫生', '饮食'],
  语言: ['讲述', '倾听', '词汇', '表达', '阅读'],
  社会: ['合作', '角色', '关心', '规则', '分享'],
  科学: ['实验', '探究', '比较', '推理', '磁铁', '观察到'],
  艺术: ['绘画', '节奏', '音乐', '表演', '造型'],
};

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));
const normalize = (value: number, lower: number, upper: number): number => {
  if (upper === lower) return 0;
  const raw = (value - lower) / (upper - lower);
  return clamp(raw, 0, 1);
};

const safeJoin = (parts: string[]): string => parts.filter(Boolean).join(' ');

const normalizeEvidenceText = (text: string): string => text.replace(/\s+/g, '').trim();

const countKeywordHits = (text: string, keywords: string[]): number => {
  if (!text) return 0;
  return keywords.reduce((sum, keyword) => {
    if (!keyword) return sum;
    const regex = new RegExp(keyword, 'g');
    return sum + (text.match(regex)?.length || 0);
  }, 0);
};

const detectDomains = (text: string): Set<string> => {
  const hits = new Set<string>();
  if (!text) return hits;
  Object.entries(DOMAIN_KEYWORDS).forEach(([domain, keywords]) => {
    keywords.forEach((keyword) => {
      if (keyword && text.includes(keyword)) {
        hits.add(domain);
      }
    });
  });
  return hits;
};

const scoreLog = (log: CalibrationLog): LogScore => {
  const originalLength = log.originalText?.length || 0;
  const calibratedEvidence = log.calibratedEvidence?.filter(Boolean) || [];
  const aiEvidence = log.aiInitialEvidence?.filter(Boolean) || [];
  const evidenceText = safeJoin(calibratedEvidence);
  const totalEvidenceChars = evidenceText.length;

  // 循证意识：覆盖率 + 证据链结构
  // Penalize if coverage is too high (> 80%), implies lazy selection
  const coverageRatio = originalLength === 0 ? 0 : totalEvidenceChars / originalLength;
  let coverageComponent = 0;
  if (coverageRatio > 0.8) {
    coverageComponent = 40; // Penalty for selecting everything
  } else {
    coverageComponent = normalize(coverageRatio, 0.05, 0.5) * 90;
  }

  const connectiveHits = countKeywordHits(evidenceText, CONNECTIVE_KEYWORDS);
  const connectiveDensity =
    calibratedEvidence.length === 0 ? 0 : connectiveHits / calibratedEvidence.length;
  const connectiveComponent = normalize(connectiveDensity, 0.1, 0.6) * 20; // Small bonus
  const evidenceScore = clamp(
    coverageComponent + connectiveComponent,
    calibratedEvidence.length === 0 ? 5 : 20,
    100
  );

  // 领域视野：基于关键词的多领域识别 (Stricter thresholds)
  const domainContext = `${log.domain || ''} ${safeJoin([log.originalText || '', evidenceText])}`;
  const domainHits = detectDomains(domainContext).size;
  const breadthScore = clamp(
    domainHits === 0 ? 20 : domainHits === 1 ? 45 : domainHits === 2 ? 70 : 90,
    20,
    100
  );

  // 领域深度：置信度 + 证据复杂度
  const avgEvidenceLength =
    calibratedEvidence.length === 0 ? 0 : totalEvidenceChars / calibratedEvidence.length;
  const evidenceComplexity = normalize(avgEvidenceLength, 25, 140) * 100;
  const confidenceScore = clamp((log.confidence ?? 0.55) * 100, 30, 100);
  const depthScore = clamp(confidenceScore * 0.5 + evidenceComplexity * 0.5, 20, 100);

  // 适宜性：策略与观察提示密度
  const strategyDensity = normalize(
    calibratedEvidence.length === 0
      ? 0
      : countKeywordHits(evidenceText, STRATEGY_KEYWORDS) / calibratedEvidence.length,
    0.15,
    0.8
  );
  const observationDensity = normalize(
    calibratedEvidence.length === 0
      ? 0
      : countKeywordHits(evidenceText, OBSERVATION_KEYWORDS) / calibratedEvidence.length,
    0.1,
    0.6
  );
  const appropriatenessScore = clamp(((strategyDensity + observationDensity) / 2) * 100, 15, 100);

  // 反思深度：AI→人工的差异类型
  const aiSet = new Set(aiEvidence.map(normalizeEvidenceText));
  const userSet = new Set(calibratedEvidence.map(normalizeEvidenceText));
  const added = Array.from(userSet).filter((item) => !aiSet.has(item)).length;
  const removed = Array.from(aiSet).filter((item) => !userSet.has(item)).length;
  const totalReference = aiSet.size + userSet.size || 1;
  const changeRatio = (added + removed) / totalReference;

  // If user makes NO changes, score depends on confidence.
  // If confidence was high, it's good (80). If low, it's bad (user missed opportunity).
  let reflectionScore = 0;
  if (changeRatio === 0) {
    reflectionScore = (log.confidence || 0) > 0.8 ? 85 : 50;
  } else {
    const additionShare = userSet.size === 0 ? 0 : added / userSet.size;
    const removalShare = aiSet.size === 0 ? 0 : removed / aiSet.size;
    reflectionScore = clamp(
      (changeRatio * 0.5 + (additionShare * 0.8 + removalShare * 0.2) * 0.5) * 100,
      30,
      100
    );
  }

  const composite =
    (evidenceScore + breadthScore + depthScore + appropriatenessScore + reflectionScore) / 5;
  const accumulationEligible = composite >= QUALITY_THRESHOLD;

  return {
    evidence: evidenceScore,
    breadth: breadthScore,
    depth: depthScore,
    appropriateness: appropriatenessScore,
    reflection: reflectionScore,
    composite,
    accumulationEligible,
    domainHits,
  };
};

const aggregateDimension = (scoredLogs: ScoredLog[], accessor: ScoreAccessor): number => {
  if (scoredLogs.length === 0) return 0;
  // Sort by timestamp descending
  const sorted = [...scoredLogs].sort((a, b) => parseTimestamp(b.log) - parseTimestamp(a.log));

  // Use a rolling window of top N recent logs to prevent one-off spikes
  // But still weight them by recency
  const WINDOW_SIZE = 20;
  const recentLogs = sorted.slice(0, WINDOW_SIZE);

  let weight = 1;
  let weightSum = 0;
  let total = 0;

  recentLogs.forEach((item) => {
    const value = accessor(item.score);
    total += value * weight;
    weightSum += weight;
    weight *= DECAY_FACTOR;
  });

  return weightSum === 0 ? 0 : total / weightSum;
};

const parseTimestamp = (log: CalibrationLog): number => {
  if (!log.timestamp) return 0;
  const parsed = Date.parse(log.timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
};

const computeXpFromScore = (score: LogScore): number => {
  const baseXp = Math.round(score.composite * XP_CONFIG.baseMultiplier);
  let bonus = 0;
  if (score.reflection >= 75) bonus += XP_CONFIG.reflectionBonus;
  if (score.domainHits >= 2) bonus += XP_CONFIG.multiDomainBonus;
  if (score.composite >= QUALITY_THRESHOLD) bonus += XP_CONFIG.masteryBonus;
  return baseXp + bonus;
};

const defaultRadar = (): RadarMetric[] => [
  { label: '循证意识', value: 0, fullMark: 100 },
  { label: '领域视野', value: 0, fullMark: 100 },
  { label: '领域深度', value: 0, fullMark: 100 },
  { label: '适宜性把握', value: 0, fullMark: 100 },
  { label: '反思深度', value: 0, fullMark: 100 },
  { label: '专业积累', value: 0, fullMark: 100 },
];

export const calculateLevel = (logs: CalibrationLog[]): UserLevel => {
  const scoredLogs = logs.map((log) => scoreLog(log));
  const currentXp = scoredLogs.reduce((sum, score) => sum + computeXpFromScore(score), 0);

  let levelIndex = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (currentXp >= LEVEL_THRESHOLDS[i]) {
      levelIndex = i;
    } else {
      break;
    }
  }

  const isMaxLevel = levelIndex >= LEVEL_THRESHOLDS.length - 1;
  const nextLevelXp = isMaxLevel ? 999999 : LEVEL_THRESHOLDS[levelIndex + 1];
  const prevLevelXp = LEVEL_THRESHOLDS[levelIndex];
  const levelRange = nextLevelXp - prevLevelXp;
  const xpInLevel = currentXp - prevLevelXp;
  const progressPercent = levelRange > 0 ? clamp((xpInLevel / levelRange) * 100, 0, 100) : 100;

  return {
    currentLevel: levelIndex + 1,
    currentTitle: LEVEL_TITLES[levelIndex] || LEVEL_TITLES[LEVEL_TITLES.length - 1],
    currentXp,
    nextLevelXp,
    progressPercent,
  };
};

export const calculateRadarMetrics = (logs: CalibrationLog[]): RadarMetric[] => {
  if (logs.length === 0) {
    return defaultRadar();
  }

  const scoredLogs: ScoredLog[] = logs.map((log) => ({ log, score: scoreLog(log) }));

  // Maturity Factor: Logarithmic growth to prevent early spikes
  // Need ~15 logs to reach 1.0 factor. 1 log = ~0.3
  // Formula: log2(count + 2) / 4  -> log2(3)/4 = 0.4, log2(16)/4 = 1.0
  const logCount = logs.length;
  const maturityFactor = clamp(Math.log2(logCount + 2) / 4.2, 0.3, 1.0);

  const evidence = aggregateDimension(scoredLogs, (score) => score.evidence) * maturityFactor;
  const breadth = aggregateDimension(scoredLogs, (score) => score.breadth) * maturityFactor;
  const depth = aggregateDimension(scoredLogs, (score) => score.depth) * maturityFactor;
  const appropriateness =
    aggregateDimension(scoredLogs, (score) => score.appropriateness) * maturityFactor;
  const reflection = aggregateDimension(scoredLogs, (score) => score.reflection) * maturityFactor;

  const accumulationEligibleCount = scoredLogs.filter(
    (item) => item.score.accumulationEligible
  ).length;
  // Accumulation is strictly linear/count based, no maturity factor needed (it is its own maturity)
  const accumulationScore = clamp(
    (accumulationEligibleCount / TARGET_HIGH_QUALITY_LOGS) * 100,
    0,
    100
  );

  return [
    { label: '循证意识', value: Math.round(evidence), fullMark: 100 },
    { label: '领域视野', value: Math.round(breadth), fullMark: 100 },
    { label: '领域深度', value: Math.round(depth), fullMark: 100 },
    { label: '适宜性把握', value: Math.round(appropriateness), fullMark: 100 },
    { label: '反思深度', value: Math.round(reflection), fullMark: 100 },
    { label: '专业积累', value: Math.round(accumulationScore), fullMark: 100 },
  ];
};

// --- AI Evolution Calculation --- 保持原有逻辑
export const calculateAIEvolution = (logs: CalibrationLog[]): AIEvolutionStats => {
  if (logs.length === 0) {
    return {
      mindSyncTrend: [],
      domainMastery: [],
      activeContextCount: 0,
      averageSyncScore: 0,
    };
  }

  const recentLogs = logs.slice(0, 10).reverse();
  const mindSyncTrend: MindSyncPoint[] = recentLogs.map((log, idx) => {
    const aiSet = new Set((log.aiInitialEvidence || []).map((s) => s.trim()));
    const userSet = new Set((log.calibratedEvidence || []).map((s) => s.trim()));

    if (aiSet.size === 0 && userSet.size === 0) {
      return { index: idx, score: 100, timestamp: log.timestamp };
    }

    let intersection = 0;
    userSet.forEach((item) => {
      if (aiSet.has(item)) intersection++;
    });

    const union = new Set([...Array.from(aiSet), ...Array.from(userSet)]).size;
    const score = union === 0 ? 0 : (intersection / union) * 100;

    return { index: idx, score: Math.round(score), timestamp: log.timestamp };
  });

  const averageSyncScore =
    mindSyncTrend.length > 0
      ? Math.round(mindSyncTrend.reduce((a, b) => a + b.score, 0) / mindSyncTrend.length)
      : 0;

  const domainStats: Record<string, number> = {};

  logs.forEach((log) => {
    if (log.domain) {
      const dName = log.domain.replace('领域', '').trim();
      domainStats[dName] = (domainStats[dName] || 0) + 1;
    }
  });

  const domainMastery: DomainMastery[] = Object.keys(domainStats)
    .map((domain) => {
      const count = domainStats[domain];
      const level = Math.min(100, count * 10);
      return { domain, level, count };
    })
    .sort((a, b) => b.level - a.level)
    .slice(0, 3);

  const activeContextCount = Math.min(logs.length, 15);

  return {
    mindSyncTrend,
    domainMastery,
    activeContextCount,
    averageSyncScore,
  };
};

export const getAssessmentFeedback = (radarData: RadarMetric[]): string => {
  if (!radarData || radarData.length === 0) return '开始您的第一次观察，点亮您的专业素养雷达。';

  const nonAccumulation = radarData.filter((metric) => metric.label !== '专业积累');
  const sortedMetrics = [...nonAccumulation].sort((a, b) => a.value - b.value);
  const weakest = sortedMetrics[0];
  const strongest = sortedMetrics[sortedMetrics.length - 1];
  const avgScore =
    nonAccumulation.reduce((acc, curr) => acc + curr.value, 0) / nonAccumulation.length;

  let stage = '';
  if (avgScore < 40) {
    stage = '成长起步期：继续练习证据链与反思结构，稳固基础。';
  } else if (avgScore < 70) {
    stage = '稳步发展期：核心素养逐渐成型，可尝试拓宽领域视角。';
  } else {
    stage = '专家成熟期：洞察力稳定，建议聚焦跨情境迁移。';
  }

  const strengthMsg = strongest ? `优势：${strongest.label}。` : '';
  const improvement =
    weakest && weakest.value < 65 ? `下一步：针对“${weakest.label}”参考档位要求，专项打磨。` : '';

  return `${stage} ${strengthMsg} ${improvement}`.trim();
};

const computeStreakDays = (logs: CalibrationLog[]): number => {
  if (logs.length === 0) return 0;
  const dates = logs
    .map((log) => (log.timestamp ? new Date(log.timestamp) : null))
    .filter((value): value is Date => value !== null)
    .map((date) => {
      const copy = new Date(date);
      copy.setHours(0, 0, 0, 0);
      return copy;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  if (dates.length === 0) return 0;

  let streak = 1;
  let lastDate = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const diffDays = (lastDate.getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 0) {
      continue; // same day entry
    }
    if (diffDays === 1) {
      streak++;
      lastDate = dates[i];
    } else {
      break;
    }
  }
  return streak;
};

export const getUserStats = (logs: CalibrationLog[]): UserStats => {
  const radarData = calculateRadarMetrics(logs);
  const totalObservations = logs.length;
  const totalCalibrations = logs.filter((log) => (log.calibratedEvidence || []).length > 0).length;
  const streakDays = computeStreakDays(logs);

  return {
    level: calculateLevel(logs),
    radarData,
    totalObservations,
    totalCalibrations,
    streakDays,
  };
};
