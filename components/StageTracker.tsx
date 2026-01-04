import React from 'react';
import { Application } from '../types';
import { Search, PenTool, Send, UserCheck, CheckCircle } from 'lucide-react';

interface StageTrackerProps {
  status: Application['status'];
  probability?: number;
}

const StageTracker: React.FC<StageTrackerProps> = ({ status, probability }) => {
  const stages: Application['status'][] = ['Researching', 'Drafting', 'Applied', 'Interviewing', 'Offer'];
  
  const getStepIndex = (s: Application['status']) => stages.indexOf(s === 'Rejected' ? 'Applied' : s);
  const currentIndex = getStepIndex(status);

  const getIcon = (idx: number) => {
    switch(idx) {
        case 0: return <Search className="w-4 h-4" />;
        case 1: return <PenTool className="w-4 h-4" />;
        case 2: return <Send className="w-4 h-4" />;
        case 3: return <UserCheck className="w-4 h-4" />;
        case 4: return <CheckCircle className="w-4 h-4" />;
        default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-devops-800 border-b border-devops-700 p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Stages */}
        <div className="flex items-center w-full md:w-auto overflow-x-auto no-scrollbar">
          {stages.map((stage, idx) => {
             const isActive = idx === currentIndex;
             const isCompleted = idx < currentIndex;
             
             return (
                 <div key={idx} className="flex items-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                        isActive ? 'bg-accent-600 text-white' : 
                        isCompleted ? 'text-success bg-success/10' : 
                        'text-devops-500'
                    }`}>
                        {getIcon(idx)}
                        <span className="text-sm font-medium whitespace-nowrap">{stage}</span>
                    </div>
                    {idx < stages.length - 1 && (
                        <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-success/50' : 'bg-devops-700'}`}></div>
                    )}
                 </div>
             );
          })}
        </div>

        {/* Probability Gauge */}
        {probability !== undefined && (
            <div className="flex items-center gap-3 bg-devops-900 px-4 py-2 rounded-lg border border-devops-700">
                <span className="text-xs text-devops-400 uppercase tracking-wide">Hiring Probability</span>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-devops-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                                probability > 70 ? 'bg-success' : probability > 40 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${probability}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-bold text-white">{probability}%</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StageTracker;