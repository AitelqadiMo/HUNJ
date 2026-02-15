import { User, UserProfile } from '../types';

const API_BASE = (import.meta as any)?.env?.VITE_BILLING_API_BASE || 'http://localhost:8787';

const safeFetchJson = async (url: string, options?: RequestInit): Promise<any | null> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const lastAppsSnapshot = new Map<string, string>();
const lastDocsSnapshot = new Map<string, string>();

const stableStringify = (value: any): string => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return 'null';
  }
};

const stripCollectionData = (profile: UserProfile): any => {
  const { applications, documents, ...rest } = profile as any;
  return { ...rest, applications: [], documents: [] };
};

export const backendDataService = {
  async upsertUser(user: User): Promise<boolean> {
    const data = await safeFetchJson(`${API_BASE}/api/users/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    return Boolean(data?.ok);
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const workspace = await safeFetchJson(`${API_BASE}/api/workspace/${encodeURIComponent(userId)}`);
    if (workspace?.profile) {
      return {
        ...(workspace.profile as UserProfile),
        applications: Array.isArray(workspace.applications) ? workspace.applications : [],
        documents: Array.isArray(workspace.documents) ? workspace.documents : []
      } as UserProfile;
    }

    const data = await safeFetchJson(`${API_BASE}/api/profile/${encodeURIComponent(userId)}`);
    return (data?.profile as UserProfile) || null;
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<boolean> {
    const slimProfile = stripCollectionData(profile);
    const profileSave = await safeFetchJson(`${API_BASE}/api/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: slimProfile })
    });

    const appsSnapshot = stableStringify(profile.applications);
    const docsSnapshot = stableStringify(profile.documents);

    let appsOk = true;
    let docsOk = true;

    if (lastAppsSnapshot.get(userId) !== appsSnapshot) {
      const appSync = await safeFetchJson(`${API_BASE}/api/applications/sync/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications: profile.applications || [] })
      });
      appsOk = Boolean(appSync?.ok);
      if (appsOk) lastAppsSnapshot.set(userId, appsSnapshot);
    }

    if (lastDocsSnapshot.get(userId) !== docsSnapshot) {
      const docSync = await safeFetchJson(`${API_BASE}/api/documents/sync/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: profile.documents || [] })
      });
      docsOk = Boolean(docSync?.ok);
      if (docsOk) lastDocsSnapshot.set(userId, docsSnapshot);
    }

    return Boolean(profileSave?.ok) && appsOk && docsOk;
  }
};
