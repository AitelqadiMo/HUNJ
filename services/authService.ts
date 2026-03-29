/**
 * Centralized auth service for managing Firebase ID tokens
 * on the client side and attaching them to all API requests.
 */

const TOKEN_KEY = 'hunj_id_token';
const TOKEN_EXPIRY_KEY = 'hunj_token_expiry';

let _idToken: string | null = null;
let _tokenExpiry: number = 0;

export const authService = {
  /** Store the token both in memory and localStorage so it survives page refreshes */
  setToken(token: string) {
    _idToken = token;
    // Google/Firebase tokens last ~1 hour; mark expiry at 55 min
    _tokenExpiry = Date.now() + 55 * 60 * 1000;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(_tokenExpiry));
    } catch { /* ignore storage errors */ }
  },

  /** Clear the stored token (logout) */
  clearToken() {
    _idToken = null;
    _tokenExpiry = 0;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch { /* ignore */ }
  },

  /** Get the current token, restoring from localStorage if the in-memory copy is missing */
  getToken(): string | null {
    if (!_idToken) {
      // Attempt to restore from localStorage (e.g. after a page refresh)
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0');
        if (stored && Date.now() < expiry) {
          _idToken = stored;
          _tokenExpiry = expiry;
        }
      } catch { /* ignore */ }
    }
    if (!_idToken || Date.now() > _tokenExpiry) return null;
    return _idToken;
  },

  /** Returns headers object to include in fetch() calls */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  /** Check if the user is authenticated */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
