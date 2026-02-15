import React from 'react';
import { SubscriptionTier, UsageStats } from '../types';
import { FREE_LIMITS } from '../services/planService';

interface UsageMeterProps {
  plan: SubscriptionTier;
  usage: UsageStats;
}

const meterClass = (pct: number) =>
  pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';

const UsageMeter: React.FC<UsageMeterProps> = ({ plan, usage }) => {
  if (plan !== 'free') {
    return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Unlimited AI</span>;
  }

  const aiPct = Math.min(100, Math.round((usage.aiActions / FREE_LIMITS.aiActionsPerDay) * 100));

  return (
    <div className="hidden xl:flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
      <span className="font-bold text-slate-500 uppercase tracking-wide">AI Quota</span>
      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${meterClass(aiPct)}`} style={{ width: `${aiPct}%` }} />
      </div>
      <span className="font-bold text-slate-700">{usage.aiActions}/{FREE_LIMITS.aiActionsPerDay}</span>
    </div>
  );
};

export default UsageMeter;
