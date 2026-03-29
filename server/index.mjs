import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initFirestore } from './firestore.mjs';
import aiRoutes from './aiRoutes.mjs';
import { requireAuth } from './authMiddleware.mjs';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = Number(process.env.PORT || 8787);

// Accept a comma-separated list of origins, plus common dev ports by default
const allowedOrigins = [
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
];

const EARLY_ACCESS_LIMIT = Number(process.env.EARLY_ACCESS_LIMIT || 20);
const EARLY_ACCESS_DOC = 'meta/earlyAccess';
const EARLY_ACCESS_CODE = 'early20';

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl) and known origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ limit: '4mb' }));

// All API routes require a valid Firebase ID token.
app.use('/api', requireAuth);

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'hunj-api' });
});

const removeUndefinedDeep = (value) => {
  if (Array.isArray(value)) return value.map(removeUndefinedDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = removeUndefinedDeep(v);
    }
    return out;
  }
  return value;
};

const chunkedBatchWrite = async (db, operations) => {
  if (!operations.length) return;
  const chunkSize = 400;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize);
    const batch = db.batch();
    chunk.forEach((op) => {
      if (op.type === 'set') batch.set(op.ref, op.data, op.options || {});
      if (op.type === 'delete') batch.delete(op.ref);
    });
    await batch.commit();
  }
};

const assignEarlyAccess = async (db, userRef) => {
  if (!EARLY_ACCESS_LIMIT || EARLY_ACCESS_LIMIT <= 0) return false;
  const metaRef = db.doc(EARLY_ACCESS_DOC);
  const nowIso = new Date().toISOString();
  let granted = false;
  try {
    await db.runTransaction(async (tx) => {
      const [metaSnap, userSnap] = await Promise.all([tx.get(metaRef), tx.get(userRef)]);
      const userData = userSnap.exists ? userSnap.data() : null;
      if (userData?.promo?.freeAll) {
        granted = true;
        return;
      }
      const count = Number(metaSnap.exists ? metaSnap.data()?.count : 0) || 0;
      if (count >= EARLY_ACCESS_LIMIT) return;
      tx.set(metaRef, { count: count + 1, updatedAt: nowIso }, { merge: true });
      tx.set(
        userRef,
        { promo: { freeAll: true, code: EARLY_ACCESS_CODE, assignedAt: nowIso } },
        { merge: true }
      );
      granted = true;
    });
  } catch (error) {
    console.error('Early access assignment failed', error);
  }
  return granted;
};

const ensureUserDoc = async (db, { userId, email, name }) => {
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  const isNew = !snap.exists;

  if (!snap.exists) {
    await ref.set(
      {
        userId,
        email,
        name: name || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } else {
    await ref.set({ email, name: name || '', updatedAt: new Date().toISOString() }, { merge: true });
  }

  if (isNew) {
    await assignEarlyAccess(db, ref);
  }

  return ref;
};

app.post('/api/users/upsert', async (req, res) => {
  try {
    const db = initFirestore();
    const { user } = req.body || {};
    if (!user?.id || !user?.email) {
      return res.status(400).json({ error: 'user.id and user.email are required' });
    }
    const ref = await ensureUserDoc(db, {
      userId: user.id,
      email: user.email,
      name: user.name || ''
    });
    await ref.set({ picture: user.picture || '', lastLogin: Date.now() }, { merge: true });
    return res.json({ ok: true });
  } catch (error) {
    console.error('users upsert error', error);
    return res.status(500).json({ error: 'Failed to upsert user' });
  }
});

app.get('/api/profile/:userId', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.params.userId || '');
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const snap = await db.collection('profiles').doc(userId).get();
    if (!snap.exists) return res.json({ profile: null });
    return res.json({ profile: snap.data() });
  } catch (error) {
    console.error('profile get error', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.put('/api/profile/:userId', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.params.userId || '');
    const profile = req.body?.profile;
    if (!userId || !profile) return res.status(400).json({ error: 'userId and profile are required' });
    await db.collection('profiles').doc(userId).set(
      {
        ...removeUndefinedDeep(profile),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error('profile put error', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
});

app.get('/api/workspace/:userId', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.params.userId || '');
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [profileSnap, appsSnap, docsSnap] = await Promise.all([
      db.collection('profiles').doc(userId).get(),
      db.collection('applications').where('userId', '==', userId).get(),
      db.collection('documents').where('userId', '==', userId).get()
    ]);

    const applications = appsSnap.docs
      .map((doc) => {
        const data = doc.data();
        const { userId: _userId, updatedAt: _updatedAt, createdAt: _createdAt, ...rest } = data;
        return rest;
      })
      .sort((a, b) => (b?.dateCreated || '').localeCompare(a?.dateCreated || ''));

    const documents = docsSnap.docs
      .map((doc) => {
        const data = doc.data();
        const { userId: _userId, updatedAt: _updatedAt, createdAt: _createdAt, ...rest } = data;
        return rest;
      })
      .sort((a, b) => (b?.dateAdded || '').localeCompare(a?.dateAdded || ''));

    if (!profileSnap.exists) {
      return res.json({ profile: null, applications, documents });
    }

    return res.json({
      profile: profileSnap.data(),
      applications,
      documents
    });
  } catch (error) {
    console.error('workspace get error', error);
    return res.status(500).json({ error: 'Failed to get workspace data' });
  }
});

app.put('/api/applications/sync/:userId', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.params.userId || '');
    const applications = Array.isArray(req.body?.applications) ? req.body.applications : null;
    if (!userId || !applications) return res.status(400).json({ error: 'userId and applications[] are required' });

    const existingSnap = await db.collection('applications').where('userId', '==', userId).get();
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const incomingIds = new Set();
    const nowIso = new Date().toISOString();
    const operations = [];

    applications.forEach((appItem) => {
      if (!appItem?.id) return;
      const appId = String(appItem.id);
      incomingIds.add(appId);
      const ref = db.collection('applications').doc(appId);
      operations.push({
        type: 'set',
        ref,
        data: {
          ...removeUndefinedDeep(appItem),
          userId,
          updatedAt: nowIso,
          createdAt: appItem?.dateCreated || nowIso
        },
        options: { merge: true }
      });
    });

    existingIds.forEach((existingId) => {
      if (incomingIds.has(existingId)) return;
      operations.push({
        type: 'delete',
        ref: db.collection('applications').doc(existingId)
      });
    });

    await chunkedBatchWrite(db, operations);
    return res.json({ ok: true, count: incomingIds.size });
  } catch (error) {
    console.error('applications sync error', error);
    return res.status(500).json({ error: 'Failed to sync applications' });
  }
});

app.put('/api/documents/sync/:userId', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.params.userId || '');
    const documents = Array.isArray(req.body?.documents) ? req.body.documents : null;
    if (!userId || !documents) return res.status(400).json({ error: 'userId and documents[] are required' });

    const existingSnap = await db.collection('documents').where('userId', '==', userId).get();
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const incomingIds = new Set();
    const nowIso = new Date().toISOString();
    const operations = [];

    documents.forEach((docItem) => {
      if (!docItem?.id) return;
      const docId = String(docItem.id);
      incomingIds.add(docId);
      const ref = db.collection('documents').doc(docId);
      operations.push({
        type: 'set',
        ref,
        data: {
          ...removeUndefinedDeep(docItem),
          userId,
          updatedAt: nowIso,
          createdAt: docItem?.dateAdded || nowIso
        },
        options: { merge: true }
      });
    });

    existingIds.forEach((existingId) => {
      if (incomingIds.has(existingId)) return;
      operations.push({
        type: 'delete',
        ref: db.collection('documents').doc(existingId)
      });
    });

    await chunkedBatchWrite(db, operations);
    return res.json({ ok: true, count: incomingIds.size });
  } catch (error) {
    console.error('documents sync error', error);
    return res.status(500).json({ error: 'Failed to sync documents' });
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.query.userId || '');
    const status = String(req.query.status || '');
    const q = String(req.query.q || '').toLowerCase().trim();
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let query = db.collection('applications').where('userId', '==', userId);
    if (status) query = query.where('status', '==', status);

    const snap = await query.get();
    let items = snap.docs.map((doc) => {
      const data = doc.data();
      const { userId: _userId, updatedAt: _updatedAt, createdAt: _createdAt, ...rest } = data;
      return rest;
    });

    if (q) {
      items = items.filter((item) => {
        const text = `${item.jobTitle || ''} ${item.companyName || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return res.json({ items });
  } catch (error) {
    console.error('applications list error', error);
    return res.status(500).json({ error: 'Failed to list applications' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.query.userId || '');
    const type = String(req.query.type || '');
    const q = String(req.query.q || '').toLowerCase().trim();
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let query = db.collection('documents').where('userId', '==', userId);
    if (type) query = query.where('type', '==', type);

    const snap = await query.get();
    let items = snap.docs.map((doc) => {
      const data = doc.data();
      const { userId: _userId, updatedAt: _updatedAt, createdAt: _createdAt, ...rest } = data;
      return rest;
    });

    if (q) {
      items = items.filter((item) => `${item.name || ''}`.toLowerCase().includes(q));
    }

    return res.json({ items });
  } catch (error) {
    console.error('documents list error', error);
    return res.status(500).json({ error: 'Failed to list documents' });
  }
});

// AI routes are served via the modular aiRoutes.mjs
app.use('/api/ai', aiRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');
const distIndexPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (_, res) => {
    res.sendFile(distIndexPath);
  });
}

app.listen(port, () => {
  console.log(`HUNJ server running on port ${port}`);
});
