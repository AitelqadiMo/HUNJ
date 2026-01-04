
import React, { useState } from 'react';
import { Application, ResumeData, JobAnalysis } from '../types';
import { Plus, Briefcase, Calendar, ChevronRight, User, LayoutGrid, Kanban as KanbanIcon, Globe, Search } from 'lucide-react';
import KanbanBoard from './KanbanBoard';

interface ExtendedDashboardProps {
  applications: Application[];
  masterResume: ResumeData;
  onNewApplication: () => void;
  onSelectApplication: (id: string) => void;
  onEditProfile: () => void;
  onAnalyzeJob?: (analysis: JobAnalysis, text: string) => void;
  onUpdateStatus?: (id: string, status: Application['status']) => void;
  onNavigateToJobBoard?: () => void;
}

const Dashboard: React.FC<ExtendedDashboardProps> = ({ 
  applications, 
  masterResume, 
  onNewApplication, 
  onSelectApplication,
  onUpdateStatus
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApps = applications.filter(app => 
    app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8 h-full flex flex-col pb-20 md:pb-0">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Applications</h1>
            <p className="text-slate-500 text-sm">Manage and track your active job pipeline.</p>
        </div>
        <button 
            onClick={onNewApplication}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all font-bold hover:scale-105 active:scale-95"
        >
            <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search pipeline..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LayoutGrid className="w-4 h-4" /> Grid
                </button>
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <KanbanIcon className="w-4 h-4" /> Kanban
                </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[400px]">
        {applications.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 h-full flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-blue-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No applications yet</h3>
                <p className="text-slate-500 mb-6 max-w-md text-sm md:text-base">Start tracking your first job application to get AI-powered insights tailored to your resume.</p>
                <button 
                    onClick={onNewApplication}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2"
                >
                    Create your first application &rarr;
                </button>
            </div>
        ) : viewMode === 'kanban' ? (
             <KanbanBoard 
                applications={filteredApps} 
                onSelectApplication={onSelectApplication}
                onUpdateStatus={onUpdateStatus || (() => {})}
             />
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApps.map(app => (
                    <div 
                        key={app.id}
                        onClick={() => onSelectApplication(app.id)}
                        className="group bg-white border border-slate-200 hover:border-blue-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 relative overflow-hidden active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{app.jobTitle}</h3>
                                <p className="text-slate-500 text-sm font-medium">{app.companyName}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                app.status === 'Applied' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                app.status === 'Offer' ? 'bg-green-50 border-green-200 text-green-700' :
                                app.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                                {app.status}
                            </span>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-slate-500 font-medium">ATS Score</span>
                                <span className={`font-mono font-bold ${
                                    (app.atsScore?.total || 0) > 80 ? 'text-green-600' : 'text-orange-500'
                                }`}>
                                    {app.atsScore?.total || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm px-1">
                                <span className="text-slate-400 font-medium">Probability</span>
                                <span className="font-mono text-slate-600 font-bold">
                                    {app.jobAnalysis?.hiringProbability ? `${app.jobAnalysis.hiringProbability}%` : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(app.dateCreated).toLocaleDateString()}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
