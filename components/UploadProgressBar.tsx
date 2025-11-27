import React from 'react';

interface UploadProgressBarProps {
  progress: number;
  stage?: string;
  className?: string;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  progress,
  stage,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {stage && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{stage}</span>
          <span className="text-xs text-slate-500 dark:text-slate-500 font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};
