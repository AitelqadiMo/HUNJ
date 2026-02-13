
import React from 'react';
import { SkillMatch } from '../types';
import { Check, X, AlertTriangle, Layers, ArrowUpRight } from 'lucide-react';

interface SkillsMatcherProps {
  matches: SkillMatch[];
  isLoading: boolean;
}

const SkillsMatcher: React.FC<SkillsMatcherProps> = ({ matches, isLoading }) => {
  if (isLoading) return <div className="text-xs text-devops-400 p-4 animate-pulse">Running gap analysis...</div>;
  if (!matches.length) return null;

  const acquired = matches.filter(m => m.status === 'match');
  const missing = matches.filter(m => m.status === 'missing');
  const partial = matches.filter(m => m.status === 'partial');
  
  const total = matches.length;
  const score = Math.round(((acquired.length + (partial.length * 0.5)) / total) * 100);

  return (
    <div className="bg-devops-800 border border-devops-700 rounded-xl p-5 mt-6">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-hunj-500" /> Skill Audit
          </h3>
          <span className={`text-sm font-bold ${score > 80 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {score}% Coverage
          </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-devops-950 rounded-full overflow-hidden mb-6 flex">
          <div className="bg-green-500 h-full" style={{ width: `${(acquired.length / total) * 100}%` }}></div>
          <div className="bg-yellow-500 h-full" style={{ width: `${(partial.length / total) * 100}%` }}></div>
          <div className="bg-red-500/30 h-full flex-1"></div>
      </div>

      <div className="space-y-5">
          {/* Acquired */}
          {acquired.length > 0 && (
              <div>
                  <div className="text-[10px] text-devops-400 uppercase font-bold mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Acquired Assets
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                      {acquired.map((m, i) => (
                          <span key={i} className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[10px] font-bold flex items-center gap-1">
                              {m.skill} <Check className="w-2.5 h-2.5" />
                          </span>
                      ))}
                  </div>
              </div>
          )}

          {/* Missing */}
          {missing.length > 0 && (
              <div>
                  <div className="text-[10px] text-devops-400 uppercase font-bold mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Critical Gaps
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                      {missing.map((m, i) => (
                          <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-bold flex items-center gap-1 group cursor-help">
                              {m.skill}
                          </span>
                      ))}
                  </div>
                  <p className="text-[10px] text-devops-500 mt-2 italic">
                      Add experience with these keywords to boost ATS score by ~15%.
                  </p>
              </div>
          )}
      </div>
    </div>
  );
};

export default SkillsMatcher;
