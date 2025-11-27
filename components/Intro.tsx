import React from 'react';

export const Intro: React.FC = () => {
  return (
    <div className="text-center my-16 animate-fade-in-up">
      <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold tracking-wider uppercase border border-indigo-100 dark:border-indigo-800">
        Powered by Gemini 2.5 Thinking
      </div>
      <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white mb-6 tracking-tight font-['Nunito']">
        发现童心，
        <span className="relative whitespace-nowrap">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 dark:from-indigo-400 dark:via-purple-400 dark:to-violet-400">
            循证成长
          </span>
          <span className="absolute bottom-1 left-0 w-full h-3 bg-indigo-100 dark:bg-indigo-900/50 -z-10 rounded-full transform -rotate-1"></span>
        </span>
      </h2>
      <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
        将日常的自然观察转化为深度的教育洞察。
        <br className="hidden sm:block" />
        只需记录，AI 即可为您匹配《指南》目标，提供专业的支持策略。
      </p>
    </div>
  );
};
