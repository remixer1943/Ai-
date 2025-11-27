import React, { useState } from 'react';
import { QueryResult, FeedbackType, AgeGroup } from '../types';
import { ResultCard } from './ResultCard';
import { Spinner } from './Spinner';
import { PredictionBadge } from './PredictionBadge';
import { generateLearningStoryStream } from '../services/guideService';
import { LearningStoryModal } from './LearningStoryModal';

interface ResultsDisplayProps {
  results: QueryResult | null;
  isLoading: boolean;
  loadingStage?: string;
  error: string | null;
  onFeedback: (targetId: string, feedbackType: FeedbackType) => void;
  feedbackSent: Set<string>;
}

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
    />
  </svg>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  isLoading,
  loadingStage,
  error,
  onFeedback,
  feedbackSent,
}) => {
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const handleGenerateStory = async () => {
    if (!results) return;
    setIsStoryModalOpen(true);
    if (storyContent) return; // Already generated

    setIsGeneratingStory(true);
    setStoryContent('');
    try {
      // Consume the stream
      const stream = generateLearningStoryStream(results.inputText, results);
      for await (const chunk of stream) {
        setStoryContent((prev) => prev + chunk);
      }
    } catch {
      setStoryContent((prev) => prev + '\n(生成学习故事时出现问题，请稍后重试。)');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <Spinner />
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
          {loadingStage || 'AI 正在分析您的观察记录，请稍候...'}
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500 font-medium">{error}</div>;
  }

  if (!results) {
    return null;
  }

  const isAutoDetectMode = results.selectedAgeGroup === AgeGroup.AUTO_DETECT;
  const aiAgeValueRaw = (results.agePrediction?.value ?? '').trim();
  const aiAgeDisplayValue = aiAgeValueRaw || '待确认';
  const hasConfidentAgePrediction = Boolean(aiAgeValueRaw && results.agePrediction.confidence > 0);
  const showAgeMismatchWarning =
    !isAutoDetectMode &&
    hasConfidentAgePrediction &&
    results.selectedAgeGroup &&
    results.selectedAgeGroup !== aiAgeValueRaw;

  return (
    <div className="mt-8 animate-fade-in relative">
      {isAutoDetectMode && (
        <div className="flex items-start gap-3 mb-6 p-3 bg-blue-50 dark:bg-slate-700/50 border border-blue-200 dark:border-blue-700/60 rounded-lg text-sm text-blue-800 dark:text-blue-200">
          <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>
            <span className="font-semibold">AI自动判断模式：</span>
            根据您的观察记录，AI判断孩子的行为表现最符合 ‘<strong>{aiAgeDisplayValue}</strong>
            ’，并以此为标准进行了分析。
          </p>
        </div>
      )}

      {showAgeMismatchWarning && (
        <div className="flex items-start gap-3 mb-6 p-3 bg-yellow-50 dark:bg-slate-700/50 border border-yellow-200 dark:border-yellow-700/60 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          <InfoIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>
            <span className="font-semibold">AI提示：</span>
            根据文本内容，孩子的行为表现似乎更符合 ‘<strong>{aiAgeDisplayValue}</strong>’。
            本次分析仍将严格基于您选择的 ‘<strong>{results.selectedAgeGroup}</strong>’ 范围进行。
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <PredictionBadge label="主要领域" prediction={results.domainPrediction} />
          <PredictionBadge label="年龄段" prediction={results.agePrediction} />
        </div>
        <button
          onClick={handleGenerateStory}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 rounded-full text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors border border-rose-200 dark:border-rose-800 shadow-sm"
        >
          <HeartIcon className="w-4 h-4" />
          生成“学习故事” (家长分享)
        </button>
      </div>

      {/* Holistic Evaluation Card */}
      {results.holistic_evaluation && (
        <div className="mb-8 bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <SparklesIcon className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            整体发展评价
          </h3>
          <div className="text-slate-700 dark:text-slate-300 leading-loose">
            {results.holistic_evaluation
              .split('\n')
              .filter((para) => para.trim())
              .map((para, index) => (
                <p key={index} className="mb-3 last:mb-0" style={{ textIndent: '2em' }}>
                  {para.trim()}
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Increased spacing from space-y-4 to space-y-10 for better separation of the new large cards */}
      <div className="space-y-10">
        {results.matchedTargets.map((target) => (
          <ResultCard
            key={target.id}
            target={target}
            onFeedback={onFeedback}
            isFeedbackSent={feedbackSent.has(target.id)}
          />
        ))}
      </div>

      <LearningStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        content={storyContent}
        isLoading={isGeneratingStory}
      />
    </div>
  );
};
