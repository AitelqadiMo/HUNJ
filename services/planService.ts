import { UsageStats } from '../types';

export const getTodayKey = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const ensureDailyUsage = (usage?: UsageStats): UsageStats => {
  const today = getTodayKey();
  if (!usage || usage.dayKey !== today) {
    return {
      dayKey: today,
      aiActions: 0,
      resumesGenerated: 0,
      jobSearches: 0,
    };
  }
  return usage;
};
