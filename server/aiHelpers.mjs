import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const REQUEST_TIMEOUT_MS = 30000;
const RETRY_DELAYS_MS = [500, 1500];

let _ai = null;

export const getGemini = () => {
  if (!GEMINI_KEY) throw new Error('Missing GEMINI_API_KEY env var');
  if (!_ai) _ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  return _ai;
};

export const runWithTimeout = async (promise, ms = REQUEST_TIMEOUT_MS) => {
  let tid = null;
  const timeout = new Promise((_, reject) => {
    tid = setTimeout(() => reject(new Error('Gemini request timed out')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (tid) clearTimeout(tid);
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const generateWithRetry = async (factory) => {
  let last = null;
  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    try {
      return await runWithTimeout(factory());
    } catch (e) {
      last = e;
      if (i < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[i]);
        continue;
      }
    }
  }
  throw last || new Error('Gemini request failed');
};

export const sanitizeResumeInput = (r) => {
  if (!r || typeof r !== 'object') return {};
  return {
    fullName: r.fullName || '',
    role: r.role || '',
    email: r.email || '',
    summary: r.summary || '',
    skills: Array.isArray(r.skills) ? r.skills : [],
    experience: Array.isArray(r.experience)
      ? r.experience.slice(0, 8).map((e) => ({
          role: e.role || '',
          company: e.company || '',
          period: e.period || '',
          bullets: Array.isArray(e.bullets)
            ? e.bullets.slice(0, 8).map((b) => (typeof b === 'string' ? b : b?.text || ''))
            : []
        }))
      : [],
    education: r.education || '',
    projects: Array.isArray(r.projects)
      ? r.projects.slice(0, 5).map((p) => ({
          name: p.name || '',
          description: p.description || ''
        }))
      : [],
    certifications: Array.isArray(r.certifications)
      ? r.certifications.slice(0, 5).map((c) => ({ name: c.name || '', issuer: c.issuer || '' }))
      : [],
    languages: Array.isArray(r.languages) ? r.languages : []
  };
};

export { Type };
