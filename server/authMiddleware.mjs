import admin from 'firebase-admin';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';

// In-memory cache for verified Google tokens (token → { uid, email, expiresAt })
const googleTokenCache = new Map();

/**
 * Verify a raw Google ID token using Google's tokeninfo endpoint.
 * Caches results for the token's remaining lifetime.
 * Returns { uid, email } on success, null on failure.
 */
const verifyGoogleToken = async (token) => {
  const cached = googleTokenCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return { uid: cached.uid, email: cached.email };
  }
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!res.ok) return null;
    const info = await res.json();
    if (GOOGLE_CLIENT_ID && info.aud !== GOOGLE_CLIENT_ID) return null;
    if (!info.sub) return null;
    const result = { uid: `google-${info.sub}`, email: info.email || '' };
    // Cache until token expires (info.exp is Unix seconds)
    const expiresAt = info.exp ? info.exp * 1000 : Date.now() + 55 * 60 * 1000;
    googleTokenCache.set(token, { ...result, expiresAt });
    // Prune old entries periodically to prevent memory growth
    if (googleTokenCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of googleTokenCache) {
        if (now > v.expiresAt) googleTokenCache.delete(k);
      }
    }
    return result;
  } catch {
    return null;
  }
};

/**
 * Express middleware that verifies Firebase ID tokens OR Google ID tokens.
 * Attaches `req.userId` and `req.email` on success, returns 401 otherwise.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  // 1. Try Firebase ID token
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    req.email = decoded.email || '';
    return next();
  } catch {
    // Fall through to Google token verification
  }

  // 2. Try Google ID token (from Google Sign-In)
  const googleUser = await verifyGoogleToken(token);
  if (googleUser) {
    req.userId = googleUser.uid;
    req.email = googleUser.email;
    return next();
  }

  return res.status(401).json({ error: 'Invalid or expired token' });
};

/**
 * Optional middleware that extracts auth info if present but doesn't block.
 * Useful for routes that should work with or without auth.
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.userId = decoded.uid;
      req.email = decoded.email || '';
    } catch {
      // Token invalid — proceed without auth
    }
  }
  return next();
};
