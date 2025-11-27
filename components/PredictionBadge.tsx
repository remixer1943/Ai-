import React from 'react';
import { Prediction } from '../types';

interface PredictionBadgeProps {
  label: string;
  prediction: Prediction;
}

export const PredictionBadge: React.FC<PredictionBadgeProps> = ({ label, prediction }) => {
  const value =
    typeof prediction.value === 'string' && prediction.value.trim()
      ? prediction.value.trim()
      : '待确认';
  const normalizedConfidence =
    typeof prediction.confidence === 'number' && Number.isFinite(prediction.confidence)
      ? prediction.confidence
      : 0;
  const percentage = Math.round(normalizedConfidence * 100);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm">
      <span className="font-medium text-slate-600 dark:text-slate-300">{label}:</span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">({percentage}%)</span>
    </div>
  );
};
