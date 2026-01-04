
import { UserProfile, User } from '../types';
import { logger } from './loggingService';

const PROFILE_PREFIX = 'devops_profile_';
const USERS_KEY = 'devops_users';
const CURRENT_SESSION_KEY = 'devops_active_session';

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
  }
};
