import { db } from '../db';
import { FeedbackPayload, FeedbackType } from '../types';

export const saveFeedback = async (feedback: FeedbackPayload): Promise<{ success: boolean }> => {
  try {
    await db.feedbackLogs.add({
      queryId: feedback.queryId,
      targetId: feedback.targetId,
      originalText: feedback.originalText,
      aiEvidence: feedback.aiEvidence,
      matchedTarget: feedback.matchedTarget,
      feedbackType: feedback.feedbackType,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to save feedback:', error);
    return { success: false };
  }
};

export const getRelevantExamples = async (): Promise<string> => {
  try {
    // Get last 3 positive feedbacks
    const logs = await db.feedbackLogs
      .where('feedbackType')
      .equals(FeedbackType.CONFIRM)
      .reverse()
      .limit(3)
      .toArray();

    if (logs.length === 0) return '';

    return logs
      .map((log, index) => {
        try {
          const target = JSON.parse(log.matchedTarget);
          return `
### 优秀范例 #${index + 1}
- **观察记录**: "${log.originalText}"
- **专家认可的分析**:
    - **领域**: ${target.source}
    - **证据**: "${log.aiEvidence}"
    - **解析**: "${target.reasoning}"
`;
        } catch {
          return '';
        }
      })
      .join('\n');
  } catch (error) {
    console.error('Failed to fetch relevant examples:', error);
    return '';
  }
};
