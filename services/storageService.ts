
import { UserProfile, User, ExternalJob, JobSearchFilters, JobSearchHistory } from '../types';
import { logger } from './loggingService';

const PROFILE_PREFIX = 'devops_profile_';
const USERS_KEY = 'devops_users';
const CURRENT_SESSION_KEY = 'devops_active_session';
const JOB_CACHE_PREFIX = 'devops_job_cache_';
const JOB_HISTORY_KEY = 'devops_job_history';

export const storageService = {
  // --- Session Management ---
  saveSession: (user: User) => {
      try {
          localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(user));
      } catch (e) {
          logger.error('Failed to save session', e);
      }
  },

  getSession: (): User | null => {
      try {
          const session = localStorage.getItem(CURRENT_SESSION_KEY);
          return session ? JSON.parse(session) : null;
      } catch (e) {
          return null;
      }
  },

  clearSession: () => {
      localStorage.removeItem(CURRENT_SESSION_KEY);
  },

  // --- User Management ---
  getUsers: (): User[] => {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (e) {
      logger.error('Failed to load users', e);
      return [];
    }
  },

  saveUser: (user: User) => {
    try {
      const users = storageService.getUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = { ...user, lastLogin: Date.now() };
      } else {
        users.push({ ...user, lastLogin: Date.now() });
      }
      
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      logger.info('User saved', { userId: user.id });
    } catch (e) {
      logger.error('Failed to save user', e);
    }
  },

  // --- Profile Data Persistence ---
  saveUserProfile: (userId: string, data: UserProfile) => {
    try {
      localStorage.setItem(`${PROFILE_PREFIX}${userId}`, JSON.stringify(data));
      // Intentionally not logging every save to avoid clutter, usually handled by caller if important
    } catch (e) {
      logger.error('Failed to save profile data', e);
    }
  },

  loadUserProfile: (userId: string): UserProfile | null => {
    try {
      const data = localStorage.getItem(`${PROFILE_PREFIX}${userId}`);
      if (data) {
        logger.info('Profile loaded from storage', { userId });
        return JSON.parse(data);
      }
      return null;
    } catch (e) {
      logger.error('Failed to load profile data', e);
      return null;
    }
  },

  deleteUserProfile: (userId: string) => {
      try {
          localStorage.removeItem(`${PROFILE_PREFIX}${userId}`);
          // Also remove from users list
          const users = storageService.getUsers().filter(u => u.id !== userId);
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          logger.info('User profile deleted', { userId });
      } catch (e) {
          logger.error('Failed to delete user profile', e);
      }
  },

  // --- Job Board Caching ---
  
  getJobCache: (filters: JobSearchFilters): ExternalJob[] | null => {
      try {
          const key = JOB_CACHE_PREFIX + JSON.stringify(filters);
          const cached = localStorage.getItem(key);
          if (cached) {
              const { data, timestamp } = JSON.parse(cached);
              // Cache valid for 1 hour
              if (Date.now() - timestamp < 3600000) {
                  return data;
              }
          }
          return null;
      } catch (e) {
          return null;
      }
  },

  setJobCache: (filters: JobSearchFilters, jobs: ExternalJob[]) => {
      try {
          const key = JOB_CACHE_PREFIX + JSON.stringify(filters);
          const cacheEntry = {
              data: jobs,
              timestamp: Date.now()
          };
          localStorage.setItem(key, JSON.stringify(cacheEntry));
      } catch (e) {
          console.warn("Cache full");
      }
  },

  getSearchHistory: (): JobSearchHistory[] => {
      try {
          const h = localStorage.getItem(JOB_HISTORY_KEY);
          return h ? JSON.parse(h) : [];
      } catch (e) { return []; }
  },

  addToSearchHistory: (filters: JobSearchFilters, count: number) => {
      try {
          const history = storageService.getSearchHistory();
          // Remove duplicate if exists
          const filtered = history.filter(h => JSON.stringify(h.filters) !== JSON.stringify(filters));
          const newEntry: JobSearchHistory = {
              id: Date.now().toString(),
              filters,
              timestamp: Date.now(),
              resultCount: count
          };
          // Keep last 5
          const updated = [newEntry, ...filtered].slice(0, 5);
          localStorage.setItem(JOB_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) { console.warn(e); }
  }
};
