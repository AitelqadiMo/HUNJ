import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { initFirestore } from './firestore.mjs';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = Number(process.env.BILLING_PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripePricePro = process.env.STRIPE_PRICE_PRO || '';
const stripePriceTeam = process.env.STRIPE_PRICE_TEAM || '';
const stripePaymentLink = process.env.STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test_cNi28ra0n5LQbSM44K8N200';

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey);

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use((req, res, next) => {
  if (req.path === '/api/billing/webhook') return next();
  return express.json({ limit: '4mb' })(req, res, next);
});

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'billing-api' });
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

const mapStripeStatusToBillingStatus = (status) => {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due') return 'past_due';
  return 'canceled';
};

const inferPlanFromPrice = (priceId, status) => {
  if (priceId && stripePriceTeam && priceId === stripePriceTeam) return 'team';
  if (priceId && stripePricePro && priceId === stripePricePro) return 'pro';
  if (status === 'active' || status === 'trialing') return 'pro';
  return 'free';
};

const mapSubscriptionToBilling = (sub, fallbackPlan = 'pro') => {
  const status = mapStripeStatusToBillingStatus(sub?.status);
  const priceId = sub?.items?.data?.[0]?.price?.id || '';
  const plan = inferPlanFromPrice(priceId, status) || fallbackPlan;
  return {
    plan,
    status,
    customerId: sub?.customer || '',
    subscriptionId: sub?.id || '',
    cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    renewsAt: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
    canceledAt: sub?.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : undefined,
    updatedAt: new Date().toISOString()
  };
};

const getLatestSubscriptionForCustomer = async (customerId) => {
  if (!customerId) return null;
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20
  });
  if (!subs.data.length) return null;
  const rankedStatuses = ['active', 'trialing', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired'];
  const sorted = [...subs.data].sort((a, b) => {
    const aRank = rankedStatuses.indexOf(a.status);
    const bRank = rankedStatuses.indexOf(b.status);
    if (aRank !== bRank) return aRank - bRank;
    return (b.created || 0) - (a.created || 0);
  });
  return sorted[0] || null;
};

const resolveCustomerEmail = async (customerId) => {
  if (!customerId) return '';
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      return customer.email || '';
    }
  } catch (e) {
    console.error('Failed to resolve customer email', e);
  }
  return '';
};

const ensureUserDoc = async (db, { userId, email, name }) => {
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set(
      {
        userId,
        email,
        name: name || '',
        billing: { plan: 'free', status: 'active' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } else {
    await ref.set({ email, name: name || '', updatedAt: new Date().toISOString() }, { merge: true });
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

app.post('/api/billing/checkout', express.json(), async (req, res) => {
  try {
    const db = initFirestore();
    const { userId, email, name, tier, successUrl, cancelUrl } = req.body || {};

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const userRef = await ensureUserDoc(db, { userId, email, name });
    const userSnap = await userRef.get();
    const user = userSnap.data() || {};

    let customerId = user?.billing?.customerId || '';
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: { userId }
      });
      customerId = customer.id;
    }

    let sessionUrl = '';
    if ((tier === 'pro' && stripePricePro) || (tier === 'team' && stripePriceTeam)) {
      const price = tier === 'team' ? stripePriceTeam : stripePricePro;
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price, quantity: 1 }],
        success_url: successUrl || frontendOrigin,
        cancel_url: cancelUrl || frontendOrigin,
        allow_promotion_codes: true,
        metadata: { userId, tier }
      });
      sessionUrl = session.url || '';
    } else {
      sessionUrl = `${stripePaymentLink}?prefilled_email=${encodeURIComponent(email)}`;
    }

    await userRef.set(
      {
        billing: {
          ...(user.billing || {}),
          customerId,
          checkoutTier: tier || 'pro',
          updatedAt: new Date().toISOString()
        }
      },
      { merge: true }
    );

    return res.json({ url: sessionUrl });
  } catch (error) {
    console.error('checkout error', error);
    return res.status(500).json({ error: 'Failed to start checkout' });
  }
});

app.get('/api/billing/status', async (req, res) => {
  try {
    const db = initFirestore();
    const userId = String(req.query.userId || '');
    const email = String(req.query.email || '');

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const userRef = await ensureUserDoc(db, { userId, email, name: '' });
    const snap = await userRef.get();
    const user = snap.data() || {};
    const billing = user.billing || { plan: 'free', status: 'active' };

    return res.json({
      userId,
      email,
      plan: billing.plan || 'free',
      status: billing.status || 'active',
      renewsAt: billing.renewsAt || undefined,
      customerId: billing.customerId || undefined,
      subscriptionId: billing.subscriptionId || undefined,
      cancelAtPeriodEnd: Boolean(billing.cancelAtPeriodEnd),
      canceledAt: billing.canceledAt || undefined
    });
  } catch (error) {
    console.error('status error', error);
    return res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

app.post('/api/billing/cancel', async (req, res) => {
  try {
    const db = initFirestore();
    const { userId, email, immediate } = req.body || {};
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const userRef = await ensureUserDoc(db, { userId, email, name: '' });
    const userSnap = await userRef.get();
    const user = userSnap.data() || {};
    const customerId = user?.billing?.customerId || '';
    if (!customerId) {
      return res.status(404).json({ error: 'No active Stripe customer found for this account' });
    }

    const sub = await getLatestSubscriptionForCustomer(customerId);
    if (!sub) {
      await userRef.set(
        { billing: { ...(user.billing || {}), plan: 'free', status: 'canceled', updatedAt: new Date().toISOString() } },
        { merge: true }
      );
      return res.json({ ok: true, billing: { ...(user.billing || {}), plan: 'free', status: 'canceled' } });
    }

    let updatedSub;
    if (immediate) {
      updatedSub = await stripe.subscriptions.cancel(sub.id);
    } else {
      updatedSub = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    }

    const nextBilling = mapSubscriptionToBilling(updatedSub, user?.billing?.plan || 'pro');
    await userRef.set({ billing: nextBilling }, { merge: true });
    return res.json({ ok: true, billing: nextBilling });
  } catch (error) {
    console.error('cancel subscription error', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

app.post('/api/billing/reactivate', async (req, res) => {
  try {
    const db = initFirestore();
    const { userId, email } = req.body || {};
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const userRef = await ensureUserDoc(db, { userId, email, name: '' });
    const userSnap = await userRef.get();
    const user = userSnap.data() || {};
    const customerId = user?.billing?.customerId || '';
    if (!customerId) {
      return res.status(404).json({ error: 'No active Stripe customer found for this account' });
    }

    const sub = await getLatestSubscriptionForCustomer(customerId);
    if (!sub) {
      return res.status(404).json({ error: 'No subscription found for this account' });
    }

    if (sub.status === 'canceled') {
      return res.status(400).json({ error: 'Subscription is fully canceled. Start a new checkout to subscribe again.' });
    }

    const updatedSub = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
    const nextBilling = mapSubscriptionToBilling(updatedSub, user?.billing?.plan || 'pro');
    await userRef.set({ billing: nextBilling }, { merge: true });
    return res.json({ ok: true, billing: nextBilling });
  } catch (error) {
    console.error('reactivate subscription error', error);
    return res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    const signature = req.headers['stripe-signature'];
    if (!stripeWebhookSecret || !signature) {
      return res.status(400).send('Webhook secret/signature missing');
    }
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
  } catch (err) {
    console.error('Webhook verify failed', err);
    return res.status(400).send('Invalid signature');
  }

  try {
    const db = initFirestore();
    const subscriptions = db.collection('subscriptions');
    const users = db.collection('users');

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session?.metadata?.userId || '';
      const customerId = session.customer || '';
      const subscriptionId = session.subscription || '';
      const email = session?.customer_details?.email || '';
      const checkoutTier = session?.metadata?.tier || 'pro';

      if (userId) {
        await users.doc(userId).set(
          {
            email,
            billing: {
              plan: checkoutTier,
              status: 'active',
              customerId,
              subscriptionId,
              cancelAtPeriodEnd: false,
              updatedAt: new Date().toISOString()
            }
          },
          { merge: true }
        );
      } else if (email) {
        const snap = await users.where('email', '==', email).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          await doc.ref.set(
            {
              billing: {
                plan: checkoutTier,
                status: 'active',
                customerId,
                subscriptionId,
                cancelAtPeriodEnd: false,
                updatedAt: new Date().toISOString()
              }
            },
            { merge: true }
          );
        }
      }

      await subscriptions.doc(session.id).set(
        {
          id: session.id,
          eventType: event.type,
          customerId,
          subscriptionId,
          email,
          userId,
          plan: checkoutTier,
          createdAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object;
      const customerId = sub.customer || '';
      const status = mapStripeStatusToBillingStatus(sub.status);
      const priceId = sub?.items?.data?.[0]?.price?.id || '';
      const plan = inferPlanFromPrice(priceId, status);
      const email = await resolveCustomerEmail(customerId);
      const cancelAtPeriodEnd = Boolean(sub?.cancel_at_period_end);
      const canceledAt = sub?.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : undefined;

      let userDocRef = null;
      const byCustomerSnap = await users.where('billing.customerId', '==', customerId).limit(1).get();
      if (!byCustomerSnap.empty) {
        userDocRef = byCustomerSnap.docs[0].ref;
      } else if (email) {
        const byEmailSnap = await users.where('email', '==', email).limit(1).get();
        if (!byEmailSnap.empty) {
          userDocRef = byEmailSnap.docs[0].ref;
        }
      }

      if (userDocRef) {
        const current = (await userDocRef.get()).data() || {};
        await userDocRef.set(
          {
            email: email || current.email || '',
            billing: {
              ...(current.billing || {}),
              plan,
              status,
              customerId: customerId || current?.billing?.customerId,
              subscriptionId: sub?.id || current?.billing?.subscriptionId,
              cancelAtPeriodEnd,
              renewsAt: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
              canceledAt,
              updatedAt: new Date().toISOString()
            }
          },
          { merge: true }
        );
      }

      await subscriptions.doc(sub.id).set(
        {
          id: sub.id,
          eventType: event.type,
          customerId,
          email,
          plan,
          status,
          cancelAtPeriodEnd,
          canceledAt: canceledAt || null,
          currentPeriodEnd: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.listen(port, () => {
  console.log(`Billing server running at http://localhost:${port}`);
});
