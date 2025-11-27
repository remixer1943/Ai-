import React from 'react';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onToggleDashboard: () => void;
  showDashboard: boolean;
  onToggleSettings: () => void;
}

const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591"
    />
  </svg>
);

const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  </svg>
);

const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <defs>
      <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="url(#dashGrad)" opacity="0.9" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="url(#dashGrad)" opacity="0.7" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="url(#dashGrad)" opacity="0.8" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="url(#dashGrad)" opacity="0.6" />
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <defs>
      <linearGradient id="setGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="6" r="2" fill="url(#setGrad)" />
    <circle cx="12" cy="12" r="2" fill="url(#setGrad)" />
    <circle cx="12" cy="18" r="2" fill="url(#setGrad)" />
    <line
      x1="5"
      y1="6"
      x2="9"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
    <line
      x1="15"
      y1="6"
      x2="19"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
    <line
      x1="5"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
    <line
      x1="15"
      y1="12"
      x2="19"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
    <line
      x1="5"
      y1="18"
      x2="9"
      y2="18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
    <line
      x1="15"
      y1="18"
      x2="19"
      y2="18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const SparkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
    />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  onToggleDashboard,
  showDashboard,
  onToggleSettings,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 supports-[backdrop-filter]:bg-white/50">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex justify-between items-center max-w-5xl">
        <div
          className="flex items-center gap-3 group cursor-pointer select-none"
          onClick={() => window.location.reload()}
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
            <SparkIcon className="w-5 h-5" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight font-['Nunito']">
            Ai
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              助教
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-md">
          <button
            onClick={onToggleDashboard}
            className={`p-2 rounded-full transition-all duration-300 ${showDashboard ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            aria-label={showDashboard ? 'Close Dashboard' : 'Open Dashboard'}
            title="成长看板"
          >
            {showDashboard ? (
              <CloseIcon className="w-5 h-5" />
            ) : (
              <DashboardIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onToggleSettings}
            className="p-2 rounded-full text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 transition-all duration-300"
            aria-label="Open Settings"
            title="设置"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 hover:bg-white hover:text-amber-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-yellow-400 transition-all duration-300"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
