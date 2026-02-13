
import React, { useState } from 'react';
import { BiasAnalysis } from '../types';
import { runBiasAudit } from '../services/geminiService';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2, Scale, Loader2, ArrowRight } from 'lucide-react';

interface BiasCheckerProps {
  analysis: BiasAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
  resume?: any; // To run audit if needed
}

const BiasChecker: React.FC<BiasCheckerProps> = ({ analysis, isLoading, onAnalyze, resume }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleAudit = async () => {
      if (!resume) return;
      setIsAuditing(true);
      try {
          const result = await runBiasAudit(resume);
          setAuditResult(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAuditing(false);
      }
  };

  return (
    <div className="bg-devops-800 border border-devops-700 rounded-xl p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-500" />
            Reliability & Bias
        </h3>
        <div className="flex gap-2">
            <button 
                onClick={handleAudit}
                disabled={isAuditing}
                className="text-xs bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/50 px-3 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isAuditing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Scale className="w-3 h-3"/>}
                Run Name-Swap Audit
            </button>
            <button 
                onClick={onAnalyze}
                disabled={isLoading}
                className="text-xs bg-devops-700 hover:bg-devops-600 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
            >
                {isLoading ? 'Scanning...' : 'Scan Language'}
            </button>
        </div>
      </div>

      {/* Name Swap Audit Result */}
      {auditResult && (
          <div className="mb-6 bg-devops-900/80 rounded-xl p-4 border border-devops-700 animate-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" /> Bias Stress Test Results
              </h4>
              <div className="flex items-center gap-8 mb-4">
                  <div className="text-center">
                      <div className="text-xs text-devops-400 uppercase">Original Score</div>
                      <div className="text-2xl font-bold text-white">{auditResult.originalScore}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-devops-600" />
                  <div className="text-center">
                      <div className="text-xs text-devops-400 uppercase">Blind Score</div>
                      <div className="text-2xl font-bold text-white">{auditResult.blindScore}</div>
                  </div>
                  <div className="ml-auto text-right">
                      <div className="text-xs text-devops-400 uppercase">Variance</div>
                      <div className={`text-xl font-bold ${auditResult.isBiased ? 'text-red-400' : 'text-green-400'}`}>
                          {auditResult.variance}%
                      </div>
                  </div>
              </div>
              <p className="text-xs text-devops-300 leading-relaxed border-t border-devops-700 pt-2 italic">
                  "{auditResult.reasoning}"
              </p>
          </div>
      )}

      {/* Existing Analysis */}
      {analysis && !isLoading && (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-devops-900/50 p-3 rounded-lg border border-devops-700">
                <div className={`text-2xl font-bold ${analysis.riskScore < 20 ? 'text-success' : 'text-warning'}`}>
                    {analysis.riskScore}%
                </div>
                <div>
                    <div className="text-xs text-devops-400 uppercase tracking-wide">Language Risk</div>
                    <div className="text-sm font-medium text-white">{analysis.overallAssessment}</div>
                </div>
            </div>
            {analysis.items.map((item, idx) => (
                <div key={idx} className="bg-devops-900/30 p-3 rounded border border-devops-700/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">{item.type}</span>
                        <span className="text-[10px] text-warning">{item.severity} Impact</span>
                    </div>
                    <p className="text-sm text-white font-mono bg-devops-950/50 p-1 rounded my-1">"{item.text}"</p>
                    <div className="flex items-center gap-1 text-xs text-success">
                        <Info className="w-3 h-3" />
                        <span>Try: "{item.suggestion}"</span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default BiasChecker;
