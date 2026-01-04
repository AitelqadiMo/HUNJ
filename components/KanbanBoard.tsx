import React from 'react';
import { Application } from '../types';
import { Briefcase, MoreHorizontal, Calendar, ArrowRight } from 'lucide-react';

interface KanbanBoardProps {
  applications: Application[];
  onSelectApplication: (id: string) => void;
  onUpdateStatus: (id: string, status: Application['status']) => void;
}

const COLUMNS: Application['status'][] = ['Researching', 'Drafting', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onSelectApplication, onUpdateStatus }) => {
  
  const getAppsByStatus = (status: Application['status']) => {
    return applications.filter(app => app.status === status);
  };

  // Helper to get next status for quick move
  const getNextStatus = (current: Application['status']): Application['status'] | null => {
      const idx = COLUMNS.indexOf(current);
      if (idx !== -1 && idx < COLUMNS.length - 2) return COLUMNS[idx + 1]; // Stop at Offer/Rejected
      return null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] min-h-[500px]">
      {COLUMNS.map((status) => {
        const apps = getAppsByStatus(status);
        const isTerminal = status === 'Offer' || status === 'Rejected';
        
        return (
          <div key={status} className="min-w-[280px] w-[280px] flex flex-col bg-devops-800/30 rounded-xl border border-devops-700/50 h-full">
            {/* Column Header */}
            <div className={`p-3 border-b border-devops-700/50 flex justify-between items-center rounded-t-xl ${
                status === 'Offer' ? 'bg-green-500/10 border-green-500/20' : 
                status === 'Rejected' ? 'bg-red-500/10 border-red-500/20' : 
                'bg-devops-800'
            }`}>
               <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${
                       status === 'Applied' ? 'bg-blue-500' :
                       status === 'Interviewing' ? 'bg-purple-500' :
                       status === 'Offer' ? 'bg-green-500' :
                       status === 'Rejected' ? 'bg-red-500' :
                       'bg-gray-500'
                   }`}></div>
                   <span className="font-semibold text-sm text-white">{status}</span>
                   <span className="text-xs text-devops-500 bg-devops-900 px-1.5 rounded">{apps.length}</span>
               </div>
            </div>

            {/* Column Body */}
            <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {apps.map(app => (
                    <div 
                        key={app.id} 
                        className="bg-devops-800 border border-devops-700 hover:border-accent-500/50 p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all group"
                        onClick={() => onSelectApplication(app.id)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-white line-clamp-1">{app.jobTitle}</h4>
                            <button className="text-devops-500 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-devops-300 mb-3">{app.companyName}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                             <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                 (app.atsScore?.total || 0) > 80 ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                             }`}>
                                 ATS: {app.atsScore?.total || 'N/A'}
                             </span>
                             <span className="text-[10px] text-devops-500 flex items-center gap-1">
                                 <Calendar className="w-3 h-3" />
                                 {new Date(app.dateCreated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                        </div>

                        {/* Quick Move Action (Stop propagation to prevent opening app) */}
                        {!isTerminal && (
                            <div className="mt-3 pt-2 border-t border-devops-700/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const next = getNextStatus(status);
                                        if (next) onUpdateStatus(app.id, next);
                                    }}
                                    className="text-[10px] flex items-center gap-1 text-devops-400 hover:text-accent-400 transition-colors"
                                >
                                    Move to {getNextStatus(status)} <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;