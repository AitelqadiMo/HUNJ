
import { LogEntry } from '../types';

const LOG_STORAGE_KEY = 'devops_app_logs';
const MAX_LOGS = 200;

export const logger = {
  info: (action: string, details?: any) => {
    addLog('INFO', action, details);
    console.log(`[INFO] ${action}`, details || '');
  },

  error: (action: string, error: any) => {
    const details = error instanceof Error ? error.message : error;
    addLog('ERROR', action, details);
    console.error(`[ERROR] ${action}`, error);
  },

  warn: (action: string, details?: any) => {
    addLog('WARN', action, details);
    console.warn(`[WARN] ${action}`, details || '');
  },

  getLogs: (): LogEntry[] => {
    try {
      const logs = localStorage.getItem(LOG_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      return [];
    }
  },

  clearLogs: () => {
    localStorage.removeItem(LOG_STORAGE_KEY);
  }
};

const addLog = (level: 'INFO' | 'WARN' | 'ERROR', action: string, details?: any) => {
  try {
    const newEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      level,
      action,
      details
    };

    const currentLogs = logger.getLogs();
    const updatedLogs = [newEntry, ...currentLogs].slice(0, MAX_LOGS);
    
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    // Fail silently if local storage is full or error
    console.error("Failed to write log", e);
  }
};
