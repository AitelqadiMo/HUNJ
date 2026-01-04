import React, { useMemo } from 'react';
import { ResumeData } from '../types';
import { computeDiff, DiffPart } from '../utils/simpleDiff';
import { GitCompare, ArrowRight, FileDiff } from 'lucide-react';

interface DiffViewerProps {
  oldResume: ResumeData;
  newResume: ResumeData;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldResume, newResume }) => {
  
  const DiffText = ({ oldT, newT }: { oldT: string, newT: string }) => {
      const parts = useMemo(() => computeDiff(oldT, newT), [oldT, newT]);
      
      return (
          <span className="leading-relaxed">
              {parts.map((part, i) => (
                  <span 
                    key={i} 
                    className={`${part.added ? 'bg-green-500/20 text-green-300' : part.removed ? 'bg-red-500/20 text-red-400 line-through decoration-red-500/50' : 'text-devops-300'}`}
                  >
                      {part.value}
                  </span>
              ))}
          </span>
      );
  };

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10">
        <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GitCompare className="w-6 h-6 text-accent-500" />
                    Version Comparison
                </h2>
                <div className="flex items-center gap-4 text-sm text-devops-400">
                    <span className="px-3 py-1 bg-devops-900 rounded border border-devops-700">{oldResume.versionName || 'Original'}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="px-3 py-1 bg-devops-900 rounded border border-devops-700">{newResume.versionName || 'Current'}</span>
                </div>
            </div>

            <div className="space-y-8">
                {/* Summary Diff */}
                <div className="bg-devops-900/30 rounded-xl border border-devops-700/50 p-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <FileDiff className="w-4 h-4 text-devops-400" />
                        Professional Summary
                    </h3>
                    <div className="text-sm font-mono whitespace-pre-wrap">
                        <DiffText oldT={oldResume.summary} newT={newResume.summary} />
                    </div>
                </div>

                {/* Experience Diff */}
                <div className="bg-devops-900/30 rounded-xl border border-devops-700/50 p-6">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <FileDiff className="w-4 h-4 text-devops-400" />
                        Experience
                    </h3>
                    <div className="space-y-4">
                        {newResume.experience.map((newExp, i) => {
                            const oldExp = oldResume.experience.find(e => e.id === newExp.id) || { role: '', company: '', period: '', bullets: [], id: 'dummy' };
                            
                            return (
                                <div key={newExp.id} className="border-l-2 border-devops-700 pl-4">
                                    <div className="mb-2">
                                        <span className="font-bold text-white">{newExp.role}</span> at <span className="text-accent-400">{newExp.company}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {newExp.bullets.map((bullet, bIdx) => {
                                            const oldBulletText = oldExp.bullets[bIdx]?.text || '';
                                            return (
                                                <li key={bullet.id} className="text-sm font-mono flex gap-2">
                                                    <span className="text-devops-500">•</span>
                                                    <DiffText oldT={oldBulletText} newT={bullet.text} />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DiffViewer;