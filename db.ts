import Dexie, { type Table } from 'dexie';
import { CalibrationLog, FeedbackLog } from './types';

export class AiAssistantDB extends Dexie {
  // Use Table<Type, KeyType>
  logs!: Table<CalibrationLog, string>;
  feedbackLogs!: Table<FeedbackLog, number>;

  constructor() {
    super('AiAssistantDB');
    // Define tables and indexes
    // 'id' is the primary key
    // 'timestamp' and 'domain' are indexed for sorting and filtering
    (this as any).version(1).stores({
      logs: 'id, timestamp, domain, calibrationPrinciple',
      feedbackLogs: '++id, queryId, targetId, feedbackType, timestamp',
    });
  }
}

export const db = new AiAssistantDB();
