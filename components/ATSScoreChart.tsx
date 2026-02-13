
import React, { useState } from 'react';
import { ATSScore } from '../types';
import { AlertCircle, CheckCircle2, XCircle, Wand2, Loader2, Target, BarChart2, ShieldCheck, ListChecks } from 'lucide-react';

interface ATSScoreChartProps {
  score: ATSScore | null;
  isLoading: boolean;
  onApplySuggestion?: (suggestion: string) => void;
}

const ATSScoreChart: React.FC<ATSScoreChartProps> = ({ score, isLoading, onApplySuggestion }) => {
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);

  const handleApply = async (suggestion: string, index: number) => {
    if (onApplySuggestion) {
      setApplyingIdx(index);
      await onApplySuggestion(suggestion);
      setApplyingIdx(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-devops-400 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
        <p className="text-xs font-medium uppercase tracking-wider animate-pulse">Running Deep Analysis...</p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-devops-500 space-y-2">
        <BarChart2 className="w-10 h-10 opacity-20" />
        <p className="text-sm">No analysis data available yet.</p>
      </div>
    );
  }

  const getScoreColor = (val: number) => {
      if (val >= 85) return 'text-success bg-success/10 border-success/20';
      if (val >= 70) return 'text-warning bg-warning/10 border-warning/20';
      return 'text-danger bg-danger/10 border-danger/20';
  };

  const ScoreItem = ({ label, value, icon: Icon }: { label: string, value: number, icon: any }) => (
      <div className="flex items-center justify-between p-3 rounded-lg bg-devops-900/50 border border-devops-700/50">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${value >= 8 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-devops-200 font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-devops-800 rounded-full overflow-hidden">
                  <div 
                      className={`h-full rounded-full transition-all duration-1000 ${value >= 8 ? 'bg-success' : value >= 5 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${value * 10}%` }}
                  ></div>
              </div>
              <span className="text-xs font-bold text-white w-6 text-right">{value}/10</span>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
        {/* Main Score Card */}
        <div className={`relative p-6 rounded-2xl border ${getScoreColor(score.total)} transition-all duration-500`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">Overall Match</h3>
                    <div className="text-5xl font-extrabold tracking-tighter">
                        {score.total}%
                    </div>
                </div>
                <div className={`p-3 rounded-full ${score.total >= 80 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {score.total >= 80 ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
            </div>
            <div className="mt-4 text-xs font-medium opacity-70">
                {score.total >= 85 ? 'Excellent match. Ready for submission.' : 'Optimization needed. See breakdown below.'}
            </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2">
            <h4 className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-3">Diagnostic Report</h4>
            <ScoreItem label="Keywords" value={score.breakdown.keywords} icon={Target} />
            <ScoreItem label="Impact Metrics" value={score.breakdown.quantifiable} icon={BarChart2} />
            <ScoreItem label="Formatting" value={score.breakdown.format} icon={ListChecks} />
            <ScoreItem label="ATS Parsability" value={score.breakdown.structure} icon={ShieldCheck} />
        </div>

        {/* Action Plan */}
        <div className="bg-devops-800 border border-devops-700 rounded-xl p-4">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-accent-500" />
                Critical Fixes
            </h4>
            <div className="space-y-3">
                {score.suggestions.slice(0, 3).map((suggestion, i) => (
                    <div key={i} className="group p-3 bg-devops-900 border border-devops-700 rounded-lg hover:border-accent-500/50 transition-colors">
                        <p className="text-xs text-devops-200 mb-3 leading-relaxed">{suggestion}</p>
                        {onApplySuggestion && (
                            <button 
                                onClick={() => handleApply(suggestion, i)}
                                disabled={applyingIdx !== null}
                                className="w-full py-1.5 flex items-center justify-center gap-2 bg-accent-600/10 hover:bg-accent-600 text-accent-400 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-50"
                            >
                                {applyingIdx === i ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                {applyingIdx === i ? 'Fixing...' : 'Auto-Fix'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ATSScoreChart;
