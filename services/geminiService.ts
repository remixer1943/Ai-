
import { AgeGroup, CalibrationLog, QueryResult, RAGResponse, RAGChunk } from '../types';
import { ObservationFormData, VideoMetadataPayload, VideoKeyframePayload } from '../components/ObservationForm';
import { GoogleGenAI, Type } from "@google/genai";

// Ensure API_KEY environment variable is set
if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Please ensure it is available in the execution context.");
}

const predictionSchema = {
  type: Type.OBJECT,
  properties: {
    value: { type: Type.STRING },
    confidence: { type: Type.NUMBER, description: "A value between 0 and 1." },
  },
  required: ['value', 'confidence'],
};

const matchedTargetSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique identifier for this target, e.g., 'art-001'." },
    title: { type: Type.STRING, description: "《指南》中针对特定年龄段的**具体行为指标**。例如: '喜欢倾听各种好听的声音, 感知声音的高低、长短、强弱等变化。'" },
    source: { type: Type.STRING, description: "目标的**完整层级路径**，用于教师快速定位。**必须**严格遵循格式：'领域 / 方面 / 目标X 标题 / 年龄段'。例如：'艺术 / 感受与欣赏 / 目标1 喜欢自然界与生活中美的事物 / 4-5岁'。**此字段用于导航，title字段用于显示，二者内容不同。**" },
    evidence: { type: Type.STRING, description: "A direct quote or a very close paraphrase from the original observation text that supports this match." },
    reasoning: { type: Type.STRING, description: "A brief analysis (1-2 sentences) explaining why the provided 'evidence' supports the matched 'title', helping the teacher understand the connection." },
    confidence: { type: Type.NUMBER, description: "A value between 0 and 1, representing the confidence in this match." },
    suggested_observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Two concrete, actionable suggestions for what the teacher can observe next."
    },
    educationalSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of 1-3 concrete educational suggestions from the guideline document that correspond to this matched target."
    },
  },
  required: ['id', 'title', 'source', 'evidence', 'reasoning', 'confidence', 'suggested_observations', 'educationalSuggestions'],
};

const queryResultSchema = {
  type: Type.OBJECT,
  properties: {
    queryId: { type: Type.STRING, description: "A unique identifier for this query, starting with 'qry-'." },
    inputText: { type: Type.STRING, description: "The original observation text provided by the user." },
    domainPrediction: { ...predictionSchema, description: "The primary developmental domain predicted." },
    agePrediction: { ...predictionSchema, description: "The predicted age group based on the observation." },
    matchedTargets: {
      type: Type.ARRAY,
      description: "An array of up to 5 matched developmental targets, ordered by confidence.",
      items: matchedTargetSchema,
    },
  },
  required: ['queryId', 'inputText', 'domainPrediction', 'agePrediction', 'matchedTargets'],
};

export interface VideoObservationTarget {
  domain: string;
  experience: string;
  indicator: string;
  evidence: string;
  timecode?: string;
}

export interface VideoObservationDraft {
  narrative: string;
  key_moments: {
    timecode: string;
    action: string;
    strategy?: string;
    evidence: string;
    indicator: string;
  }[];
  learning_traits: {
    trait: string;
    description: string;
    evidence: string;
  }[];
  targets: VideoObservationTarget[];
  analysis: string;
  next_steps: string[];
}

const videoObservationSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: '按照时间顺序撰写的详细观察文本' },
    key_moments: {
      type: Type.ARRAY,
      description: '至少三个带时间节点的关键行为',
      items: {
        type: Type.OBJECT,
        properties: {
          timecode: { type: Type.STRING },
          action: { type: Type.STRING },
          strategy: { type: Type.STRING },
          evidence: { type: Type.STRING },
          indicator: { type: Type.STRING },
        },
        required: ['timecode', 'action', 'evidence', 'indicator'],
      }
    },
    learning_traits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          trait: { type: Type.STRING },
          description: { type: Type.STRING },
          evidence: { type: Type.STRING },
        },
        required: ['trait', 'description', 'evidence'],
      }
    },
    targets: {
      type: Type.ARRAY,
      description: '把证据映射到指南领域/关键经验',
      items: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          experience: { type: Type.STRING },
          indicator: { type: Type.STRING },
          evidence: { type: Type.STRING },
          timecode: { type: Type.STRING },
        },
        required: ['domain', 'experience', 'indicator', 'evidence'],
      }
    },
    analysis: { type: Type.STRING },
    next_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
  },
  required: ['narrative', 'key_moments', 'learning_traits', 'targets', 'analysis', 'next_steps'],
};

export const generateObservationFromVideo = async (
  video: { mimeType: string; data: string; },
  options?: { metadata?: VideoMetadataPayload; keyframes?: VideoKeyframePayload[] }
): Promise<VideoObservationDraft> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const metadataNote = options?.metadata
    ? `视频信息：时长约 ${Math.round(options.metadata.duration)} 秒，分辨率 ${options.metadata.width}x${options.metadata.height}${options.metadata.size ? `，大小约 ${(options.metadata.size / (1024 * 1024)).toFixed(1)}MB` : ''}。`
    : '';
  const keyframeNote = options?.keyframes?.length
    ? `系统已为你自动截取 ${options.keyframes.length} 张关键帧，便于定位关键瞬间。`
    : '';

  const systemInstruction = `你是一位资深的幼儿教育观察专家。你的任务是观看这段幼儿活动视频，并按照规定的框架产出一份结构化的观察记录。

${metadataNote}
${keyframeNote}

### 写作流程
1. **场景概述 (narrative 开头)**：交代时间、地点、人物、材料与目标，并遵循时间顺序叙述至少3段行为。每段必须包含【动作/材料】【语言或情绪】【数量或频次】【意图或策略推断】。
2. **关键瞬间 (key_moments)**：至少3条，需注明时间码（如"00:18"），描述动作与策略，并对应一个指南指标或经验。
3. **学习品质 (learning_traits)**：用证据支持好奇、坚持、合作等品质。
4. **指标映射 (targets)**：把视频证据映射到《3-6岁学习与发展指南》或课程关键经验，注明领域/经验点/指标编号，并引用原始证据与时间码。
5. **分析 (analysis)**：引用教育理论（如皮亚杰、维果茨基、加德纳等）解释行为意义，指出发展水平。
6. **下一步 (next_steps)**：至少3条可操作的教师支架或材料改进建议。

### 质量要求
- 不得使用泛泛句子或“孩子在玩”式描述；每条证据需具体到动作/材料/次数。
- narrative 与 key_moments 中必须包含时间码（近似也可，如“约00:45”）。
- JSON 输出必须符合提供的 schema，禁止额外字段或解释。`;

  try {
    const userParts: any[] = [
      { text: '以下是教师上传的幼儿活动视频，请据此撰写观察记录。' },
      {
        inlineData: {
          mimeType: video.mimeType,
          data: video.data,
        }
      }
    ];

    if (options?.keyframes?.length) {
      options.keyframes.forEach(frame => {
        userParts.push({
          inlineData: {
            mimeType: frame.mimeType,
            data: frame.data,
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: userParts,
      }],
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: videoObservationSchema,
      },
    });
    const responseText = response.text;
    let draft: VideoObservationDraft;
    try {
      draft = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse video observation JSON:', responseText);
      throw new Error('AI 返回的观察记录格式异常，请重试。');
    }

    if (!draft.key_moments || draft.key_moments.length < 3) {
      throw new Error('AI 生成的关键瞬间不足，已中断。请重试或调整视频。');
    }
    if (!draft.targets || draft.targets.length === 0) {
      throw new Error('AI 未能生成目标映射，请重试。');
    }
    if (!draft.next_steps || draft.next_steps.length < 3) {
      throw new Error('AI 生成的改进行动不足，请重试。');
    }

    return draft;
  } catch (error) {
    console.error("Error generating observation from video:", error);
    throw new Error("视频观察记录生成失败，请稍后重试。");
  }
};

export const extractEvidence = async (observationText: string): Promise<string[]> => {
  if (!observationText.trim()) {
    return [];
  }

  // Best Practice: Instantiate per request to ensure fresh config/env vars
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `你的角色是一位资深的学前教育专家。你的任务是从用户提供的幼儿观察记录中，提取出最能体现幼儿内在思考、能力发展和情感状态的“高价值”关键证据。

你的判断标准需要非常严格，专注于“高价值”的瞬间，而不是简单罗列行为。

**黄金教学案例 (请学习这些范例的判断逻辑):**
- **案例1 (音乐活动)**:
  - 原始记录: "乐颜打开音响播放小星星快板，听了几句又换成了慢板，同样听几句后又换成了快板...她调整放慢了节奏，能够跟上慢板的乐曲。"
  - 专家提取的证据: ["她调整放慢了节奏，能够跟上慢板的乐曲。"] (这体现了“发现问题->解决问题”的能力，价值最高)
- **案例2 (科学活动)**:
  - 原始记录: "忻悦拿起U形磁铁...说:‘这个U形磁铁没有长方形磁铁的吸力大...’。他又分别拿起圆形磁铁和环形磁铁靠近金属材料...一边尝试一边告诉我:‘圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。’"
  - 专家提取的证据: ["圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。"] (这体现了“比较与结论”，价值很高)

**高价值证据的判断标准 (优先提取):**
1.  **认知飞跃**: 寻找体现“顿悟”、得出结论、解决问题或创造性思维的瞬间。 (如案例1和2)
2.  **科学探究过程**: 捕捉有条理的、一步步的探索行为本身，以及发起共同探究的语言。
3.  **创造性应用**: 关注幼儿将学到的知识或技能应用到新情境中的行为。例如，“他用磁铁和螺帽搭了一个机器人,下面垫个磁铁机器人站得更稳了。”

**需要忽略或过滤的内容：**
- **教师的旁白和总结** (例如: "这个比较不同磁铁的吸力游戏持续了12分钟。")
- 教师的行为、语言和环境设置。
- 简单的、不包含深度思考的陈述性行为。

你的输出必须是一个JSON数组，其中只包含你找到的关键证据字符串。不要返回任何其他内容或解释。`;

  try {
    // Use Gemini 2.5 Flash for extraction (Thinking not strictly needed for extraction, but helps with reasoning)
    // For extraction, speed is key, so we keep it simple or use a smaller thinking budget if needed.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: observationText }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      },
    });
    const result = JSON.parse(response.text);
    return result as string[];
  } catch (error) {
    console.error("Error extracting evidence:", error);
    throw new Error("提取关键证据时出错。");
  }
};

// Semantic retrieval using local RAG service
const retrieveKnowledge = async (query: string, topK: number = 5): Promise<string> => {
  if (!query || !query.trim()) return "";

  try {
    const response = await fetch('http://localhost:5001/retrieve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        top_k: topK
      })
    });

    if (!response.ok) {
      console.warn('RAG service not available, falling back to empty context');
      return "";
    }

    const data: RAGResponse = await response.json();
    const chunks = data.chunks || [];

    if (chunks.length === 0) return "";

    return chunks.map((item: RAGChunk, index: number) => `
[参考资料 ${index + 1}] (来源: ${item.source}, 相似度: ${(item.score * 100).toFixed(1)}%)
${item.text}
`).join("\n");
  } catch (error) {
    console.warn('Failed to retrieve knowledge from RAG service:', error);
    return "";
  }
};

const formatLogsForPrompt = (logs: CalibrationLog[]): string => {
  if (!logs || logs.length === 0) return '';

  const highQualityLogs = logs
    .filter(log => log.calibratedEvidence.length > 0)
    .slice(0, 2);

  if (highQualityLogs.length === 0) return '';

  const examples = highQualityLogs.map((log, index) => {
    return `
### 专家校准范例 #${index + 1}
- **原始记录**: "${log.originalText}"
- **专家校准后的关键证据**: ${JSON.stringify(log.calibratedEvidence)}
    `;
  }).join('');

  return `
---
**请优先学习并模仿以下由专家校准过的黄金范例，以提升你分析的准确性：**
${examples}
---
  `;
};


export const queryGuide = async (
  data: ObservationFormData,
  calibrationLogs?: CalibrationLog[]
): Promise<QueryResult> => {

  // Always create a new instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { observationText, ageGroup, knowledgeBase: customKnowledgeBase, keyEvidence, images, video, videoMetadata, videoKeyframes } = data;

  // Retrieve relevant knowledge from the built-in knowledge base using semantic search
  const retrievedKnowledge = await retrieveKnowledge(observationText);

  // Combine custom knowledge base (if any) with retrieved knowledge
  const combinedKnowledgeBase = [customKnowledgeBase, retrievedKnowledge].filter(Boolean).join("\n\n");

  const baseRules = `**通用核心规则**
1.  **知识库优先**：如果提供了参考资料（'Reference Knowledge'），你必须优先依据该文档内容进行分析。此时，所有匹配目标的'source'字段必须为"来自参考资料"。如果未提供，则依据你内置的《指南》知识。
2.  **循证分析**：'evidence'字段必须是直接引用或高度概括观察记录中的原话，这是证明你的匹配是循证的、而不是凭空捏造的关键。如果提供了图片或视频，你的分析和证据需要结合多模态内容。对于视频，请描述你看到的具体动作、表情或互动细节作为证据。
3.  **视频分析规则 (如果提供了视频)**:
    a.  **聚焦关键瞬间**: 视频可能包含大量信息，请你专注于那些最能体现幼儿发展水平、认知过程或情感状态的“高价值”瞬间。
    b.  **细节描述**: 在'evidence'字段中，对于视频证据，请详细描述你观察到的具体动作、表情、语言或互动细节。例如，不要只写“孩子在玩积木”，而应写“孩子尝试将两个不同形状的积木拼在一起，先是尝试圆形，发现不匹配后，拿起方形积木并成功放入，脸上露出满意的笑容。”
    c.  **时间戳 (可选但推荐)**: 如果可能，请在描述视频证据时，尝试提及关键行为发生的大致时间点（例如，“在视频的0:15处，孩子...”），这有助于教师回溯。
    d.  **多模态整合**: 如果同时提供了文字记录和视频，请优先使用视频中观察到的行为作为证据，因为视频提供了更直接、更丰富的行为细节。文字记录可作为补充或背景信息。
    e.  **关键帧截图**: 如果系统同时提供了自动截取的关键帧截图，请将它们视为额外图片证据，用以辅助描述或定位视频片段。
4.  **核心预测**：判断观察记录最能体现的核心发展领域（'domainPrediction'），并给出置信度（0到1之间）。
5.  **【强制】多维分析**: 一段复杂的观察记录（或一条关键证据）可能同时反映了幼儿在多个领域或多个目标上的发展。如果适用，你应当为同一段证据匹配多个来自不同领域或方面的目标。不要将你的分析局限于单一视角。
6.  **匹配发展目标**：找出所有相关的具体发展目标（'matchedTargets'），并按置信度从高到低排序，最多不超过5个。
7.  **提供观察建议**：为每个匹配的目标提供2条具体的、可操作的"即时观察项"（'suggested_observations'），帮助教师进行下一步观察。
8.  **提供教育建议**：对于每个匹配的目标，**必须**从《指南》或自定义知识库中找出对应的"教育建议"，并将其放入'educationalSuggestions'数组中。
9.  **【强制】提供解析**：为每个匹配的目标，你**必须**提供一个'reasoning'字段。该字段应包含简洁的分析（1-2句话），解释'evidence'与匹配的'title'之间的逻辑联系，帮助教师理解你的思路。
10. **【强制】来源路径格式**: 'source' 字段至关重要，它为教师提供了在《指南》中回溯的完整路径。因此，它**必须**严格遵循 '领域 / 方面 / 目标X 标题 / 年龄段' 的格式。例如，一个正确的'source'是 '科学 / 科学探究 / 目标2 具有初步的探究能力 / 4-5岁'。
11. **JSON输出**：你的回答必须是严格遵循所提供schema的单个JSON对象，不要包含任何额外的解释、注释或markdown标记。`;

  let systemInstruction = '';

  if (ageGroup === AgeGroup.AUTO_DETECT) {
    if (keyEvidence && keyEvidence.length > 0) {
      systemInstruction = `你是一位顶尖的儿童早期教育专家，正在进行一次高度聚焦的分析。一位专家已经为你提取了“黄金证据”列表。
**核心任务分两步**：
1.  **第一步：基于黄金证据判断年龄段**。你的首要任务是，**仅**根据用户提供的“黄金证据”列表（以及可能附带的图片/视频），分析并判断出孩子的行为最符合哪个年龄段（'3-4岁', '4-5岁', 或 '5-6岁'）。你的这个判断必须准确地反映在返回的'agePrediction'字段中。
2.  **第二步：基于判断和黄金证据进行分析**。在你确定了最可能的年龄段之后，你**必须**以该年龄段为框架，并**只**使用“黄金证据”列表作为你分析的唯一依据，去完成后续的所有分析。这意味着：
    a. 'matchedTargets'中所有目标的'source'字段里的年龄段，都必须与你在第一步中判断出的年龄段完全一致。
    b. 'matchedTargets'中所有目标的'evidence'字段，都**必须**来自于“黄金证据”列表。严禁从原始文本中寻找新证据。
${baseRules}`;
    } else {
      systemInstruction = `你是一位顶尖的儿童早期教育专家。你的任务是分析教师提供的幼儿观察记录（可能包含文字、图片或视频），并以结构化的JSON格式返回你的专业评估。
**核心任务分两步**：
1.  **第一步：智能判断年龄段**。你的首要任务是，仅根据用户提供的观察记录，分析并判断出孩子的行为最符合哪个年龄段（'3-4岁', '4-5岁', 或 '5-6岁'）。你的这个判断必须准确地反映在返回的'agePrediction'字段中。
2.  **第二步：基于判断进行分析**。在你确定了最可能的年龄段之后，你**必须**以该年龄段为框架，去完成后续的所有分析。这意味着'matchedTargets'中所有目标的'source'字段里的年龄段，都必须与你在第一步中判断出的年龄段完全一致。
${baseRules}`;
    }
  } else {
    if (keyEvidence && keyEvidence.length > 0) {
      systemInstruction = `你是一位顶尖的儿童早期教育专家。你的任务是进行一次高度聚焦的分析。一位专家用户已经为你从原始观察记录中提取出了最关键的“黄金证据”列表。
**最高优先级指令**：
1.  **唯一依据**：你的所有分析，尤其是'matchedTargets'中的'evidence'字段，**必须且只能**基于我提供给你的“黄金证据”列表（以及可能附带的图片/视频）。
2.  **禁止自由发挥**：**严禁**从原始文本中寻找“黄金证据”列表之外的其他信息作为证据。
3.  **【强制】年龄段框架**：你的所有分析和发展目标匹配，**必须**严格在用户指定的幼儿年龄段 ('ageGroup') 框架内进行。
4.  **核心任务**：基于这份黄金证据，完成发展领域判断、目标匹配、观察建议和教育建议。
${baseRules}`;
    } else {
      const fewShotExamples = formatLogsForPrompt(calibrationLogs || []);
      systemInstruction = `${fewShotExamples}你是一位顶尖的儿童早期教育专家，对中国的《3-6岁儿童学习与发展指南》了如指掌。
**【强制】年龄段框架**：你的所有分析和发展目标匹配，**必须**严格在用户指定的幼儿年龄段 ('ageGroup') 框架内进行。即使你认为文本内容描述的儿童行为似乎属于另一个年龄段，你也必须遵守用户指定的年龄段。你可以在 'agePrediction' 字段中表达你的独立判断，但在 'matchedTargets' 中返回的所有目标，其来源 ('source') 和内容都必须符合用户选定的年龄段。
${baseRules}`;
    }
  }

  const userPrompt = `
    请根据以下信息进行分析:

    - **观察记录 (inputText)**: "${observationText}"
    - **幼儿年龄段 (ageGroup)**: "${ageGroup}"
    ${combinedKnowledgeBase ? `- **参考资料 (Reference Knowledge)**: """${combinedKnowledgeBase}"""` : ''}
    ${(keyEvidence && keyEvidence.length > 0) ? `- **专家确认的黄金证据 (Golden Evidence)**: ${JSON.stringify(keyEvidence)}` : ''}
    ${video ? `- **视频附件**: 包含一段幼儿活动的视频，请仔细观察视频中的行为细节。` : ''}
    ${videoMetadata ? `- **视频元信息**: 时长约 ${Math.round(videoMetadata.duration)} 秒，分辨率 ${videoMetadata.width}x${videoMetadata.height}${videoMetadata.size ? `，大小约 ${(videoMetadata.size / (1024 * 1024)).toFixed(1)}MB` : ''}${videoMetadata.fileName ? `，文件名 ${videoMetadata.fileName}` : ''}。` : ''}
    ${(videoKeyframes && videoKeyframes.length > 0) ? `- **关键帧提示**: 系统自动截取了 ${videoKeyframes.length} 张关键帧截图，已附加为图片证据。` : ''}
  `;

  const parts: any[] = [{ text: userPrompt }];
  if (images && images.length > 0) {
    images.forEach(image => {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        }
      });
    });
  }

  if (video) {
    parts.push({
      inlineData: {
        mimeType: video.mimeType,
        data: video.data,
      }
    });
  }

  if (videoKeyframes && videoKeyframes.length > 0) {
    videoKeyframes.forEach(frame => {
      parts.push({
        inlineData: {
          mimeType: frame.mimeType,
          data: frame.data,
        }
      });
    });
  }


  try {
    // Use Gemini 2.5 Flash with Thinking for complex reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: queryResultSchema,
        // Thinking Budget: Allow the model to "think" about the educational theories before answering.
        // Budget 2048 is sufficient for analyzing a paragraph of text.
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    const responseText = response.text;
    const resultJson = JSON.parse(responseText);

    // Augment the AI response with user-selected data for frontend use
    const finalResult: QueryResult = {
      ...resultJson,
      inputText: observationText,
      selectedAgeGroup: ageGroup as AgeGroup,
    };

    console.log('AI Response:', finalResult);
    return finalResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error('AI 服务在生成分析时遇到问题，请稍后重试。');
  }
};


export const getGrowthInsightAnalysis = async (log: Pick<CalibrationLog, 'originalText' | 'aiInitialEvidence' | 'calibratedEvidence'>): Promise<string> => {
  // Always create a new instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `你的角色是一位资深的AI学习分析师和教育研究员。你的任务是分析一次AI证据提取的校准过程，并提炼出专家校准行为背后所蕴含的核心教育思想和循证原则。

你的分析需要回答“为什么”而不是“是什么”。不要简单地罗列差异，而是要总结出更高层次的原则。

**输入格式:**
你会收到三部分信息：
1.  **原始记录**: 教师写的完整观察文本。
2.  **AI判定**: AI模型初步提取的关键证据列表。
3.  **人工校准**: 教育专家最终确认的“黄金证据”列表。

**输出要求:**
你的输出必须是一段简洁、深刻的分析文字。根据差异，你可以从以下一个或多个角度进行总结：

-   **【AI学到的新原则】**: 当“人工校准”比“AI判定”增加了证据时，总结这些新增证据体现了什么更深层次的观察原则。
    -   *示例*: "专家本次校准，让AI学会了要更关注**描述儿童从遇到问题到自主调整策略并最终解决问题的完整行为链条**，而不仅仅是孤立的行为。"
-   **【AI修正的旧原则】**: 当“人工校准”比“AI判定”删除了证据时，总结这些被删除的证据为什么不被视为高价值证据。
    -   *示例*: "AI认识到，在音乐探索活动中，**儿童对节奏、音色的具体操作和模仿**，比简单的切换曲目更能体现其探究深度。"
-   **【判断得到巩固】**: 如果两个版本完全一致，请明确指出。
    -   *示例*: "AI的判断与专家完全一致，其关于‘**有条理的科学探究过程**’的证据提取能力得到了验证和巩固。"

请直接输出你的分析结论，语言要专业、精炼。`;

  const userPrompt = `
    请根据以下校准记录进行元认知分析:

    - **原始记录**: 
    """
    ${log.originalText}
    """

    - **AI判定**: 
    ${JSON.stringify(log.aiInitialEvidence)}

    - **人工校准**: 
    ${JSON.stringify(log.calibratedEvidence)}
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for meta-analysis as well
        temperature: 0.3,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error getting growth insight analysis:", error);
    return "分析学习成果时出错，请稍后重试。";
  }
};
