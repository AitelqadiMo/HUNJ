import React, { useState } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ATSScore } from '../types';
import { AlertCircle, CheckCircle2, XCircle, Wand2, Loader2 } from 'lucide-react';

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
      <div className="h-full flex flex-col items-center justify-center text-devops-400 animate-pulse py-12">
        <div className="w-24 h-24 rounded-full border-4 border-devops-700 border-t-accent-500 animate-spin mb-4"></div>
        <p>Calculating ATS Score...</p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="h-full flex items-center justify-center text-devops-500 py-12">
        <p>No analysis yet</p>
      </div>
    );
  }

  const data = [
    { name: 'Score', value: score.total, fill: score.total >= 80 ? '#22c55e' : score.total >= 60 ? '#eab308' : '#ef4444' }
  ];

  const getColor = (val: number) => {
      if (val >= 80) return 'text-success';
      if (val >= 60) return 'text-warning';
      return 'text-danger';
  };

  return (
    <div className="bg-devops-800 border border-devops-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">ATS Compatibility</h3>
        {score.total >= 80 && <CheckCircle2 className="text-success w-5 h-5" />}
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="80%" 
              outerRadius="100%" 
              barSize={10} 
              data={data} 
              startAngle={90} 
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={30 / 2}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getColor(score.total)}`}>{score.total}</span>
            <span className="text-xs text-devops-400">/ 100</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          {Object.entries(score.breakdown).slice(0, 5).map(([key, value]) => {
            const val = value as number;
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-devops-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex items-center gap-3 w-1/2">
                  <div className="h-2 bg-devops-900 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${val >= 8 ? 'bg-success' : val >= 5 ? 'bg-warning' : 'bg-danger'}`} 
                      style={{ width: `${(val / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-6 text-right font-mono text-devops-100">{val}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-devops-700 pt-4">
        <h4 className="text-sm font-medium text-devops-300 mb-3 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-accent-500" />
            AI Improvement Plan
        </h4>
        <div className="space-y-2">
            {score.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-3 bg-devops-900/50 p-3 rounded-lg border border-devops-700/50 group hover:border-accent-500/50 transition-colors">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-devops-200 mb-2">{suggestion}</p>
                        {onApplySuggestion && (
                            <button 
                                onClick={() => handleApply(suggestion, i)}
                                disabled={applyingIdx !== null}
                                className="text-[10px] font-medium bg-accent-600/20 hover:bg-accent-600 text-accent-400 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                                {applyingIdx === i ? (
                                    <><Loader2 className="w-3 h-3 animate-spin"/> Applying...</>
                                ) : (
                                    <><Wand2 className="w-3 h-3"/> Fix for me</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ATSScoreChart;