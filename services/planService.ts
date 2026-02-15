import { BillingState, SubscriptionTier, UsageStats } from '../types';

export type PremiumFeature =
  | 'interview'
  | 'cover-letter'
  | 'networking'
  | 'salary'
  | 'linkedin'
  | 'bias-audit';

export const PLAN_LABEL: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
};

export const FEATURE_PLAN_REQUIREMENT: Record<PremiumFeature, SubscriptionTier> = {
  interview: 'pro',
  'cover-letter': 'pro',
  networking: 'pro',
  salary: 'pro',
  linkedin: 'pro',
  'bias-audit': 'pro',
};

const tierRank: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

export const hasPlanAccess = (plan: SubscriptionTier, required: SubscriptionTier): boolean => {
  return tierRank[plan] >= tierRank[required];
};

export const hasFeatureAccess = (plan: SubscriptionTier, feature: PremiumFeature): boolean => {
  return hasPlanAccess(plan, FEATURE_PLAN_REQUIREMENT[feature]);
};

export const getEffectivePlan = (billing: BillingState): SubscriptionTier => {
  if (!billing || billing.plan === 'free') return 'free';
  const now = Date.now();
  const renewsAtTs = billing.renewsAt ? Date.parse(billing.renewsAt) : NaN;
  const withinGrace = Number.isFinite(renewsAtTs) && renewsAtTs > now;
  const entitledStatus = billing.status === 'active' || billing.status === 'trialing' || billing.status === 'past_due';
  if (entitledStatus || withinGrace) return billing.plan;
  return 'free';
};

export const getTodayKey = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const ensureDailyUsage = (usage?: UsageStats): UsageStats => {
  const today = getTodayKey();
  if (!usage || usage.dayKey !== today) {
    return {
      dayKey: today,
      aiActions: 0,
      resumesGenerated: 0,
      jobSearches: 0,
    };
  }
  return usage;
};

export const FREE_LIMITS = {
  maxApplications: 5,
  aiActionsPerDay: 20,
  resumesGeneratedPerDay: 5,
  jobSearchesPerDay: 10,
};
