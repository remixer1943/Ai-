import { AgeGroup, CalibrationLog, MatchedTarget, Prediction, QueryResult } from '../types';
import { ObservationFormData } from '../components/ObservationForm';
import knowledgeBaseData from '../src/data/knowledge_base.json';

interface KnowledgeChunk {
  id: string;
  text: string;
  source: string;
}

const knowledgeBase = knowledgeBaseData as { chunks: KnowledgeChunk[] };
const DEFAULT_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions';

const buildEndpoint = (baseUrl?: string) => (baseUrl?.trim() ? baseUrl.trim() : DEFAULT_ENDPOINT);

const JSON_CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const sliceJsonSegment = (text: string, openChar: '{' | '[', closeChar: '}' | ']'): string | null => {
  const start = text.indexOf(openChar);
  const end = text.lastIndexOf(closeChar);
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1).trim();
};

const collectJsonCandidates = (content: string): string[] => {
  const attempts: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (candidate?: string | null) => {
    if (!candidate) return;
    const trimmed = candidate.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    attempts.push(trimmed);
  };

  const base = (content ?? '').trim();
  pushCandidate(base);

  const fenceMatch = base.match(JSON_CODE_BLOCK_REGEX);
  if (fenceMatch?.[1]) {
    pushCandidate(fenceMatch[1]);
  }

  pushCandidate(sliceJsonSegment(base, '{', '}'));
  pushCandidate(sliceJsonSegment(base, '[', ']'));

  return attempts;
};

const parseJsonResponse = <T>(content: string): T => {
  if (!content || !content.trim()) {
    throw new Error('EMPTY_JSON_CONTENT');
  }

  const candidates = collectJsonCandidates(content);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('JSON_PARSE_FAILED');
};

const normalizePrediction = (raw: any, fallbackLabel = '待确认'): Prediction => {
  const value = typeof raw?.value === 'string' ? raw.value.trim() : '';
  const rawConfidence = typeof raw?.confidence === 'number'
    ? raw.confidence
    : typeof raw?.confidence === 'string'
      ? parseFloat(raw.confidence)
      : NaN;

  return {
    value: value || fallbackLabel,
    confidence: Number.isFinite(rawConfidence) ? clamp(rawConfidence) : 0
  };
};

const derivePredictionHints = (targets?: MatchedTarget[]) => {
  if (!targets || targets.length === 0) {
    return null;
  }
  const primary = targets[0];
  const sourceSegments = primary.source?.split('/')
    .map(segment => segment.trim())
    .filter(Boolean) || [];

  const domain = sourceSegments[0];
  const lastSegment = sourceSegments[sourceSegments.length - 1];
  const looksLikeAge = typeof lastSegment === 'string' && /岁/.test(lastSegment);

  return {
    domain,
    domainConfidence: typeof primary.confidence === 'number' ? clamp(primary.confidence) : undefined,
    age: looksLikeAge ? lastSegment : undefined,
    ageConfidence: typeof primary.confidence === 'number' ? clamp(primary.confidence) : undefined
  };
};

const callSiliconFlowAPI = async (
  apiKey: string,
  payload: Record<string, any>,
  baseUrl?: string
) => {
  const endpoint = buildEndpoint(baseUrl);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) {
        errorMessage = errBody.error.message;
      } else if (typeof errBody === 'string') {
        errorMessage = errBody;
      }
    } catch (err) {
      // ignore parsing error
    }
    throw new Error(`硅基流动 API 调用失败: ${errorMessage}`);
  }

  return response.json();
};

const retrieveKnowledge = (query: string, topK: number = 5): string => {
  if (!query || !query.trim()) return '';
  const keywords = query.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, '').split(/\s+/).filter(k => k.length > 1);
  if (keywords.length === 0) return '';

  const scoredChunks = knowledgeBase.chunks.map(chunk => {
    const text = chunk.text.toLowerCase();
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 1;
    });
    return { chunk, score };
  });

  const topChunks = scoredChunks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (topChunks.length === 0) return '';

  return topChunks.map((item, index) => `
[参考资料 ${index + 1}] (来源: ${item.chunk.source})
${item.chunk.text}
`).join('\n');
};

const formatLogsForPrompt = (logs: CalibrationLog[]): string => {
  if (!logs || logs.length === 0) return '';
  const highQualityLogs = logs.filter(log => log.calibratedEvidence.length > 0).slice(0, 2);
  if (highQualityLogs.length === 0) return '';

  const examples = highQualityLogs.map((log, index) => `
### 专家校准范例 #${index + 1}
- **原始记录**: "${log.originalText}"
- **专家校准后的关键证据**: ${JSON.stringify(log.calibratedEvidence)}
  `).join('');

  return `
---
**请优先学习并模仿以下由专家校准过的黄金范例，以提升你分析的准确性：**
${examples}
---
  `;
};

const baseRules = `**通用核心规则**
1.  **知识库优先**：如果提供了参考资料（'Reference Knowledge'），你必须优先依据该文档内容进行分析。此时，所有匹配目标的'source'字段必须为“来自参考资料”。如果未提供，则依据你内置的《指南》知识。
2.  **循证分析**：'evidence'字段必须是直接引用或高度概括观察记录中的原话，这是证明你的匹配是循证的关键。如果同时提供了图片，你的分析和证据需要结合图片内容。
3.  **核心预测**：判断观察记录最能体现的核心发展领域（'domainPrediction'），并给出置信度（0到1之间）。
4.  **【强制】多维分析**: 一段复杂的观察记录可能同时反映多个领域的目标。如果适用，你应为同一段证据匹配多个来自不同领域或方面的目标。
5.  **匹配发展目标**：找出所有相关的具体发展目标（'matchedTargets'），按置信度从高到低排序，最多 5 个。
6.  **提供观察建议**：为每个匹配目标提供 2 条可操作的“即时观察项”。
7.  **提供教育建议**：为每个匹配目标提供来自《指南》或参考资料的 1-3 条教育建议。
8.  **提供解析**：每个目标必须提供 'reasoning' 字段，解释证据与目标的逻辑联系。
9.  **来源路径格式**: 'source' 字段必须严格遵循 '领域 / 方面 / 目标X 标题 / 年龄段' 格式。
10. **JSON输出**：你的回答必须是合法 JSON。`;

const buildSystemInstruction = (
  ageGroup: AgeGroup,
  keyEvidence?: string[],
  calibrationLogs?: CalibrationLog[]
): string => {
  if (ageGroup === AgeGroup.AUTO_DETECT) {
    if (keyEvidence && keyEvidence.length > 0) {
      return `你是一位顶尖的儿童早期教育专家，正在进行一次高度聚焦的分析。一位专家已经为你提取了“黄金证据”列表。
**核心任务分两步**：
1.  **第一步：基于黄金证据判断年龄段**。仅根据“黄金证据”列表判断孩子的年龄段（'3-4岁', '4-5岁', '5-6岁'），并写入'agePrediction'。
2.  **第二步：仅使用黄金证据完成分析**。所有目标匹配和'evidence'字段都必须来自黄金证据列表。
${baseRules}`;
    }
    return `你是一位顶尖的儿童早期教育专家。你的任务是分析教师提供的幼儿观察记录，并以结构化 JSON 返回专业评估。
**核心任务分两步**：
1.  **智能判断年龄段**：根据观察记录判断最符合的年龄段填入 'agePrediction'。
2.  **基于判断完成分析**：'matchedTargets' 中所有目标的年龄段必须与 'agePrediction' 一致。
${baseRules}`;
  }

  if (keyEvidence && keyEvidence.length > 0) {
    return `你是一位顶尖的儿童早期教育专家。一位专家用户已经为你提取了“黄金证据”。
**最高优先级指令**：
1.  **唯一依据**：所有分析必须基于“黄金证据”。
2.  **禁止自由发挥**：严禁从原始文本中寻找黄金证据之外的信息。
3.  **年龄段框架**：所有目标必须严格在用户指定的年龄段内。
${baseRules}`;
  }

  const fewShotExamples = formatLogsForPrompt(calibrationLogs || []);
  return `${fewShotExamples}你是一位顶尖的儿童早期教育专家，对《3-6岁儿童学习与发展指南》了如指掌。
**【强制】年龄段框架**：所有分析必须严格在用户指定的年龄段内。即使你判断文本描述的儿童行为属于别的年龄段，也必须遵守用户指定。
${baseRules}`;
};

const buildUserPrompt = (
  observationText: string,
  ageGroup: AgeGroup,
  combinedKnowledge?: string,
  keyEvidence?: string[]
): string => {
  return `
请根据以下信息进行分析:

- **观察记录 (inputText)**: "${observationText}"
- **幼儿年龄段 (ageGroup)**: "${ageGroup}"
${combinedKnowledge ? `- **参考资料 (Reference Knowledge)**: """${combinedKnowledge}"""` : ''}
${(keyEvidence && keyEvidence.length > 0) ? `- **专家确认的黄金证据 (Golden Evidence)**: ${JSON.stringify(keyEvidence)}` : ''}

输出必须是一个 JSON 对象，包含字段: queryId (以 "qry-" 开头), domainPrediction, agePrediction, matchedTargets (1-5 个，字段包括 id/title/source/evidence/reasoning/confidence/suggested_observations/educationalSuggestions)。`;
};

export const extractEvidence = async (
  observationText: string,
  apiKey: string,
  model: string,
  baseUrl?: string
): Promise<string[]> => {
  if (!observationText.trim()) return [];

  const systemInstruction = `你的角色是一位资深的学前教育专家。请从观察记录中提取最能体现幼儿思考、能力发展和情感状态的“高价值”关键证据。
只输出 JSON 数组，例如: ["句子1", "句子2"]。严禁额外说明。`;

  const userContent = `观察记录如下: """${observationText}"""`;

  const payload = {
    model,
    temperature: 0.1,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent }
    ]
  };

  const response = await callSiliconFlowAPI(apiKey, payload, baseUrl);
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('硅基流动未返回证据内容。');
  }

  try {
    const parsed = parseJsonResponse<any>(content);
    if (Array.isArray(parsed)) {
      return parsed as string[];
    }
    if (Array.isArray(parsed.evidence)) {
      return parsed.evidence;
    }
    throw new Error('响应不是 JSON 数组。');
  } catch (error) {
    console.error('Failed to parse SiliconFlow evidence response:', content);
    throw new Error('解析硅基流动返回的证据失败，请稍后再试。');
  }
};

export const queryGuide = async (
  data: ObservationFormData,
  apiKey: string,
  model: string,
  baseUrl?: string,
  calibrationLogs?: CalibrationLog[]
): Promise<QueryResult> => {
  const { observationText, ageGroup, knowledgeBase: customKnowledgeBase, keyEvidence, images } = data;
  const retrievedKnowledge = retrieveKnowledge(observationText);
  const combinedKnowledgeBase = [customKnowledgeBase, retrievedKnowledge].filter(Boolean).join('\n\n');
  const systemInstruction = buildSystemInstruction(ageGroup, keyEvidence, calibrationLogs);
  const userPrompt = buildUserPrompt(observationText, ageGroup, combinedKnowledgeBase, keyEvidence);

  const payload = {
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
      ...(images?.length ? [{ role: 'user', content: '（附带图片信息，需结合分析。）' }] : [])
    ]
  };

  const response = await callSiliconFlowAPI(apiKey, payload, baseUrl);
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('硅基流动未返回分析结果。');
  }

  try {
    const parsed = parseJsonResponse<QueryResult>(content);
    const fallbackAgeLabel = ageGroup === AgeGroup.AUTO_DETECT ? '待确认' : ageGroup;
    const finalResult: QueryResult = {
      ...parsed,
      domainPrediction: normalizePrediction(parsed.domainPrediction),
      agePrediction: normalizePrediction(parsed.agePrediction, fallbackAgeLabel),
      inputText: observationText,
      selectedAgeGroup: ageGroup as AgeGroup
    };

    const derivedHints = derivePredictionHints(parsed.matchedTargets);
    if (derivedHints?.domain) {
      if (!finalResult.domainPrediction.value || finalResult.domainPrediction.value === '待确认') {
        finalResult.domainPrediction.value = derivedHints.domain;
      }
      if ((finalResult.domainPrediction.confidence ?? 0) <= 0 && derivedHints.domainConfidence !== undefined) {
        finalResult.domainPrediction.confidence = derivedHints.domainConfidence;
      }
    }

    const shouldUseDerivedAge = ageGroup === AgeGroup.AUTO_DETECT || finalResult.agePrediction.value === '待确认';
    if (shouldUseDerivedAge && derivedHints?.age) {
      if (!finalResult.agePrediction.value || finalResult.agePrediction.value === '待确认') {
        finalResult.agePrediction.value = derivedHints.age;
      }
      if ((finalResult.agePrediction.confidence ?? 0) <= 0 && derivedHints.ageConfidence !== undefined) {
        finalResult.agePrediction.confidence = derivedHints.ageConfidence;
      }
    }
    return finalResult;
  } catch (error) {
    console.error('Failed to parse SiliconFlow query response:', content);
    throw new Error('解析硅基流动分析结果失败，请检查模型配置。');
  }
};

export const getGrowthInsightAnalysis = async (
  log: Pick<CalibrationLog, 'originalText' | 'aiInitialEvidence' | 'calibratedEvidence'>,
  apiKey: string,
  model: string,
  baseUrl?: string
): Promise<string> => {
  const systemInstruction = `你是一位资深的AI学习分析师，任务是比较“AI判定”和“人工校准”之间的差异，总结AI需要学习的原则。请输出一段简洁的中文分析。`;
  const userPrompt = `
- 原始记录:
"""${log.originalText}"""
- AI判定: ${JSON.stringify(log.aiInitialEvidence)}
- 人工校准: ${JSON.stringify(log.calibratedEvidence)}
`;

  const payload = {
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ]
  };

  const response = await callSiliconFlowAPI(apiKey, payload, baseUrl);
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('硅基流动未返回洞察文本。');
  }
  return content.trim();
};

export async function* generateLearningStoryStream(
  observationText: string,
  analysisResult: QueryResult,
  apiKey: string,
  model: string,
  baseUrl?: string
): AsyncGenerator<string, void, unknown> {
  const systemInstruction = `你是一位拥有敏锐观察力且幽默的幼儿园教师，正在写一篇给家长的“学习故事”。
- 输出纯文本散文，第一行是标题
- 正文 300-500 字，无 Markdown，无落款
- 口吻温暖、真诚，包含“发生了什么”、“代表了什么成长”、“之后可以怎么做”三部分内容但不要显式写出小标题。`;

  const userPrompt = `
请根据以下材料为孩子（化名“宝贝”）写学习故事：

观察记录："${observationText}"
主要领域：${analysisResult.domainPrediction.value}
核心发现：${analysisResult.matchedTargets.map(t => t.title).join('; ')}
`;

  const payload = {
    model,
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ]
  };

  const response = await callSiliconFlowAPI(apiKey, payload, baseUrl);
  const content = response?.choices?.[0]?.message?.content;
  if (content) {
    yield content;
  } else {
    yield '未能生成学习故事，请稍后再试。';
  }
}
