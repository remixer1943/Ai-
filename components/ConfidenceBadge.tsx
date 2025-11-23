
import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const percentage = (confidence * 100).toFixed(0);
  let colorClasses = '';
  if (confidence >= 0.8) {
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  } else if (confidence >= 0.6) {
    colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  } else {
    colorClasses = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClasses}`}>
      置信度: {percentage}%
    </span>
  );
};
