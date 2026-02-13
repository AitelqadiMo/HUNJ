
import React, { useState, useEffect } from 'react';
import { JobAnalysis, SalaryInsight } from '../types';
import { analyzeSalary } from '../services/geminiService';
import { DollarSign, TrendingUp, TrendingDown, Minus, Copy, Check, Loader2, MessageSquare, BarChart3 } from 'lucide-react';

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

  const formatCurrency = (val: number, curr: string) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-devops-400 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <p className="text-sm font-medium">Accessing compensation database...</p>
          </div>
      );
  }

  if (!insight) return null;

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
        <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Compensation Intelligence</h2>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-devops-800 border border-devops-700 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
                    <p className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-3">Estimated Range</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-bold text-white tracking-tighter">
                            {formatCurrency(insight.estimatedRange.min, insight.estimatedRange.currency)}
                        </span>
                        <span className="text-devops-600 text-2xl font-light">/</span>
                        <span className="text-3xl lg:text-4xl font-bold text-white tracking-tighter">
                            {formatCurrency(insight.estimatedRange.max, insight.estimatedRange.currency)}
                        </span>
                    </div>
                    <p className="text-[10px] text-devops-500 mt-2">Base salary excl. equity/bonuses</p>
                </div>

                <div className="bg-devops-800 border border-devops-700 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <p className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-3">Market Demand</p>
                    <div className={`flex items-center gap-2 text-2xl font-bold mb-1 ${
                        insight.marketTrend === 'High Demand' ? 'text-green-400' : 
                        insight.marketTrend === 'Stable' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                        {insight.marketTrend === 'High Demand' && <TrendingUp className="w-6 h-6" />}
                        {insight.marketTrend === 'Stable' && <Minus className="w-6 h-6" />}
                        {insight.marketTrend === 'Low Demand' && <TrendingDown className="w-6 h-6" />}
                        {insight.marketTrend}
                    </div>
                    <p className="text-[10px] text-devops-500">Based on recent role volume</p>
                </div>
            </div>

            {/* Analysis */}
            <div className="bg-devops-900/50 border border-devops-800 rounded-xl p-5">
                 <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-devops-400" /> Context
                 </h3>
                 <p className="text-sm text-devops-300 leading-relaxed">{insight.reasoning}</p>
            </div>

            {/* Negotiation */}
            <div>
                <h3 className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-4">Leverage Points</h3>
                <div className="space-y-2">
                    {insight.negotiationTips.map((tip, i) => (
                        <div key={i} className="flex gap-3 bg-devops-800/50 p-3 rounded-xl border border-devops-700/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                            <p className="text-sm text-devops-200">{tip}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scripts */}
            <div>
                <h3 className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-4">Verbal Scripts</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="group relative bg-devops-900 border border-devops-700 rounded-xl p-5 hover:border-green-500/30 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-white">Initial Screen</h4>
                            <button onClick={() => copyToClipboard(insight.scripts.screening, 's1')} className="text-xs text-devops-400 hover:text-white flex items-center gap-1">
                                {copied === 's1' ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>} Copy
                            </button>
                        </div>
                        <p className="text-sm text-devops-300 italic font-serif">"{insight.scripts.screening}"</p>
                    </div>
                    
                    <div className="group relative bg-devops-900 border border-devops-700 rounded-xl p-5 hover:border-green-500/30 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-white">Counter Offer</h4>
                            <button onClick={() => copyToClipboard(insight.scripts.counterOffer, 's2')} className="text-xs text-devops-400 hover:text-white flex items-center gap-1">
                                {copied === 's2' ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>} Copy
                            </button>
                        </div>
                        <p className="text-sm text-devops-300 italic font-serif">"{insight.scripts.counterOffer}"</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SalaryInsights;
