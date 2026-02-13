
import React from 'react';
import { Application } from '../types';
import { MoreHorizontal, Calendar, ArrowRight, Building2, BrainCircuit, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface KanbanBoardProps {
  applications: Application[];
  onSelectApplication: (id: string) => void;
  onUpdateStatus: (id: string, status: Application['status']) => void;
  onInspect: (id: string) => void;
}

const COLUMNS: Application['status'][] = ['Researching', 'Drafting', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onSelectApplication, onUpdateStatus, onInspect }) => {
  
  const getAppsByStatus = (status: Application['status']) => {
    return applications.filter(app => app.status === status);
  };

  const getNextStatus = (current: Application['status']): Application['status'] | null => {
      const idx = COLUMNS.indexOf(current);
      if (idx !== -1 && idx < COLUMNS.length - 2) return COLUMNS[idx + 1]; 
      return null;
  };

  // Calculate Yield % (Visual metric for the "Intelligence" feel)
  const getYield = (status: Application['status']) => {
      const total = applications.length || 1;
      const count = applications.filter(a => a.status === status).length;
      // Mock calculation for visual effect - normally would be cumulative logic
      const percentage = Math.round((count / total) * 100);
      return percentage;
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 h-full min-h-[600px] snap-x px-1">
      {COLUMNS.map((status, colIdx) => {
        const apps = getAppsByStatus(status);
        const isTerminal = status === 'Offer' || status === 'Rejected';
        const yieldRate = getYield(status);
        
        return (
          <div key={status} className="min-w-[340px] w-[340px] flex flex-col bg-slate-100/50 rounded-3xl border border-white/50 backdrop-blur-sm h-full snap-start relative group/column">
            
            {/* Column Header */}
            <div className="p-4 sticky top-0 bg-slate-100/95 backdrop-blur-md rounded-t-3xl z-10 border-b border-slate-200">
               <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white ${
                           status === 'Applied' ? 'bg-blue-500' :
                           status === 'Interviewing' ? 'bg-purple-500' :
                           status === 'Offer' ? 'bg-green-500' :
                           status === 'Rejected' ? 'bg-red-500' :
                           'bg-slate-400'
                       }`}></div>
                       <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{status}</span>
                   </div>
                   <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">{apps.length}</span>
               </div>
               
               {/* Yield Bar */}
               <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                   <div 
                        className={`h-full transition-all duration-1000 ${status === 'Rejected' ? 'bg-red-300' : 'bg-slate-400'}`} 
                        style={{ width: `${yieldRate}%` }}
                   ></div>
               </div>
               <div className="flex justify-between mt-1">
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Pipeline Volume</span>
                   <span className="text-[9px] text-slate-500 font-mono">{yieldRate}%</span>
               </div>
            </div>

            {/* Column Body */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {apps.map(app => {
                    const score = app.atsScore?.total || 0;
                    const scoreColor = score >= 80 ? 'text-green-600 bg-green-50 border-green-200' : score >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200' : score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';
                    const probability = app.jobAnalysis?.hiringProbability || 50;

                    return (
                        <div 
                            key={app.id} 
                            className="group bg-white border border-slate-200 hover:border-hunj-400 p-4 rounded-2xl cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                            onClick={() => onSelectApplication(app.id)}
                        >
                            {/* Color Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${score >= 80 ? 'bg-green-500' : 'bg-slate-300'}`}></div>

                            <div className="pl-2 relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {app.companyName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-hunj-600 transition-colors">{app.jobTitle}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                <Building2 className="w-2.5 h-2.5" /> {app.companyName}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onInspect(app.id); }}
                                        className="text-slate-300 hover:text-hunj-600 hover:bg-hunj-50 p-1.5 rounded-lg transition-colors"
                                        title="AI Insights"
                                    >
                                        <BrainCircuit className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className={`flex flex-col items-center p-1.5 rounded-lg border ${scoreColor}`}>
                                        <span className="text-lg font-bold leading-none">{score}%</span>
                                        <span className="text-[9px] uppercase font-bold opacity-70">Match</span>
                                    </div>
                                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-bold leading-none">{probability}%</span>
                                            {probability > 60 && <TrendingUp className="w-3 h-3 text-green-500"/>}
                                        </div>
                                        <span className="text-[9px] uppercase font-bold opacity-70">Prob.</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                                     <span className="font-mono">v.{app.resumes.length}</span>
                                     <span>{new Date(app.dateCreated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>

                                {/* Quick Move Action (Hover) */}
                                {!isTerminal && (
                                    <div className="absolute right-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const next = getNextStatus(status);
                                                if (next) onUpdateStatus(app.id, next);
                                            }}
                                            className="bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:bg-hunj-600 transition-colors flex items-center gap-1 text-xs font-bold pl-3 pr-2"
                                            title="Move Next"
                                        >
                                            Next Stage <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Empty State / Dropzone visual */}
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest opacity-0 group-hover/column:opacity-100 transition-opacity">
                    Drop Here
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
