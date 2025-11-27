import { QueryResult, CalibrationLog } from '../types';
import { ObservationFormData } from '../components/ObservationForm';

const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// Helper to handle API calls
const callDoubaoAPI = async (apiKey: string, payload: object) => {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorBody = await response.json();
      console.error('Doubao API Error Body:', JSON.stringify(errorBody, null, 2));
      // Doubao error format is often { "error": { "message": "...", "code": "..." } }
      if (errorBody && errorBody.error && errorBody.error.message) {
        errorMsg = errorBody.error.message;
      } else if (typeof errorBody === 'string') {
        errorMsg = errorBody;
      }
    } catch {
      // The body wasn't JSON, just use the status text.
    }
    throw new Error(`豆包 API 请求失败: ${errorMsg}`);
  }

  return response.json();
};

const extractEvidenceSchema = {
  type: 'object',
  properties: {
    evidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'An array of key evidence strings extracted from the text.',
    },
  },
  required: ['evidence'],
};

export const extractEvidence = async (
  observationText: string,
  apiKey: string,
  modelEndpoint: string
): Promise<string[]> => {
  const systemInstruction = `你的角色是一位资深的学前教育专家。你的任务是从用户提供的幼儿观察记录中，提取出最能体现幼儿内在思考、能力发展和情感状态的“高价值”关键证据。

你的判断标准需要非常严格，专注于“高价值”的瞬间，而不是简单罗列行为。

**黄金教学案例 (请学习这些范例的判断逻辑):**
- **案例1 (音乐活动)**:
  - 原始记录: "乐颜打开音响播放小星星快板，听了几句又换成了慢板，同样听几句后又换成了快板...她调整放慢了节奏，能够跟上慢板的乐曲。"
  - 专家提取的证据: ["她调整放慢了节奏，能够跟上慢板的乐曲。"]
- **案例2 (科学活动)**:
  - 原始记录: "忻悦拿起U形磁铁...说:‘这个U形磁铁没有长方形磁铁的吸力大...’。他又分别拿起圆形磁铁和环形磁铁靠近金属材料...一边尝试一边告诉我:‘圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。’"
  - 专家提取的证据: ["圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。"]

**高价值证据的判断标准 (优先提取):**
1.  **认知飞跃**: 寻找体现“顿悟”、得出结论、解决问题或创造性思维的瞬间。
2.  **科学探究过程**: 捕捉有条理的、一步步的探索行为本身。
3.  **创造性应用**: 关注幼儿将学到的知识或技能应用到新情境中的行为。

**需要忽略或过滤的内容：**
- **教师的旁白和总结**
- 教师的行为、语言和环境设置。
- 简单的、不包含深度思考的陈述性行为。`;

  const payload = {
    model: modelEndpoint,
    messages: [
      { role: 'system', content: systemInstruction },
      {
        role: 'user',
        content: `请根据以上原则，从以下观察记录中提取关键证据: "${observationText}"`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_evidence',
          description: '从观察记录中提取关键证据。',
          parameters: extractEvidenceSchema,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'extract_evidence' } },
  };

  const response = await callDoubaoAPI(apiKey, payload);
  try {
    const message = response.choices?.[0]?.message;
    if (!message) {
      console.error('Doubao response invalid format:', response);
      throw new Error('豆包模型返回的响应中没有有效信息。');
    }

    // Attempt 1: Get from tool_calls (preferred)
    const toolCall = message.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      if (args && Array.isArray(args.evidence)) {
        return args.evidence;
      }
    }

    // Attempt 2 (Fallback): Parse from message.content if model returns raw JSON
    if (typeof message.content === 'string' && message.content.trim().startsWith('{')) {
      try {
        const contentJson = JSON.parse(message.content);
        if (contentJson && Array.isArray(contentJson.evidence)) {
          return contentJson.evidence;
        }
      } catch (parseError) {
        console.warn(
          'Could not parse message.content as JSON, though it looked like it.',
          parseError
        );
      }
    }

    console.error(
      'Doubao response did not contain a valid tool call or parsable JSON content:',
      response
    );
    throw new Error('豆包模型未能按预期返回结构化证据。请检查模型是否支持工具调用或JSON输出。');
  } catch (e) {
    console.error('Failed to parse Doubao evidence extraction response:', e, response);
    if (e instanceof Error) {
      throw new Error(`解析豆包模型返回结果时出错: ${e.message}`);
    }
    throw new Error('解析豆包模型返回结果时出现未知错误。');
  }
};

const queryResultSchema = {
  type: 'object',
  properties: {
    queryId: {
      type: 'string',
      description: "A unique identifier for this query, starting with 'qry-doubao-'.",
    },
    domainPrediction: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
      required: ['value', 'confidence'],
    },
    agePrediction: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
      required: ['value', 'confidence'],
    },
    holistic_evaluation: {
      type: 'string',
      description: `整体发展评价。要求：
        1. 结构：分为3-4段，每段聚焦一个维度（如认知特征、学习品质、社会性发展）
        2. 证据密度：平均每40字必须对应一个具体行为细节
        3. 理论框架：至少使用一个发展心理学理论来解释行为意义
        4. 语言风格：专业但有温度，像资深教研员在和家长交流
        5. 禁忌：严禁使用"宝宝""真棒""很聪明"等泛泛表述`,
    },
    matchedTargets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          source: { type: 'string' },
          evidence: { type: 'string' },
          reasoning: { type: 'string' },
          confidence: { type: 'number' },
          suggested_observations: { type: 'array', items: { type: 'string' } },
          educationalSuggestions: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'id',
          'title',
          'source',
          'evidence',
          'reasoning',
          'confidence',
          'suggested_observations',
          'educationalSuggestions',
        ],
      },
    },
  },
  required: [
    'queryId',
    'domainPrediction',
    'agePrediction',
    'holistic_evaluation',
    'matchedTargets',
  ],
};

export const queryGuide = async (
  data: ObservationFormData,
  apiKey: string,
  modelEndpoint: string
): Promise<QueryResult> => {
  const { observationText, ageGroup, knowledgeBase, keyEvidence } = data;

  const goldenExample = `
**整体评价黄金范例**：
观察记录："小明搭积木时，先尝试用圆柱体做底座，发现不稳后，换成了立方体..."

✅ 高质量评价示例：
"从小明的搭建行为可以观察到明显的'试错-调整'策略循环（Trial-and-Error，皮亚杰），这是4-5岁幼儿具身认知发展的典型表现。他在发现圆柱体底座不稳后，并未求助成人，而是自主切换方案，这种策略灵活性（cognitive flexibility）体现了执行功能的萌芽。值得关注的是，他在成功后回顾了失败方案（'圆的会滚'），显示出初步的元认知意识..."

❌ 低质量评价（需避免）：
"小明在搭积木时表现得很聪明，遇到困难也不放弃，说明他的动手能力很强..."
`;

  let systemInstruction = `你是一位顶尖的儿童早期教育专家，对中国的《3-6岁儿童学习与发展指南》了如指掌。你的任务是分析教师提供的幼儿观察记录，并以结构化的JSON格式返回你的专业评估。
    规则：
    1.  **分析输入**：仔细阅读教师的观察记录和指定的幼儿年龄段。
    2.  **知识库优先**：如果提供了自定义知识库，必须优先依据该文档内容进行分析，此时所有匹配目标的'source'字段必须为“来自您上传的文档”。
    3.  **循证分析**：'evidence'字段必须是直接引用或高度概括观察记录中的原话。
    4.  **【强制】核心预测**：判断核心发展领域和最匹配的年龄段，并给出置信度。**重要约束**：'domainPrediction.value' 字段**必须且只能**是以下五大领域之一：**健康**、**语言**、**社会**、**科学**、**艺术**。严禁使用其他值（如"指南"、"综合"等）。
    5.  **匹配目标**：找出1-3个最相关的具体发展目标，并按置信度从高到低排序。
    6.  **提供建议**：为每个匹配的目标提供2条具体的“即时观察项”以及1-2条“教育支持策略”。
    7.  **提供解析**：为每个匹配目标提供'reasoning'，解释证据与目标的逻辑联系。
    8.  **【新增】整体评价 (holistic_evaluation)**：
        a. **结构**：分为3-4段，每段聚焦一个维度（如认知特征、学习品质、社会性发展）
        b. **证据密度**：平均每40字必须对应一个具体行为细节
        c. **理论框架**：至少使用一个发展心理学理论来解释行为意义
        d. **语言风格**：专业但有温度，像资深教研员在和家长交流
        e. **禁忌**：严禁使用"宝宝""真棒""很聪明"等泛泛表述
    9.  **JSON输出**：你的回答必须是严格遵循所定义的function call schema的JSON对象。

${goldenExample}`;

  if (keyEvidence && keyEvidence.length > 0) {
    systemInstruction = `你是一位顶尖的儿童早期教育专家。你的任务是进行一次高度聚焦的分析。一位专家用户已经为你从原始观察记录中提取出了最关键的“黄金证据”列表。
        **最高优先级指令：**
        1.  **唯一依据**：你的所有分析，尤其是'matchedTargets'中的'evidence'字段，**必须且只能**基于我提供给你的“黄金证据”列表。
        2.  **禁止自由发挥**：**严禁**从原始文本中寻找“黄金证据”列表之外的其他信息作为证据。
        3.  **核心任务**：基于这份黄金证据，完成发展领域判断、目标匹配和观察建议。
        4.  **JSON输出**：你的回答必须是严格遵循所定义的function call schema的JSON对象。`;
  }

  const userPrompt = `
    请根据以下信息进行分析:

    - **观察记录**: "${observationText}"
    - **幼儿年龄段**: "${ageGroup}"
    ${knowledgeBase ? `- **自定义知识库**: """${knowledgeBase}"""` : ''}
    ${keyEvidence && keyEvidence.length > 0 ? `- **专家确认的黄金证据**: ${JSON.stringify(keyEvidence)}` : ''}
    `;

  const payload = {
    model: modelEndpoint,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_analysis',
          description: 'Generate a structured analysis of the observation record.',
          parameters: queryResultSchema,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'generate_analysis' } },
  };

  const response = await callDoubaoAPI(apiKey, payload);
  try {
    const message = response.choices?.[0]?.message;
    if (!message) {
      throw new Error('豆包模型返回的响应中没有有效信息。');
    }

    // Attempt 1: Get from tool_calls (preferred)
    const toolCall = message.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      const finalResult: QueryResult = { ...args, inputText: observationText };
      return finalResult;
    }

    // Attempt 2 (Fallback): Parse from message.content if model returns raw JSON
    if (typeof message.content === 'string' && message.content.trim().startsWith('{')) {
      try {
        const args = JSON.parse(message.content);
        // Basic check to see if it looks like our schema
        if (args.queryId && args.matchedTargets) {
          const finalResult: QueryResult = { ...args, inputText: observationText };
          return finalResult;
        }
      } catch (parseError) {
        console.warn('Could not parse message.content as JSON in queryGuide.', parseError);
      }
    }

    throw new Error('豆包模型未能返回有效的分析结构。');
  } catch (e) {
    console.error('Failed to parse Doubao query guide response:', e);
    throw new Error('豆包模型返回的分析结果格式无法解析。');
  }
};

// Streaming implementation for Learning Story
export async function* generateLearningStoryStream(
  observationText: string,
  analysisResult: QueryResult,
  apiKey: string,
  modelEndpoint: string
): AsyncGenerator<string, void, unknown> {
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

  const payload = {
    model: modelEndpoint,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
    stream: true, // Enable streaming
    temperature: 0.7,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('data: ')) continue;

        const jsonStr = trimmedLine.replace('data: ', '');
        if (jsonStr === '[DONE]') return;

        try {
          const json = JSON.parse(jsonStr);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        } catch (e) {
          console.warn('Error parsing stream chunk', e);
        }
      }
    }
  } catch (error) {
    console.error('Doubao stream error:', error);
    yield '\n\n(生成过程中断，请检查网络或API配置)';
  }
}

export const getGrowthInsightAnalysis = async (
  log: Pick<CalibrationLog, 'originalText' | 'aiInitialEvidence' | 'calibratedEvidence'>,
  apiKey: string,
  modelEndpoint: string
): Promise<string> => {
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
-   **【AI修正的旧原则】**: 当“人工校准”比“AI判定”删除了证据时，总结这些被删除的证据为什么不被视为高价值证据。
-   **【判断得到巩固】**: 如果两个版本完全一致，请明确指出。

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

  const payload = {
    model: modelEndpoint,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  };

  try {
    const response = await callDoubaoAPI(apiKey, payload);
    return response.choices?.[0]?.message?.content || '无法获取分析结果。';
  } catch (error) {
    console.error('Error getting growth insight analysis (Doubao):', error);
    return '分析学习成果时出错，请稍后重试。';
  }
};
