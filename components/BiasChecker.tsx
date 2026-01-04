import React from 'react';
import { BiasAnalysis } from '../types';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface BiasCheckerProps {
  analysis: BiasAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

const BiasChecker: React.FC<BiasCheckerProps> = ({ analysis, isLoading, onAnalyze }) => {
  return (
    <div className="bg-devops-800 border border-devops-700 rounded-xl p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-500" />
            Reliability & Bias
        </h3>
        <button 
            onClick={onAnalyze}
            disabled={isLoading}
            className="text-xs bg-devops-700 hover:bg-devops-600 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
            {isLoading ? 'Scanning...' : 'Scan for Bias'}
        </button>
      </div>

      {!analysis && !isLoading && (
          <div className="text-center py-6 text-devops-400 text-sm">
              <p>Scan your resume for unconscious bias, gendered language, or ageism markers.</p>
          </div>
      )}

      {isLoading && (
        <div className="h-24 flex flex-col items-center justify-center text-devops-400 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-devops-600 border-t-accent-500 animate-spin mb-2"></div>
            <p className="text-xs">Analyzing language patterns...</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-4 bg-devops-900/50 p-3 rounded-lg border border-devops-700">
                <div className={`text-2xl font-bold ${
                    analysis.riskScore < 20 ? 'text-success' : 
                    analysis.riskScore < 50 ? 'text-warning' : 'text-danger'
                }`}>
                    {analysis.riskScore}%
                </div>
                <div>
                    <div className="text-xs text-devops-400 uppercase tracking-wide">Bias Risk Score</div>
                    <div className="text-sm font-medium text-white">{analysis.overallAssessment}</div>
                </div>
            </div>

            {/* Items */}
            {analysis.items.length === 0 ? (
                <div className="flex items-center gap-2 text-success text-sm p-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Great job! No significant bias markers detected.</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {analysis.items.map((item, idx) => (
                        <div key={idx} className="bg-devops-900/30 p-3 rounded border border-devops-700/50">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    item.type === 'Gender' ? 'bg-purple-500/20 text-purple-300' :
                                    item.type === 'Age' ? 'bg-orange-500/20 text-orange-300' :
                                    'bg-blue-500/20 text-blue-300'
                                }`}>
                                    {item.type}
                                </span>
                                <span className={`text-[10px] ${
                                    item.severity === 'High' ? 'text-danger' : 'text-warning'
                                }`}>{item.severity} Impact</span>
                            </div>
                            <p className="text-sm text-white font-mono bg-devops-950/50 p-1 rounded my-1">"{item.text}"</p>
                            <p className="text-xs text-devops-300 mb-1">{item.explanation}</p>
                            <div className="flex items-center gap-1 text-xs text-success">
                                <Info className="w-3 h-3" />
                                <span>Try: "{item.suggestion}"</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-devops-700 text-[10px] text-devops-500 text-justify leading-tight">
                <p>
                    <strong>Reliability Note:</strong> AI models can hallucinate or reflect training data biases. 
                    This tool uses specific constraints to minimize bias, but human review is always recommended. 
                    We employ adversarial debiasing techniques in our prompts to ensure fair evaluation across demographics.
                </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default BiasChecker;