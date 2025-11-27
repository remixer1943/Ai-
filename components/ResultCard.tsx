import React from 'react';
import { MatchedTarget, FeedbackType } from '../types';

interface ResultCardProps {
  target: MatchedTarget;
  onFeedback: (targetId: string, feedbackType: FeedbackType) => void;
  isFeedbackSent: boolean;
}

// Icons from the provided design
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
  </svg>
);

const EvidenceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    ></path>
  </svg>
);

const AnalysisIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    ></path>
  </svg>
);

const NextStepIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    ></path>
  </svg>
);

const StrategyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548 5.478a1 1 0 01-.994.906h-4.5a1 1 0 01-.994-.906l-.548-5.478z"
    ></path>
  </svg>
);

const ThumbsUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.59-11.594c.081.203.117.417.117.634v.091c0 .546-.223 1.046-.594 1.42l-.494.504a2.25 2.25 0 0 1-1.423.594h-1.571a4.5 4.5 0 0 0-1.423.23l-3.114 1.04a4.5 4.5 0 0 0-1.423.23H5.904a2.25 2.25 0 0 1-2.25-2.25c0-.546.223-1.046.594-1.42l.494-.504a2.25 2.25 0 0 1 1.423-.594h1.571a4.5 4.5 0 0 0 1.423-.23l3.114-1.04a4.5 4.5 0 0 0 1.423-.23h.091c.217 0 .431.036.634.117z"
    />
  </svg>
);

const ThumbsDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M14.25 12h.008v.008h-.008V12zM15.75 12h.008v.008h-.008V12zm-3 3h.008v.008h-.008V15zm-1.5 0h.008v.008h-.008V15z"
      transform="rotate(180 12 12)"
    />
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

export const ResultCard: React.FC<ResultCardProps> = ({ target, onFeedback, isFeedbackSent }) => {
  // Parse source string into breadcrumbs. Example: "社会 / 社会适应 / 目标1 / 5-6岁"
  const breadcrumbs = target.source.split(/[/|]/).map((s) => s.trim());

  // Calculate Confidence Ring
  const radius = 8;
  const circumference = 2 * Math.PI * radius; // ~50.26
  const offset = circumference * (1 - target.confidence);

  const percentage = (target.confidence * 100).toFixed(0);

  return (
    <div className="w-full bg-white dark:bg-slate-800 shadow-lg rounded-2xl p-6 md:p-10 border border-slate-100 dark:border-slate-700 animate-entry mb-8 transition-all hover:shadow-xl">
      {/* Header: Breadcrumbs + Confidence */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-entry delay-100">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-600/50">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-default transition-colors">
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && (
                <ChevronRightIcon className="w-3 h-3 text-slate-300 dark:text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Confidence Badge (Ring Chart) */}
        <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
          <div className="relative w-5 h-5 mr-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="10"
                cy="10"
                r={radius}
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-emerald-200 dark:text-emerald-900/50"
              />
              <circle
                cx="10"
                cy="10"
                r={radius}
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-emerald-600 dark:text-emerald-500 transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wide">AI 置信度: {percentage}%</span>
        </div>
      </div>

      {/* Big Title */}
      <h1 className="animate-entry delay-100 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-10 tracking-tight leading-tight">
        {target.title}
      </h1>

      {/* 1. Key Evidence Card */}
      <div className="animate-entry delay-200 group bg-amber-50 dark:bg-amber-950/30 rounded-xl p-6 md:p-7 mb-6 border border-amber-100 dark:border-amber-900/50 hover:shadow-md transition-all duration-300 hover:border-amber-200 dark:hover:border-amber-800">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg mr-3">
            <EvidenceIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-amber-800 dark:text-amber-400 font-bold text-base uppercase tracking-wide">
            关键证据 (EVIDENCE)
          </h3>
        </div>
        <p className="text-lg sm:text-xl text-slate-800 dark:text-slate-200 font-medium italic pl-1 border-l-4 border-amber-300 dark:border-amber-600 ml-2">
          “{target.evidence}”
        </p>
      </div>

      {/* 2. Deep Analysis Card (Reasoning) */}
      {target.reasoning && (
        <div className="animate-entry delay-300 group bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 md:p-7 mb-6 border border-blue-100 dark:border-blue-900/50 hover:shadow-md transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
              <AnalysisIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-blue-800 dark:text-blue-300 font-bold text-lg">深度解析</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-12">
            {target.reasoning}
          </p>
        </div>
      )}

      {/* 3. Next Steps Card */}
      <div className="animate-entry delay-400 group bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 md:p-7 mb-6 border border-blue-100 dark:border-blue-900/50 hover:shadow-md transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
            <NextStepIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-blue-800 dark:text-blue-300 font-bold text-lg">下一步观察建议</h3>
        </div>
        <ul className="space-y-3 pl-12">
          {target.suggested_observations.map((item, idx) => (
            <li key={idx} className="flex items-start relative">
              <span className="absolute -left-6 mt-2 h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/40"></span>
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Educational Strategies Card */}
      {target.educationalSuggestions && target.educationalSuggestions.length > 0 && (
        <div className="animate-entry delay-500 group bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-6 md:p-7 border border-emerald-100 dark:border-emerald-900/50 hover:shadow-md transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg mr-3">
              <StrategyIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-emerald-800 dark:text-emerald-300 font-bold text-lg">
              教育支持策略
            </h3>
          </div>
          <ul className="space-y-3 pl-12">
            {target.educationalSuggestions.map((item, idx) => (
              <li key={idx} className="flex items-start relative">
                <span className="absolute -left-6 mt-2 h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/40"></span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Footer */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60 animate-entry delay-500">
        {isFeedbackSent ? (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg animate-pulse">
            <CheckCircleIcon className="w-4 h-4" />
            <span>已反馈</span>
          </div>
        ) : (
          <>
            <span className="text-xs font-bold text-slate-400 mr-1">评价此分析:</span>
            <button
              onClick={() => onFeedback(target.id, FeedbackType.CONFIRM)}
              className="group/btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all"
            >
              <ThumbsUpIcon className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
              <span>准确</span>
            </button>
            <button
              onClick={() => onFeedback(target.id, FeedbackType.REJECT)}
              className="group/btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-all"
            >
              <ThumbsDownIcon className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />
              <span>不准</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
