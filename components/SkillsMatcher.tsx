import React from 'react';
import { SkillMatch } from '../types';
import { Check, X, AlertTriangle } from 'lucide-react';

interface SkillsMatcherProps {
  matches: SkillMatch[];
  isLoading: boolean;
}

const SkillsMatcher: React.FC<SkillsMatcherProps> = ({ matches, isLoading }) => {
  if (isLoading) return <div className="text-sm text-devops-400 p-4">Analyzing skills gap...</div>;
  if (!matches.length) return null;

  const sortedMatches = [...matches].sort((a, b) => {
    const order = { missing: 0, partial: 1, match: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="bg-devops-800 border border-devops-700 rounded-xl p-6 mt-6">
      <h3 className="text-lg font-semibold text-white mb-4">Smart Skills Matching</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {sortedMatches.map((m, idx) => {
          let bgClass = '';
          let icon = null;
          
          switch(m.status) {
            case 'match':
              bgClass = 'bg-green-500/10 border-green-500/30 text-green-400';
              icon = <Check className="w-3 h-3" />;
              break;
            case 'partial':
              bgClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
              icon = <AlertTriangle className="w-3 h-3" />;
              break;
            case 'missing':
              bgClass = 'bg-red-500/10 border-red-500/30 text-red-400';
              icon = <X className="w-3 h-3" />;
              break;
          }

          return (
            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${bgClass} text-sm`}>
              <span className="truncate mr-2 font-mono">{m.skill}</span>
              <div className="flex-shrink-0">{icon}</div>
            </div>
          );
        })}
      </div>
      
      {matches.some(m => m.status === 'missing') && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
           <p className="text-xs text-red-300 font-medium mb-1">Critical Missing Skills:</p>
           <p className="text-xs text-devops-400">
             Consider adding specific projects or experience detailing: {matches.filter(m => m.status === 'missing').map(m => m.skill).join(', ')}.
           </p>
        </div>
      )}
    </div>
  );
};

export default SkillsMatcher;