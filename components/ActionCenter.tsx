
import React from 'react';
import { ATSScore, SkillMatch } from '../types';
import { Zap, ArrowRight, Wand2, Plus, AlertTriangle, Check } from 'lucide-react';

interface ActionCenterProps {
  score: ATSScore | null;
  skillMatches: SkillMatch[];
  onApplyFix: (suggestion: string) => void;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ score, skillMatches, onApplyFix }) => {
  if (!score) return null;

  // 1. Identify High Impact Actions
  const missingSkills = skillMatches.filter(m => m.status === 'missing').slice(0, 3);
  const lowQuantification = score.breakdown.quantifiable < 6;
  const formattingIssues = score.breakdown.format < 8;

  // 2. Construct Action Items
  const actions = [
      ...missingSkills.map(s => ({
          type: 'High Impact',
          label: `Add "${s.skill}" achievement`,
          desc: 'Missing critical keyword found in JD.',
          impact: '+5%',
          action: `Write a bullet point demonstrating ${s.skill} experience.`
      })),
      ...(lowQuantification ? [{
          type: 'Medium Impact',
          label: 'Quantify Results',
          desc: 'Impact score is low. Add metrics.',
          impact: '+12%',
          action: 'Add metrics to 3 bullet points.'
      }] : []),
      ...score.suggestions.slice(0, 2).map(s => ({
          type: 'Medium Impact',
          label: 'ATS Optimization',
          desc: s,
          impact: '+3%',
          action: s
      }))
  ];

  if (actions.length === 0) {
      return (
          <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-green-400 font-bold">Optimization Complete</h3>
              <p className="text-xs text-green-600/70 mt-1">Ready for submission.</p>
          </div>
      );
  }

  return (
    <div className="bg-devops-900 border border-devops-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Smart Actions
            </h3>
            <span className="text-[10px] bg-devops-800 text-devops-400 px-2 py-1 rounded border border-devops-700">{actions.length} Pending</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {actions.map((action, i) => (
                <div key={i} className="group bg-devops-950/50 border border-devops-800 hover:border-hunj-500/50 rounded-xl p-3 transition-all">
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            action.type === 'High Impact' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                            {action.type}
                        </span>
                        <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5">
                            <TrendingUpIcon className="w-3 h-3" /> {action.impact}
                        </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-200 mt-2 mb-1">{action.label}</h4>
                    <p className="text-xs text-slate-500 leading-snug mb-3">{action.desc}</p>
                    
                    <button 
                        onClick={() => onApplyFix(action.action)}
                        className="w-full py-2 bg-devops-800 hover:bg-hunj-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-devops-700 hover:border-hunj-500 group-hover:shadow-lg shadow-hunj-500/20"
                    >
                        <Wand2 className="w-3 h-3" /> Fix Now
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};

const TrendingUpIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

export default ActionCenter;
