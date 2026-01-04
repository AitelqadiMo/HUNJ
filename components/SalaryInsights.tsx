import React, { useState, useEffect } from 'react';
import { JobAnalysis, SalaryInsight } from '../types';
import { analyzeSalary } from '../services/geminiService';
import { DollarSign, TrendingUp, TrendingDown, Minus, Copy, Check, Loader2, MessageSquare } from 'lucide-react';

interface SalaryInsightsProps {
  job: JobAnalysis;
  insight: SalaryInsight | null | undefined;
  onUpdate: (insight: SalaryInsight) => void;
}

const SalaryInsights: React.FC<SalaryInsightsProps> = ({ job, insight, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!insight && !isLoading) {
        fetchInsight();
    }
  }, []);

  const fetchInsight = async () => {
    setIsLoading(true);
    try {
        const result = await analyzeSalary(job);
        onUpdate(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-devops-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent-500" />
              <p>Analyzing market data for {job.title}...</p>
          </div>
      );
  }

  if (!insight) return null;

  const formatCurrency = (val: number, curr: string) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10">
        <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-500" />
                Salary & Market Intelligence
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Range Card */}
                <div className="md:col-span-2 bg-devops-900/50 rounded-lg p-6 border border-devops-700 flex flex-col justify-center">
                    <p className="text-sm text-devops-400 mb-2 uppercase tracking-wide">Estimated Annual Salary</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">
                            {formatCurrency(insight.estimatedRange.min, insight.estimatedRange.currency)}
                        </span>
                        <span className="text-devops-500 text-2xl mb-1">-</span>
                        <span className="text-4xl font-bold text-white">
                            {formatCurrency(insight.estimatedRange.max, insight.estimatedRange.currency)}
                        </span>
                    </div>
                    <p className="text-xs text-devops-500 mt-2 italic">
                        *Estimated based on {job.title} roles in {job.location || 'this market'}.
                    </p>
                </div>

                {/* Trend Card */}
                <div className="bg-devops-900/50 rounded-lg p-6 border border-devops-700 flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-devops-400 mb-2 uppercase tracking-wide">Market Demand</p>
                    {insight.marketTrend === 'High Demand' && <TrendingUp className="w-10 h-10 text-success mb-2" />}
                    {insight.marketTrend === 'Stable' && <Minus className="w-10 h-10 text-warning mb-2" />}
                    {insight.marketTrend === 'Low Demand' && <TrendingDown className="w-10 h-10 text-danger mb-2" />}
                    <span className={`font-bold text-lg ${
                        insight.marketTrend === 'High Demand' ? 'text-success' : 
                        insight.marketTrend === 'Stable' ? 'text-warning' : 'text-danger'
                    }`}>
                        {insight.marketTrend}
                    </span>
                </div>
            </div>

            <div className="mb-6">
                 <h3 className="text-sm font-bold text-white mb-2">Market Analysis</h3>
                 <p className="text-sm text-devops-300 leading-relaxed">{insight.reasoning}</p>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-2">Negotiation Strategy</h3>
                <ul className="space-y-2">
                    {insight.negotiationTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-devops-200">
                            <span className="text-accent-500 font-bold">•</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Scripts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 relative group">
                <div className="flex items-center gap-2 mb-4 text-devops-100">
                    <MessageSquare className="w-4 h-4 text-accent-500" />
                    <h3 className="font-bold text-sm uppercase">Screening Call Script</h3>
                </div>
                <div className="bg-devops-900 rounded p-4 text-sm text-devops-300 italic">
                    "{insight.scripts.screening}"
                </div>
                <button 
                    onClick={() => copyToClipboard(insight.scripts.screening, 'screening')}
                    className="absolute top-4 right-4 p-2 text-devops-400 hover:text-white bg-devops-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {copied === 'screening' ? <Check className="w-4 h-4 text-success"/> : <Copy className="w-4 h-4"/>}
                </button>
            </div>

            <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 relative group">
                <div className="flex items-center gap-2 mb-4 text-devops-100">
                    <MessageSquare className="w-4 h-4 text-accent-500" />
                    <h3 className="font-bold text-sm uppercase">Counter-Offer Script</h3>
                </div>
                <div className="bg-devops-900 rounded p-4 text-sm text-devops-300 italic">
                    "{insight.scripts.counterOffer}"
                </div>
                <button 
                    onClick={() => copyToClipboard(insight.scripts.counterOffer, 'counter')}
                    className="absolute top-4 right-4 p-2 text-devops-400 hover:text-white bg-devops-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {copied === 'counter' ? <Check className="w-4 h-4 text-success"/> : <Copy className="w-4 h-4"/>}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SalaryInsights;