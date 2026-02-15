import React from 'react';
import { BillingState, SubscriptionTier } from '../types';
import { Check, Crown, Users, X } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (tier: SubscriptionTier) => void;
  onRefreshSubscription: () => Promise<void>;
  onCancelSubscription: (immediate?: boolean) => Promise<void>;
  onReactivateSubscription: () => Promise<void>;
  billing: BillingState;
  effectivePlan: SubscriptionTier;
  isBillingActionLoading?: boolean;
  reason?: string;
}

const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onCheckout,
  onRefreshSubscription,
  onCancelSubscription,
  onReactivateSubscription,
  billing,
  effectivePlan,
  isBillingActionLoading,
  reason
}) => {
  if (!isOpen) return null;
  const isPaidPlan = effectivePlan !== 'free';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upgrade To Unlock Premium</h2>
            <p className="text-sm text-slate-500">{reason || 'Advanced AI tools and premium workflows are part of Pro plans.'}</p>
            <p className="text-xs text-slate-400 mt-1">Checkout opens Stripe. After payment, click refresh to sync your plan from the backend.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">
            Plan: {effectivePlan.toUpperCase()}
          </span>
          <span className="px-2 py-1 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">
            Status: {billing.status}
          </span>
          {billing.renewsAt && (
            <span className="px-2 py-1 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">
              Renews: {new Date(billing.renewsAt).toLocaleDateString()}
            </span>
          )}
          {billing.cancelAtPeriodEnd && (
            <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 font-semibold text-amber-700">
              Canceling at period end
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {isPaidPlan && !billing.cancelAtPeriodEnd && (
              <button
                onClick={() => onCancelSubscription(false)}
                disabled={isBillingActionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
              >
                Cancel At Period End
              </button>
            )}
            {isPaidPlan && billing.cancelAtPeriodEnd && (
              <button
                onClick={onReactivateSubscription}
                disabled={isBillingActionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Reactivate
              </button>
            )}
            {isPaidPlan && (
              <button
                onClick={() => onCancelSubscription(true)}
                disabled={isBillingActionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Cancel Now
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50">
          <PlanCard
            title="Free"
            price="$0"
            subtitle="Great for trying the platform"
            features={[
              'Resume editor + preview',
              'Basic ATS insights',
              'Limited daily AI usage',
              'Up to 5 applications',
            ]}
            cta="Current"
            muted
            onCheckout={() => onClose()}
          />
          <PlanCard
            title="Pro"
            price="$19/mo"
            subtitle="For serious job seekers"
            features={[
              'Interview simulator',
              'Cover letter generator',
              'Salary + networking intelligence',
              'LinkedIn optimizer',
              'Higher AI limits',
            ]}
            cta="Upgrade To Pro"
            highlighted
            onCheckout={() => onCheckout('pro')}
            onRefreshSubscription={onRefreshSubscription}
          />
          <PlanCard
            title="Team"
            price="$49/mo"
            subtitle="For agencies and career teams"
            features={[
              'Everything in Pro',
              'Team-ready workflows',
              'Priority support',
              'Shared playbooks',
            ]}
            cta="Upgrade To Team"
            onCheckout={() => onCheckout('team')}
            onRefreshSubscription={onRefreshSubscription}
          />
        </div>
      </div>
    </div>
  );
};

interface PlanCardProps {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  cta: string;
  onCheckout: () => void;
  onRefreshSubscription?: () => Promise<void>;
  highlighted?: boolean;
  muted?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ title, price, subtitle, features, cta, onCheckout, onRefreshSubscription, highlighted, muted }) => (
  <div
    className={`rounded-2xl border p-5 flex flex-col ${
      highlighted
        ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
        : muted
        ? 'bg-white border-slate-200 text-slate-700'
        : 'bg-white border-slate-200 text-slate-800'
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-bold">{title}</h3>
      {highlighted ? <Crown className="w-4 h-4 text-amber-300" /> : <Users className="w-4 h-4 opacity-60" />}
    </div>
    <div className="text-3xl font-extrabold tracking-tight mb-1">{price}</div>
    <p className={`text-xs mb-4 ${highlighted ? 'text-slate-300' : 'text-slate-500'}`}>{subtitle}</p>

    <div className="space-y-2 flex-1">
      {features.map(item => (
        <div key={item} className="flex items-start gap-2 text-sm">
          <Check className={`w-4 h-4 mt-0.5 ${highlighted ? 'text-emerald-300' : 'text-emerald-500'}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onCheckout}
      className={`mt-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
        highlighted
          ? 'bg-white text-slate-900 hover:bg-slate-100'
          : muted
          ? 'bg-slate-100 text-slate-500 cursor-default'
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
      disabled={muted}
    >
      {cta}
    </button>

    {!muted && onRefreshSubscription && (
      <button
        onClick={onRefreshSubscription}
        className="mt-2 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Refresh Subscription
      </button>
    )}
  </div>
);

export default PricingModal;
