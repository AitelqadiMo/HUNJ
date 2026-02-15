import { BillingState, SubscriptionTier, User } from '../types';

const API_BASE = (import.meta as any)?.env?.VITE_BILLING_API_BASE || 'http://localhost:8787';

interface SubscriptionStatusResponse {
  userId: string;
  email: string;
  plan: SubscriptionTier;
  status: BillingState['status'];
  renewsAt?: string;
  customerId?: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
}

export const billingService = {
  async syncSubscription(user: User): Promise<BillingState | null> {
    try {
      const response = await fetch(
        `${API_BASE}/api/billing/status?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`,
        { method: 'GET' }
      );
      if (!response.ok) return null;
      const data = (await response.json()) as SubscriptionStatusResponse;
      return {
        plan: data.plan || 'free',
        status: data.status || 'active',
        renewsAt: data.renewsAt,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        canceledAt: data.canceledAt
      };
    } catch {
      return null;
    }
  },

  async openCheckout(user: User, tier: SubscriptionTier): Promise<void> {
    const fallbackLink = 'https://buy.stripe.com/test_cNi28ra0n5LQbSM44K8N200';
    try {
      const response = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          tier,
          successUrl: window.location.origin,
          cancelUrl: window.location.origin
        })
      });

      if (response.ok) {
        const data = (await response.json()) as { url?: string };
        if (data.url) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
          return;
        }
      }
    } catch {
      // fallback below
    }

    window.open(`${fallbackLink}?prefilled_email=${encodeURIComponent(user.email)}`, '_blank', 'noopener,noreferrer');
  },

  async cancelSubscription(user: User, immediate = false): Promise<BillingState | null> {
    try {
      const response = await fetch(`${API_BASE}/api/billing/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          immediate
        })
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { billing?: BillingState };
      return data.billing || null;
    } catch {
      return null;
    }
  },

  async reactivateSubscription(user: User): Promise<BillingState | null> {
    try {
      const response = await fetch(`${API_BASE}/api/billing/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email
        })
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { billing?: BillingState };
      return data.billing || null;
    } catch {
      return null;
    }
  }
};
