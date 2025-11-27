import { CalibrationLog, FeedbackPayload, QueryResult } from '../types';
import { ObservationFormData } from '../components/ObservationForm';
import * as gemini from './geminiService';
import * as doubao from './doubaoService';
import * as silicon from './siliconFlowService';
import { ApiSettings } from '../components/SettingsModal';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db';

const defaultApiSettings: ApiSettings = {
  provider: 'gemini',
  doubaoApiKey: '',
  doubaoModelEndpoint: '',
  siliconApiKey: '',
  siliconModel: '',
  siliconBaseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
};

const getApiSettings = (): ApiSettings => {
  try {
    const savedSettings = window.localStorage.getItem('apiSettings');
    return savedSettings
      ? { ...defaultApiSettings, ...JSON.parse(savedSettings) }
      : defaultApiSettings;
  } catch (error) {
    console.error('Failed to parse API settings from localStorage, defaulting to Gemini.', error);
    return defaultApiSettings;
  }
};

export const extractEvidence = async (observationText: string): Promise<string[]> => {
  const settings = getApiSettings();

  if (settings.provider === 'doubao' && settings.doubaoApiKey && settings.doubaoModelEndpoint) {
    return doubao.extractEvidence(
      observationText,
      settings.doubaoApiKey,
      settings.doubaoModelEndpoint
    );
  }
  if (settings.provider === 'siliconflow' && settings.siliconApiKey && settings.siliconModel) {
    return silicon.extractEvidence(
      observationText,
      settings.siliconApiKey,
      settings.siliconModel,
      settings.siliconBaseUrl
    );
  }
  // Default to Gemini
  return gemini.extractEvidence(observationText);
};

export const queryGuide = async (
  data: ObservationFormData,
  calibrationLogs?: CalibrationLog[]
): Promise<QueryResult> => {
  const settings = getApiSettings();

  if (settings.provider === 'doubao' && settings.doubaoApiKey && settings.doubaoModelEndpoint) {
    return doubao.queryGuide(data, settings.doubaoApiKey, settings.doubaoModelEndpoint);
  }
  if (settings.provider === 'siliconflow' && settings.siliconApiKey && settings.siliconModel) {
    return silicon.queryGuide(
      data,
      settings.siliconApiKey,
      settings.siliconModel,
      settings.siliconBaseUrl,
      calibrationLogs
    );
  }
  // Default to Gemini
  return gemini.queryGuide(data, calibrationLogs);
};

import { saveFeedback } from './feedbackService';

export const sendFeedback = (feedback: FeedbackPayload): Promise<{ success: boolean }> => {
  return saveFeedback(feedback);
};

export const analyzeCalibrationDiff = async (
  original: string[],
  calibrated: string[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `
    你是一位资深的教育专家。教师对AI提取的“观察证据”进行了人工校准。
    请对比“AI原始提取”和“教师校准后”的证据，分析教师的修改逻辑，并提炼出一条简练的“证据提取原则”。

    **AI原始提取**: ${JSON.stringify(original)}
    **教师校准后**: ${JSON.stringify(calibrated)}

    **分析要求**:
    1. 寻找差异：教师删除了什么？增加了什么？修改了什么措辞？
    2. 提炼原则：用一句话总结教师的偏好（例如：“应删除主观推测，只保留客观动作”或“必须包含具体的对话引用”）。
    3. **输出格式**：只输出这一句原则，不要有任何其他解释。
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return (result.text || '').trim();
  } catch (error) {
    console.error('Failed to analyze calibration diff:', error);
    return '';
  }
};

export const logCalibrationData = async (
  logData: Omit<CalibrationLog, 'id' | 'timestamp'>
): Promise<{ success: true; log: CalibrationLog }> => {
  // Meta-Learning: Analyze the difference to extract a principle
  let principle = '';
  if (logData.aiInitialEvidence && logData.calibratedEvidence) {
    principle = await analyzeCalibrationDiff(logData.aiInitialEvidence, logData.calibratedEvidence);
  }

  const newLog: CalibrationLog = {
    ...logData,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    calibrationPrinciple: principle,
  };

  try {
    await db.logs.add(newLog);
    return { success: true, log: newLog };
  } catch (error) {
    console.error('Failed to save log to DB:', error);
    // Fallback to just returning the object if DB fails, though in real app we should handle this
    return { success: true, log: newLog };
  }
};

export const getCalibrationRules = async (): Promise<string> => {
  try {
    // Fetch logs with calibration principles
    const logs = await db.logs
      .filter((log) => !!log.calibrationPrinciple)
      .reverse()
      .limit(5)
      .toArray();

    if (logs.length === 0) return '';

    // Deduplicate principles (simple string matching for now)
    const principles = Array.from(new Set(logs.map((log) => log.calibrationPrinciple))).filter(
      Boolean
    );

    if (principles.length === 0) return '';

    return principles.map((p, index) => `${index + 1}. ${p}`).join('\n');
  } catch (error) {
    console.error('Failed to fetch calibration rules:', error);
    return '';
  }
};
export const getGrowthInsightAnalysis = async (
  log: Pick<CalibrationLog, 'originalText' | 'aiInitialEvidence' | 'calibratedEvidence'>
): Promise<string> => {
  const settings = getApiSettings();
  if (settings.provider === 'doubao' && settings.doubaoApiKey && settings.doubaoModelEndpoint) {
    return doubao.getGrowthInsightAnalysis(
      log,
      settings.doubaoApiKey,
      settings.doubaoModelEndpoint
    );
  }
  if (settings.provider === 'siliconflow' && settings.siliconApiKey && settings.siliconModel) {
    return silicon.getGrowthInsightAnalysis(
      log,
      settings.siliconApiKey,
      settings.siliconModel,
      settings.siliconBaseUrl
    );
  }
  if (settings.provider === 'gemini') {
    return gemini.getGrowthInsightAnalysis(log);
  }
  return Promise.resolve('未配置有效的 AI 模型。');
};

// Generate a Learning Story for parents (Streaming)
export async function* generateLearningStoryStream(
  observationText: string,
  analysisResult: QueryResult
): AsyncGenerator<string, void, unknown> {
  const settings = getApiSettings();

  // Route to Doubao
  if (settings.provider === 'doubao' && settings.doubaoApiKey && settings.doubaoModelEndpoint) {
    yield* doubao.generateLearningStoryStream(
      observationText,
      analysisResult,
      settings.doubaoApiKey,
      settings.doubaoModelEndpoint
    );
    return;
  }
  if (settings.provider === 'siliconflow' && settings.siliconApiKey && settings.siliconModel) {
    yield* silicon.generateLearningStoryStream(
      observationText,
      analysisResult,
      settings.siliconApiKey,
      settings.siliconModel,
      settings.siliconBaseUrl
    );
    return;
  }

  // Check if we can use Gemini (needs API KEY)
  if (!process.env.API_KEY && settings.provider !== 'gemini') {
    yield '请配置 Gemini API Key 以使用学习故事生成功能，或在设置中切换为豆包模型并配置相应 Key。';
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const systemInstruction = `你是一位拥有敏锐观察力且幽默的幼儿园教师，正在写一篇给家长的“学习故事”。

**核心写作原则（请严格遵守）：**
1.  **纯文本散文格式**：严禁使用 Markdown（如 **加粗**、## 标题、- 列表等）。像写一封温馨的信或一篇优美的日记一样，通过自然的分段来组织内容。
2.  **拒绝浮夸**：不要使用“伟大的发现”、“小天才”、“奇迹”这种过度夸张的词汇。请用平实、生活化、略带一点点幽默感的口吻，记录孩子真实可爱的瞬间。
3.  **隐形结构**：文章内容需要包含“发生了什么细节”、“这代表了什么成长”、“之后我们可以怎么做”，但**绝对不要**把这些作为小标题写出来，要将它们融合在连贯的段落中。
4.  **无落款**：文章写完即止，**不要**在结尾加“爱你的老师”、“X年X月X日”等落款。

**输出格式要求**：
-   第一行：写一个简短、有趣或温馨的标题。
-   （空一行）
-   正文开始（300-500字）。`;

  const userPrompt = `
    请根据以下信息为孩子（化名“宝贝”）写一篇学习故事：

    **观察记录**：
    "${observationText}"

    **专业分析要点**：
    - 主要领域：${analysisResult.domainPrediction.value}
    - 核心发现：${analysisResult.matchedTargets.map((t) => t.title).join('; ')}
    `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.8, // Slightly higher creativity for storytelling
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error generating learning story:', error);
    yield '\n\n(生成过程中断，请稍后重试)';
  }
}
