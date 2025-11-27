import React, { useState, useEffect } from 'react';
import DOMPurify, { Config as DOMPurifyConfig } from 'dompurify';
import { CalibrationLog, AIEvolutionStats } from '../types';
import { getGrowthInsightAnalysis } from '../services/guideService';
import {
  getUserStats,
  getAssessmentFeedback,
  calculateAIEvolution,
} from '../services/gamificationService';
import { Spinner } from './Spinner';
import { DataManagement } from './DataManagement';
import { RadarChart } from './RadarChart';

// --- SVG Badges ---

const SeedlingBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-emerald-50 dark:fill-emerald-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M32 52V28"
      className="stroke-emerald-600 dark:stroke-emerald-400"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M32 42C32 42 20 40 20 28C20 20 32 20 32 20"
      className="stroke-emerald-600 dark:stroke-emerald-400"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M32 36C32 36 44 34 44 24C44 18 32 18 32 18"
      className="stroke-emerald-500 dark:stroke-emerald-300"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const QuillBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-blue-50 dark:fill-blue-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M46 16C46 16 28 36 26 42C24 48 22 52 22 52C22 52 28 48 32 44C36 40 46 16 46 16Z"
      className="stroke-blue-600 dark:stroke-blue-400"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M31 38L39 29" className="stroke-blue-400 dark:stroke-blue-300" strokeWidth="2" />
  </svg>
);

const CompassBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-indigo-50 dark:fill-indigo-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="32"
      cy="32"
      r="16"
      className="stroke-indigo-600 dark:stroke-indigo-400"
      strokeWidth="2"
    />
    <path
      d="M32 16V24M32 40V48M16 32H24M40 32H48"
      className="stroke-indigo-400 dark:stroke-indigo-500"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M32 26L36 32L32 38L28 32L32 26Z" className="fill-indigo-600 dark:fill-indigo-400" />
  </svg>
);

const LanternBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-amber-50 dark:fill-amber-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M24 24H40L44 46H20L24 24Z"
      className="stroke-amber-600 dark:stroke-amber-400"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M32 24V16M32 16C36 16 38 18 38 20"
      className="stroke-amber-600 dark:stroke-amber-400"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M32 28V42"
      className="stroke-amber-400 dark:stroke-amber-300"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle
      cx="32"
      cy="35"
      r="4"
      className="fill-amber-300 dark:fill-amber-200"
      filter="blur(2px)"
    />
  </svg>
);

const GemBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-violet-50 dark:fill-violet-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M20 28L32 18L44 28L32 50L20 28Z"
      className="stroke-violet-600 dark:stroke-violet-400"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M20 28H44" className="stroke-violet-600 dark:stroke-violet-400" strokeWidth="2" />
    <path d="M32 18V50" className="stroke-violet-400 dark:stroke-violet-500" strokeWidth="1" />
    <path
      d="M26 28L32 50L38 28"
      className="stroke-violet-400 dark:stroke-violet-500"
      strokeWidth="1"
    />
  </svg>
);

const TrophyBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-yellow-50 dark:fill-yellow-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M22 20H42V30C42 38 36 42 32 42C28 42 22 38 22 30V20Z"
      className="stroke-yellow-600 dark:stroke-yellow-400"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M42 24H48C50 24 50 30 48 32H42"
      className="stroke-yellow-600 dark:stroke-yellow-400"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M22 24H16C14 24 14 30 16 32H22"
      className="stroke-yellow-600 dark:stroke-yellow-400"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M32 42V50M26 50H38"
      className="stroke-yellow-600 dark:stroke-yellow-400"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CrownBadge = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle
      cx="32"
      cy="32"
      r="30"
      className="fill-rose-50 dark:fill-rose-900/20"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M18 42H46L48 26L38 32L32 18L26 32L16 26L18 42Z"
      className="stroke-rose-600 dark:stroke-rose-400"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="14" r="2" className="fill-rose-400" />
    <circle cx="14" cy="24" r="2" className="fill-rose-400" />
    <circle cx="50" cy="24" r="2" className="fill-rose-400" />
  </svg>
);

const getBadgeComponent = (level: number) => {
  if (level <= 1) return SeedlingBadge;
  if (level === 2) return QuillBadge;
  if (level === 3) return CompassBadge;
  if (level === 4) return LanternBadge;
  if (level === 5) return GemBadge;
  if (level === 6) return TrophyBadge;
  return CrownBadge;
};

const renderBadge = (level: number, props?: React.SVGProps<SVGSVGElement>) => {
  const BadgeComponent = getBadgeComponent(level);
  return <BadgeComponent {...props} />;
};

// --- Helper Components ---

const dashboardSanitizeOptions: DOMPurifyConfig = {
  ALLOWED_TAGS: ['span', 'br'],
  ALLOWED_ATTR: ['class'],
};

const renderHighlightedText = (text: string, phrases: string[]) => {
  let content = text;
  if (phrases && phrases.length > 0) {
    const uniquePhrases = [...new Set(phrases)].sort((a, b) => b.length - a.length);
    uniquePhrases.forEach((phrase) => {
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
      if (escapedPhrase === '') return;
      try {
        const regex = new RegExp(`(${escapedPhrase})`, 'g');
        content = content.replace(
          regex,
          `<span class="bg-yellow-100 dark:bg-yellow-900/40 rounded px-1 box-decoration-clone font-semibold text-slate-800 dark:text-slate-200 border-b border-yellow-300/50">${'$1'}</span>`
        );
      } catch (e) {
        console.warn(`Could not apply regex for phrase: "${escapedPhrase}"`, e);
      }
    });
  }

  const sanitizedContent = DOMPurify.sanitize(
    content.replace(/\n/g, '<br />'),
    dashboardSanitizeOptions
  );

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};

// 格式化洞察文本：移除 Markdown 格式，转换为干净的结构化展示
const formatInsightText = (text: string) => {
  // 移除所有 Markdown 加粗符号
  const cleaned = text.replace(/\*\*(.+?)\*\*/g, '$1');

  // 按段落分割（双换行或单换行）
  const sections = cleaned.split(/\n\n+/).filter((s) => s.trim());

  return sections.map((section, sectionIndex) => {
    const lines = section.split('\n').filter((l) => l.trim());
    const elements: React.ReactElement[] = [];

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();

      // 检测是否是列表项（以 - 或数字. 开头）
      const listMatch = trimmed.match(/^[-*]\s+(.+)$/) || trimmed.match(/^\d+\.\s+(.+)$/);

      if (listMatch) {
        // 列表项：移除前缀，添加项目符号
        elements.push(
          <div key={`${sectionIndex}-${lineIndex}`} className="flex gap-2 ml-3 mb-1.5">
            <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
            <span>{listMatch[1]}</span>
          </div>
        );
      } else if (trimmed) {
        // 普通段落或标题
        const isTitle = trimmed.endsWith(':') || trimmed.endsWith('：');
        elements.push(
          <p
            key={`${sectionIndex}-${lineIndex}`}
            className={
              isTitle
                ? 'font-bold text-indigo-700 dark:text-indigo-300 mb-2 mt-3 first:mt-0'
                : 'mb-2'
            }
          >
            {trimmed}
          </p>
        );
      }
    });

    return <div key={sectionIndex}>{elements}</div>;
  });
};

const GrowthInsight: React.FC<{ log: CalibrationLog; apiProvider: string }> = ({
  log,
  apiProvider,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !insight) {
      const fetchInsight = async () => {
        setIsLoading(true);
        try {
          const analysis = await getGrowthInsightAnalysis({
            originalText: log.originalText,
            aiInitialEvidence: log.aiInitialEvidence,
            calibratedEvidence: log.calibratedEvidence,
          });
          setInsight(analysis);
        } catch (error) {
          console.error(error);
          setInsight('无法加载AI成长洞探分析。');
        } finally {
          setIsLoading(false);
        }
      };
      fetchInsight();
    }
  }, [isOpen, log, apiProvider, insight]);

  return (
    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full bg-indigo-500 transition-transform ${isOpen ? 'scale-125' : ''}`}
        ></span>
        {isOpen ? '收起洞察' : '查看AI素养进阶洞察'}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30 animate-fade-in">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Spinner />
              <span>深度思考中...</span>
            </div>
          ) : (
            <div className="text-[12px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
              {formatInsightText(insight)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MindSyncChart: React.FC<{ data: AIEvolutionStats['mindSyncTrend'] }> = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-10 flex items-center justify-center text-[10px] text-cyan-600/50 dark:text-cyan-400/50 font-mono border border-dashed border-cyan-900/10 dark:border-cyan-500/20 rounded-lg bg-cyan-50/30 dark:bg-cyan-900/10">
        <span className="animate-pulse scale-90">等待数据...</span>
      </div>
    );
  }

  const width = 200;
  const height = 40;
  const padding = 2;

  const getY = (score: number) => height - padding - (score / 100) * (height - padding * 2);
  const getX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);

  const points = data.map((p, i) => `${getX(i)},${getY(p.score)}`).join(' ');
  const areaPath = `${points} L${width - padding},${height} L${padding},${height} Z`;

  return (
    <div className="relative h-10 w-full bg-cyan-50/20 dark:bg-cyan-900/5 rounded-lg overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="syncGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#syncGradient)" />
        <path
          d={`M${points}`}
          fill="none"
          className="stroke-cyan-500 dark:stroke-cyan-400"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CompactLogCard: React.FC<{
  log: CalibrationLog;
  apiProvider: string;
  defaultExpanded?: boolean;
}> = ({ log, apiProvider, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const aiCount = log.aiInitialEvidence.length;
  const userCount = log.calibratedEvidence.length;
  const hasCalibration = userCount > 0;

  return (
    <div
      className={`bg-white dark:bg-slate-800/50 border rounded-xl transition-all duration-300 ${
        isExpanded
          ? 'border-indigo-300 dark:border-indigo-700 shadow-md'
          : 'border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-600'
      }`}
    >
      {/* 折叠头部 - 可点击 */}
      <div className="p-4 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center flex-1">
            {/* 日期 */}
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              📅 {new Date(log.timestamp).toLocaleDateString('zh-CN')}
            </span>

            {/* 领域标签 */}
            {log.domain && (
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50">
                🏷️ {log.domain}
              </span>
            )}

            {/* 证据对比 */}
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              证据: AI {aiCount}条
              {hasCalibration && (
                <>
                  <span className="mx-1">→</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    专家 {userCount}条
                  </span>
                </>
              )}
            </span>
          </div>

          {/* 展开/折叠图标 */}
          <ChevronDownIcon
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* 展开内容区 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700/50 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AI */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> AI 初步识别
              </div>
              <div className="text-[12px] text-slate-600 dark:text-slate-300 leading-snug bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                {log.aiInitialEvidence.length > 0 ? (
                  renderHighlightedText(log.originalText, log.aiInitialEvidence)
                ) : (
                  <span className="italic opacity-40">未识别到关键证据</span>
                )}
              </div>
            </div>

            {/* User */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>{' '}
                专家校准
              </div>
              <div className="text-[12px] text-slate-700 dark:text-slate-200 leading-snug bg-emerald-50/30 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100/30 dark:border-emerald-900/30">
                {log.calibratedEvidence.length > 0 ? (
                  renderHighlightedText(log.originalText, log.calibratedEvidence)
                ) : (
                  <span className="italic opacity-40">未进行校准</span>
                )}
              </div>
            </div>
          </div>

          <GrowthInsight log={log} apiProvider={apiProvider} />
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

interface TrainingDashboardProps {
  logs: CalibrationLog[];
  onClearLogs: () => void;
  apiProvider: string;
}

export const TrainingDashboard: React.FC<TrainingDashboardProps> = ({
  logs,
  onClearLogs,
  apiProvider,
}) => {
  const stats = getUserStats(logs);
  const aiStats = calculateAIEvolution(logs);
  const feedbackText = getAssessmentFeedback(stats.radarData);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto font-['Noto_Sans_SC'] pb-10 pt-4">
      {/* Top Grid: Identity & Stats */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* 1. Identity Card (Wide) */}
        <div className="col-span-12 sm:col-span-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-50/80 to-transparent dark:from-indigo-900/20 pointer-events-none transition-opacity group-hover:opacity-80"></div>

          {/* Avatar */}
          <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-300 dark:text-slate-500 ring-1 ring-slate-100 dark:ring-slate-600 shadow-inner">
            {renderBadge(stats.level.currentLevel, { className: 'w-10 h-10 drop-shadow-sm' })}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 dark:bg-slate-900 text-white text-[10px] font-bold rounded-md flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
              {stats.level.currentLevel}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 z-10">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">
              {stats.level.currentTitle}
            </h2>

            {/* Compact XP Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Level Progress</span>
                <span className="text-indigo-500 tabular-nums">
                  {stats.level.currentXp} / {stats.level.nextLevelXp} XP
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-600">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                  style={{ width: `${stats.level.progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Quick Stats (Vertical Stack on mobile, side by side in grid) */}
        <div className="col-span-6 sm:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">累计观察</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.totalObservations}
          </div>
        </div>
        <div className="col-span-6 sm:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center border border-slate-100 dark:border-slate-700 shadow-sm hover:border-amber-200 dark:hover:border-amber-700 transition-colors">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">连续打卡</div>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400">
            {stats.streakDays}
            <span className="text-xs ml-0.5 text-slate-400 font-bold">天</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* 3. Radar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-1 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-50"></div>
          <div className="p-4 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">评价素养模型</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">基于最近50条校准数据评估</p>
            </div>
            {stats.totalObservations < 5 && (
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                新手保护中
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center -mt-4">
            <RadarChart data={stats.radarData} size={220} />
          </div>

          <div className="mx-4 mb-4 px-3 py-2.5 bg-slate-50 dark:bg-slate-900/30 rounded-xl text-center border border-slate-100 dark:border-slate-700/50">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight font-medium">
              {feedbackText}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              * 分值根据专家行为档位并结合近期记录（指数衰减）计算。
            </p>
          </div>
        </div>

        {/* 4. AI Evolution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">AI 助教进化</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">基于您的校准行为产生的模型优化</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 leading-none">
                {aiStats.averageSyncScore}%
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">思维同频度</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-cyan-50/20 dark:bg-cyan-900/5 rounded-xl p-3 border border-cyan-100/50 dark:border-cyan-800/20">
              <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                近期同频趋势
              </div>
              <MindSyncChart data={aiStats.mindSyncTrend} />
            </div>

            <div>
              <div className="flex justify-between items-end text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                <span>领域专精分布</span>
                <span>Top 3</span>
              </div>
              <div className="space-y-2">
                {aiStats.domainMastery.slice(0, 3).map((d, i) => (
                  <div key={d.domain} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-16 truncate text-right">
                      {d.domain}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${d.level}%`, opacity: 1 - i * 0.15 }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                      {d.level}
                    </span>
                  </div>
                ))}
                {aiStats.domainMastery.length === 0 && (
                  <div className="text-[11px] text-slate-400 text-center py-2">暂无足够数据</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Logbook */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            档案记录
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] rounded-full">
              {logs.length}
            </span>
          </h3>
          <DataManagement logs={logs} onClear={onClearLogs} />
        </div>

        <div className="space-y-3">
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mb-3 flex items-center justify-center text-slate-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-500 font-medium">暂无档案数据</p>
              <p className="text-xs text-slate-400 mt-1">完成一次观察校准后即可生成档案</p>
            </div>
          )}
          {logs.map((log, index) => (
            <CompactLogCard
              key={log.id}
              log={log}
              apiProvider={apiProvider}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
