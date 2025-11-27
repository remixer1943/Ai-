import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ObservationForm, ObservationFormData } from './components/ObservationForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { queryGuide, sendFeedback, logCalibrationData } from './services/guideService';
import { QueryResult, FeedbackType } from './types';
import { Header } from './components/Header';
import { Intro } from './components/Intro';
import { TrainingDashboard } from './components/TrainingDashboard';
import { SettingsModal, ApiSettings } from './components/SettingsModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { ToastContainer } from './components/Toast';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('正在准备分析...');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());

  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Timer ref for progress simulation
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const defaults: ApiSettings = {
      provider: 'gemini',
      doubaoApiKey: '',
      doubaoModelEndpoint: '',
      siliconApiKey: '',
      siliconModel: '',
      siliconBaseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    };
    try {
      const savedSettings = window.localStorage.getItem('apiSettings');
      return savedSettings ? { ...defaults, ...JSON.parse(savedSettings) } : defaults;
    } catch (error) {
      console.error('Failed to parse API settings from localStorage', error);
      return defaults;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
    } catch (error) {
      console.error('Failed to save API settings to localStorage', error);
    }
  }, [apiSettings]);

  // Dexie Integration: Use live query to get logs sorted by timestamp
  const calibrationLogs =
    useLiveQuery(() => db.logs.orderBy('timestamp').reverse().toArray()) ?? [];

  // Migration Logic: Migrate localStorage logs to Dexie on first load if they exist
  useEffect(() => {
    const migrateData = async () => {
      try {
        const localLogsStr = window.localStorage.getItem('calibrationLogs');
        if (localLogsStr) {
          const localLogs = JSON.parse(localLogsStr);
          if (Array.isArray(localLogs) && localLogs.length > 0) {
            console.log(`Migrating ${localLogs.length} logs to IndexedDB...`);
            await db.logs.bulkPut(localLogs); // Use bulkPut to safely add/overwrite
            window.localStorage.removeItem('calibrationLogs'); // Clear old storage
            console.log('Migration successful.');
          }
        }
      } catch (err) {
        console.error('Data migration failed:', err);
      }
    };
    migrateData();
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleDashboard = () => {
    setShowDashboard((prev) => !prev);
  };

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const handleSaveSettings = (settings: ApiSettings) => {
    setApiSettings(settings);
    setIsSettingsOpen(false);
  };

  const handleSubmit = useCallback(
    async (data: ObservationFormData) => {
      setError(null);
      if (!data.observationText.trim() && (data.images?.length || 0) === 0) {
        setError('请输入观察内容或上传图片。');
        return;
      }
      if (
        apiSettings.provider === 'doubao' &&
        (!apiSettings.doubaoApiKey?.trim() || !apiSettings.doubaoModelEndpoint?.trim())
      ) {
        setError('请先在右上角“设置”中配置豆包模型的 API Key 和 Endpoint。');
        setIsSettingsOpen(true);
        return;
      }
      if (
        apiSettings.provider === 'siliconflow' &&
        (!apiSettings.siliconApiKey?.trim() || !apiSettings.siliconModel?.trim())
      ) {
        setError('请先在右上角“设置”中配置硅基流动的 API Key 和模型名称。');
        setIsSettingsOpen(true);
        return;
      }

      setIsLoading(true);
      setResults(null);
      setFeedbackSent(new Set());
      setShowDashboard(false);
      setLoadingStage('AI 正在阅读观察记录...');

      // Simulation of progress
      let step = 0;
      const messages = [
        '正在深度思考与提取关键证据...',
        '正在与《指南》发展目标进行循证匹配...',
        '正在生成个性化的教育支持策略...',
        '正在整理最终分析报告...',
      ];

      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = setInterval(() => {
        if (step < messages.length) {
          setLoadingStage(messages[step]);
          step++;
        }
      }, 2500); // Change message every 2.5s

      try {
        const response = await queryGuide(data, calibrationLogs);
        setResults(response);

        // Log calibration attempt AFTER receiving the response so we can store the domain and confidence
        if (
          data.aiInitialEvidence.length > 0 ||
          (data.keyEvidence && data.keyEvidence.length > 0)
        ) {
          try {
            const { log } = await logCalibrationData({
              originalText: data.observationText,
              aiInitialEvidence: data.aiInitialEvidence,
              calibratedEvidence: data.keyEvidence || [],
              domain: response.domainPrediction.value,
              confidence: response.domainPrediction.confidence,
            });
            // Save to Dexie
            await db.logs.add(log);
          } catch (logError) {
            console.error('Failed to log calibration data:', logError);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '服务暂时不可用，请稍后再试。';
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
        setLoadingStage('');
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      }
    },
    [calibrationLogs, apiSettings]
  );

  const handleFeedback = useCallback(
    async (targetId: string, feedbackType: FeedbackType) => {
      if (!results) return;

      const target = results.matchedTargets.find((t) => t.id === targetId);
      if (!target) return;

      try {
        await sendFeedback({
          queryId: results.queryId,
          targetId: targetId,
          feedbackType: feedbackType,
          originalText: results.inputText,
          aiEvidence: target.evidence,
          matchedTarget: JSON.stringify(target),
        });
        setFeedbackSent((prev) => new Set(prev).add(targetId));
      } catch (err) {
        console.error('Failed to send feedback', err);
      }
    },
    [results]
  );

  const handleNewQuery = () => {
    setResults(null);
    setError(null);
    setShowDashboard(false);
  };

  const handleClearLogs = async () => {
    if (window.confirm('您确定要清空所有成长记录吗？这会重置您的等级和雷达图，此操作不可撤销。')) {
      try {
        await db.logs.clear();
      } catch (error) {
        console.error('Failed to clear calibration logs from DB', error);
        setError('清除日志时出错。');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-stone-100 via-stone-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 selection:bg-indigo-200 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100">
      <ToastContainer />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light z-0"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleDashboard={toggleDashboard}
          showDashboard={showDashboard}
          onToggleSettings={toggleSettings}
        />
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={toggleSettings}
            onSave={handleSaveSettings}
            currentSettings={apiSettings}
          />
        )}
        <main className="container mx-auto px-4 sm:px-6 pb-24 max-w-5xl flex-grow">
          <div style={{ display: showDashboard ? 'block' : 'none' }}>
            <TrainingDashboard
              logs={calibrationLogs}
              onClearLogs={handleClearLogs}
              apiProvider={apiSettings.provider}
            />
          </div>

          <div style={{ display: !showDashboard ? 'block' : 'none' }}>
            {!results && !isLoading && <Intro />}

            <ObservationForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isResultView={!!results}
              onNewQuery={handleNewQuery}
            />

            <ResultsDisplay
              results={results}
              isLoading={isLoading}
              loadingStage={loadingStage}
              error={error}
              onFeedback={handleFeedback}
              feedbackSent={feedbackSent}
            />
          </div>
        </main>

        <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-xs">
          <p>© 2025 Ai助教 · Empowered by Gemini 2.5 & Thinking Model</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
