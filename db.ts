import Dexie, { type Table } from 'dexie';
import { CalibrationLog } from './types';

export class AiAssistantDB extends Dexie {
  // Use Table<Type, KeyType>
  logs!: Table<CalibrationLog, string>;

  constructor() {
    super('AiAssistantDB');
    // Define tables and indexes
    // 'id' is the primary key
    // 'timestamp' and 'domain' are indexed for sorting and filtering
    (this as any).version(1).stores({
      logs: 'id, timestamp, domain' 
    });
  }
}

export const db = new AiAssistantDB();